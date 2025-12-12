import * as vscode from 'vscode';
import { DMentorCore } from '../core/dmentorCore';

export class StatusBarManager implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;
    private core: DMentorCore;
    private context: vscode.ExtensionContext;
    private interventionCount: number = 0;

    constructor(context: vscode.ExtensionContext, core: DMentorCore) {
        this.context = context;
        this.core = core;
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100 // Priority - lower number = more to the left
        );
    }

    initialize(): void {
        this.statusBarItem.command = 'dmentor.openPanel';
        this.statusBarItem.tooltip = 'DMentor AI - Click to open suggestions panel';
        this.updateStatusBar();
        this.statusBarItem.show();

        // Listen for intervention changes via the command execution
        // Note: The command is registered in SuggestionManager, we just need to update when it's executed
        // We'll update the status bar when interventions are added to the core
        const updateInterval = setInterval(() => {
            const interventions = this.core.getInterventions();
            const newCount = interventions.length;
            if (newCount !== this.interventionCount) {
                this.interventionCount = newCount;
                this.updateStatusBar();
            }
        }, 1000); // Check every second

        this.context.subscriptions.push({
            dispose: () => clearInterval(updateInterval)
        });
    }

    updateStatusBar(): void {
        const isActive = this.core.isInterventionsActive();
        const focusMode = this.core.getFocusMode();
        const personalityType = this.core.getPersonalityManager().getPersonalityType();
        
        let icon = '👻';
        let text = 'DMentor';
        let backgroundColor: vscode.ThemeColor | undefined;
        let color: vscode.ThemeColor | undefined;

        if (focusMode) {
            icon = '😌';
            text = 'DMentor (Focus Mode)';
            backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        } else if (!isActive) {
            icon = '😴';
            text = 'DMentor (Paused)';
            backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
        } else {
            // Show personality indicator
            const personalityIcons: { [key: string]: string } = {
                'strict-mentor': '👨‍🏫',
                'creative-collaborator': '🤝',
                'rubber-duck': '🦆',
                'security-guardian': '🛡️',
                'performance-optimizer': '⚡',
                'accessibility-advocate': '♿'
            };
            icon = personalityIcons[personalityType] || '👻';
            
            if (this.interventionCount > 0) {
                text = `DMentor (${this.interventionCount})`;
                backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                color = new vscode.ThemeColor('statusBarItem.errorForeground');
            } else {
                text = 'DMentor';
            }
        }

        this.statusBarItem.text = `${icon} ${text}`;
        this.statusBarItem.backgroundColor = backgroundColor;
        this.statusBarItem.color = color;
        this.statusBarItem.tooltip = this.buildTooltip(personalityType, isActive, focusMode);
    }

    private buildTooltip(personalityType: string, isActive: boolean, focusMode: boolean): string {
        const personalityNames: { [key: string]: string } = {
            'strict-mentor': 'Strict Mentor',
            'creative-collaborator': 'Creative Collaborator',
            'rubber-duck': 'Rubber Duck',
            'security-guardian': 'Security Guardian',
            'performance-optimizer': 'Performance Optimizer',
            'accessibility-advocate': 'Accessibility Advocate'
        };

        let tooltip = `DMentor AI - ${personalityNames[personalityType] || 'Active'}\n`;
        tooltip += `Interventions: ${isActive ? 'Active' : 'Paused'}\n`;
        if (focusMode) {
            tooltip += 'Focus Mode: Enabled\n';
        }
        if (this.interventionCount > 0) {
            tooltip += `Pending suggestions: ${this.interventionCount}\n`;
        }
        tooltip += '\nClick to open suggestions panel';
        return tooltip;
    }

    resetInterventionCount(): void {
        this.interventionCount = 0;
        this.updateStatusBar();
    }

    setInterventionCount(count: number): void {
        this.interventionCount = count;
        this.updateStatusBar();
    }

    dispose() {
        this.statusBarItem.dispose();
    }
}

