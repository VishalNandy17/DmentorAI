import * as vscode from 'vscode';
import { PersonalityManager } from '../personalities/personalityManager';
import { CodeAnalyzer, CodeIssue } from '../analysis/codeAnalyzer';
import { SuggestionContext } from '../personalities/personality';
import { PersonalityResponse } from '../personalities/personality';
import { LearningSystem } from '../learning/learningSystem';
import { AIService } from '../ai/aiService';

export interface Intervention {
    id: string;
    context: SuggestionContext;
    response: PersonalityResponse;
    timestamp: Date;
    dismissed?: boolean;
    accepted?: boolean;
}

export class DMentorCore implements vscode.Disposable {
    private context: vscode.ExtensionContext;
    private personalityManager: PersonalityManager;
    private codeAnalyzer: CodeAnalyzer;
    private learningSystem: LearningSystem;
    private aiService: AIService;
    private interventions: Intervention[] = [];
    private disposables: vscode.Disposable[] = [];
    private isActive: boolean = true;
    private focusMode: boolean = false;
    private lastDocumentChange: Map<string, number> = new Map();
    private debounceDelay: number = 1000; // 1 second debounce

    constructor(
        context: vscode.ExtensionContext,
        personalityManager: PersonalityManager,
        codeAnalyzer: CodeAnalyzer,
        learningSystem: LearningSystem,
        aiService: AIService
    ) {
        this.context = context;
        this.personalityManager = personalityManager;
        this.codeAnalyzer = codeAnalyzer;
        this.learningSystem = learningSystem;
        this.aiService = aiService;

        // Listen to configuration changes
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(this.onConfigurationChange.bind(this))
        );

