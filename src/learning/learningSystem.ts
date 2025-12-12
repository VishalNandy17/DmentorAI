import * as vscode from 'vscode';
import { Intervention } from '../core/dmentorCore';
import { CodeIssue } from '../analysis/codeAnalyzer';

export interface UserFeedback {
    interventionId: string;
    action: 'accepted' | 'dismissed' | 'modified';
    feedback?: string;
    timestamp: Date;
    issueType: string;
    personality: string;
}

export interface LearningPattern {
    pattern: string;
    issueType: string;
    userReaction: 'preferred' | 'rejected' | 'neutral';
    count: number;
    lastUpdated: Date;
}

export interface AdaptationRules {
    skipPatterns: string[]; // Patterns the user consistently rejects
    preferredPatterns: string[]; // Patterns the user prefers
    personalityAdjustments: { [personality: string]: number }; // Preference scores
    issueTypeSensitivity: { [issueType: string]: number }; // 0-1, how sensitive to show
}

export class LearningSystem {
    private context: vscode.ExtensionContext;
    private feedbackHistory: UserFeedback[] = [];
    private learningPatterns: Map<string, LearningPattern> = new Map();
    private adaptationRules!: AdaptationRules;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadLearningData();
        this.loadAdaptationRules();
    }

    private loadLearningData(): void {
        const stored = this.context.globalState.get<UserFeedback[]>('dmentor.learning.feedback', []);
        this.feedbackHistory = stored.map(f => ({
            ...f,
            timestamp: new Date(f.timestamp)
        }));

        const patterns = this.context.globalState.get<LearningPattern[]>('dmentor.learning.patterns', []);
        patterns.forEach(p => {
            this.learningPatterns.set(p.pattern, {
                ...p,
                lastUpdated: new Date(p.lastUpdated)
            });
        });
    }

    private loadAdaptationRules(): void {
        const stored = this.context.globalState.get<AdaptationRules>('dmentor.learning.adaptation', {
            skipPatterns: [],
            preferredPatterns: [],
            personalityAdjustments: {},
            issueTypeSensitivity: {}
        });

        this.adaptationRules = stored;
    }

    private saveLearningData(): void {
        this.context.globalState.update('dmentor.learning.feedback', this.feedbackHistory);
        
        const patternsArray = Array.from(this.learningPatterns.values());
        this.context.globalState.update('dmentor.learning.patterns', patternsArray);
    }

    private saveAdaptationRules(): void {
        this.context.globalState.update('dmentor.learning.adaptation', this.adaptationRules);
    }

    recordFeedback(intervention: Intervention, action: 'accepted' | 'dismissed' | 'modified', feedback?: string): void {
        const userFeedback: UserFeedback = {
            interventionId: intervention.id,
            action,
            feedback,
            timestamp: new Date(),
            issueType: intervention.context.issueType,
            personality: intervention.response.message.substring(0, 50) // Simplified pattern
        };

        this.feedbackHistory.push(userFeedback);
        this.updateLearningPatterns(intervention, action);
        this.updateAdaptationRules(intervention, action);
        this.saveLearningData();
        this.saveAdaptationRules();

        // Keep only last 1000 feedback entries
        if (this.feedbackHistory.length > 1000) {
            this.feedbackHistory = this.feedbackHistory.slice(-1000);
        }
    }

    private updateLearningPatterns(intervention: Intervention, action: 'accepted' | 'dismissed' | 'modified'): void {
        const pattern = this.extractPattern(intervention);
        const existing = this.learningPatterns.get(pattern) || {
            pattern,
            issueType: intervention.context.issueType,
            userReaction: 'neutral' as const,
            count: 0,
            lastUpdated: new Date()
        };

        existing.count++;
        existing.lastUpdated = new Date();

        if (action === 'accepted') {
            existing.userReaction = 'preferred';
        } else if (action === 'dismissed') {
            existing.userReaction = 'rejected';
        } else {
            existing.userReaction = 'neutral';
        }

        this.learningPatterns.set(pattern, existing);
    }

    private extractPattern(intervention: Intervention): string {
        // Create a pattern from the intervention
        return `${intervention.context.issueType}:${intervention.context.code.substring(0, 30)}`;
    }

    private updateAdaptationRules(intervention: Intervention, action: 'accepted' | 'dismissed' | 'modified'): void {
        const pattern = this.extractPattern(intervention);
        const issueType = intervention.context.issueType;

        if (action === 'dismissed') {
            // If user consistently dismisses this pattern, skip it
            const patternCount = this.learningPatterns.get(pattern)?.count || 0;
            if (patternCount >= 3 && !this.adaptationRules.skipPatterns.includes(pattern)) {
                this.adaptationRules.skipPatterns.push(pattern);
                vscode.window.showInformationMessage(`DMentor learned: Will reduce ${issueType} suggestions like this.`);
            }
        } else if (action === 'accepted') {
            // Track preferred patterns
            if (!this.adaptationRules.preferredPatterns.includes(pattern)) {
                this.adaptationRules.preferredPatterns.push(pattern);
            }
        }

        // Adjust issue type sensitivity
        if (!this.adaptationRules.issueTypeSensitivity[issueType]) {
            this.adaptationRules.issueTypeSensitivity[issueType] = 1.0;
        }

        if (action === 'dismissed') {
            this.adaptationRules.issueTypeSensitivity[issueType] = Math.max(0.3, 
                this.adaptationRules.issueTypeSensitivity[issueType] - 0.1);
        } else if (action === 'accepted') {
            this.adaptationRules.issueTypeSensitivity[issueType] = Math.min(1.0, 
                this.adaptationRules.issueTypeSensitivity[issueType] + 0.05);
        }
    }

    shouldShowIssue(issue: CodeIssue): boolean {
        const pattern = `${issue.type}:${issue.code.substring(0, 30)}`;
        
        // Skip if in skip patterns
        if (this.adaptationRules.skipPatterns.includes(pattern)) {
            return false;
        }

        // Check sensitivity threshold
        const sensitivity = this.adaptationRules.issueTypeSensitivity[issue.type] || 1.0;
        if (sensitivity < 0.5 && issue.severity !== 'critical') {
            return false;
        }

        return true;
    }

    getAdaptationRules(): AdaptationRules {
        return { ...this.adaptationRules };
    }

    getFeedbackHistory(): UserFeedback[] {
        return [...this.feedbackHistory];
    }

    getLearningStats(): { totalFeedback: number; accepted: number; dismissed: number; modified: number } {
        return {
            totalFeedback: this.feedbackHistory.length,
            accepted: this.feedbackHistory.filter(f => f.action === 'accepted').length,
            dismissed: this.feedbackHistory.filter(f => f.action === 'dismissed').length,
            modified: this.feedbackHistory.filter(f => f.action === 'modified').length
        };
    }

    resetLearningData(): void {
        this.feedbackHistory = [];
        this.learningPatterns.clear();
        this.adaptationRules = {
            skipPatterns: [],
            preferredPatterns: [],
            personalityAdjustments: {},
            issueTypeSensitivity: {}
        };
        this.saveLearningData();
        this.saveAdaptationRules();
        vscode.window.showInformationMessage('DMentor learning data has been reset.');
    }
}