        // Listen to document changes
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(this.onDocumentChange.bind(this))
        );

        // Listen to save events
        this.disposables.push(
            vscode.workspace.onDidSaveTextDocument(this.onDocumentSave.bind(this))
        );
    }

    private onConfigurationChange(e: vscode.ConfigurationChangeEvent) {
        if (e.affectsConfiguration('dmentorAI')) {
            // Reload personality if changed
            this.personalityManager.getCurrentPersonality();
        }
    }

    private onDocumentChange(e: vscode.TextDocumentChangeEvent) {
        if (!this.isActive || this.focusMode) {
            return;
        }

        const config = vscode.workspace.getConfiguration('dmentorAI');
        const proactiveInterruptions = config.get<boolean>('proactiveInterruptions', true);

        if (!proactiveInterruptions) {
            return;
        }

        // Debounce analysis
        const document = e.document;
        const now = Date.now();
        const lastChange = this.lastDocumentChange.get(document.uri.toString()) || 0;

        if (now - lastChange < this.debounceDelay) {
            return;
        }

        this.lastDocumentChange.set(document.uri.toString(), now);

        // Schedule analysis
        setTimeout(() => {
            this.analyzeDocument(document);
        }, this.debounceDelay);
    }

    private onDocumentSave(document: vscode.TextDocument) {
        const config = vscode.workspace.getConfiguration('dmentorAI');
        const autoReview = config.get<boolean>('autoReviewOnSave', true);

        if (autoReview && !this.focusMode) {
            this.analyzeDocument(document);
        }
    }

    async analyzeDocument(document: vscode.TextDocument): Promise<void> {
        try {
            let issues = await this.codeAnalyzer.analyzeDocument(document);
            
            if (issues.length === 0) {
                return;
            }

            // Apply learning system filters
            issues = issues.filter(issue => this.learningSystem.shouldShowIssue(issue));

            // Check rate limiting
            const config = vscode.workspace.getConfiguration('dmentorAI');
            const maxSuggestions = config.get<number>('maxSuggestionsPerMinute', 3);
            const frequency = config.get<string>('interventionFrequency', 'balanced');

            // Filter issues based on frequency setting
            let filteredIssues = issues;
            if (frequency === 'minimal') {
                filteredIssues = issues.filter(i => i.severity === 'critical');
            } else if (frequency === 'balanced') {
                filteredIssues = issues.filter(i => i.severity !== 'info' || i.type === 'security');
            }

            // Limit number of suggestions
            const limitedIssues = filteredIssues.slice(0, maxSuggestions);

            for (const issue of limitedIssues) {
                await this.createIntervention(issue, document);
            }
        } catch (error) {
            console.error('Error analyzing document:', error);
        }
    }

    private async createIntervention(issue: CodeIssue, document: vscode.TextDocument): Promise<void> {
        const personality = this.personalityManager.getCurrentPersonality();
        const suggestionContext = this.codeAnalyzer.convertToSuggestionContext(issue);
        
        // Enhance with AI if available and enabled
        const config = vscode.workspace.getConfiguration('dmentorAI');
        const useAI = config.get<boolean>('useAIEnhancement', false);
        
        let enhancedSuggestion = suggestionContext.suggestion;
        if (useAI && this.aiService.isConfigured()) {
            try {
                const codeContext = document.getText();
                const aiAnalysis = await this.aiService.analyzeCodeWithAI(
                    codeContext,
                    document.languageId,
                    issue.type
                );
                if (aiAnalysis) {
                    enhancedSuggestion = aiAnalysis;
                }
            } catch (error) {
                console.error('AI enhancement failed, using default suggestion:', error);
            }
        }

        if (enhancedSuggestion) {
            suggestionContext.suggestion = enhancedSuggestion;
        }

        const response = personality.respondToIssue(suggestionContext);

        const intervention: Intervention = {
            id: `${Date.now()}-${Math.random()}`,
            context: suggestionContext,
            response,
            timestamp: new Date()
        };

        this.interventions.push(intervention);

        // Emit event for UI to handle
        this.onInterventionCreated(intervention);
    }

    private onInterventionCreated(intervention: Intervention): void {
        // This will be handled by the UI components
        vscode.commands.executeCommand('dmentor.onInterventionCreated', intervention);
    }

    startProactiveAnalysis(): void {
        this.isActive = true;
    }

    stopProactiveAnalysis(): void {
        this.isActive = false;
    }

    toggleInterventions(): boolean {
        this.isActive = !this.isActive;
        return this.isActive;
    }

    isInterventionsActive(): boolean {
        return this.isActive;
    }

    setFocusMode(enabled: boolean): void {
        this.focusMode = enabled;
    }

    getFocusMode(): boolean {
        return this.focusMode;
    }

    getInterventions(): Intervention[] {
        return this.interventions.filter(i => !i.dismissed);
    }

    getPersonalityManager(): PersonalityManager {
        return this.personalityManager;
    }

    getCodeAnalyzer(): CodeAnalyzer {
        return this.codeAnalyzer;
    }

    async requestReview(document?: vscode.TextDocument): Promise<Intervention[]> {
        const doc = document || vscode.window.activeTextEditor?.document;
        if (!doc) {
            vscode.window.showWarningMessage('No active document to review');
            return [];
        }

        const issues = await this.codeAnalyzer.analyzeDocument(doc);
        const interventions: Intervention[] = [];

        for (const issue of issues) {
            const personality = this.personalityManager.getCurrentPersonality();
            const suggestionContext = this.codeAnalyzer.convertToSuggestionContext(issue);
            const response = personality.respondToIssue(suggestionContext);

            interventions.push({
                id: `${Date.now()}-${Math.random()}`,
                context: suggestionContext,
                response,
                timestamp: new Date()
            });
        }

        this.interventions.push(...interventions);
        return interventions;
    }

    dismissIntervention(id: string, feedback?: string): void {
        const intervention = this.interventions.find(i => i.id === id);
        if (intervention) {
            intervention.dismissed = true;
            this.learningSystem.recordFeedback(intervention, 'dismissed', feedback);
        }
    }

    acceptIntervention(id: string): void {
        const intervention = this.interventions.find(i => i.id === id);
        if (intervention) {
            intervention.accepted = true;
            this.learningSystem.recordFeedback(intervention, 'accepted');
        }
    }

    getLearningSystem(): LearningSystem {
        return this.learningSystem;
    }

    getAIService(): AIService {
        return this.aiService;
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.interventions = [];
    }
}

