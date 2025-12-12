import * as vscode from 'vscode';
import { DMentorCore } from '../core/dmentorCore';
import { PersonalityManager } from '../personalities/personalityManager';
import { SuggestionManager } from '../ui/suggestionManager';
import { InsightsDashboard } from '../ui/insightsDashboard';
import { StatusBarManager } from '../ui/statusBarManager';
import { TeamSyncService } from '../sync/teamSyncService';
import { VoiceService } from '../voice/voiceService';

export class CommandManager implements vscode.Disposable {
    private context: vscode.ExtensionContext;
    private core: DMentorCore;
    private personalityManager: PersonalityManager;
    private suggestionManager: SuggestionManager;
    private insightsDashboard: InsightsDashboard;
    private statusBarManager!: StatusBarManager; // Will be set via setStatusBarManager
    private disposables: vscode.Disposable[] = [];

    constructor(
        context: vscode.ExtensionContext,
        core: DMentorCore,
        personalityManager: PersonalityManager,
        suggestionManager: SuggestionManager,
        insightsDashboard: InsightsDashboard
    ) {
        this.context = context;
        this.core = core;
        this.personalityManager = personalityManager;
        this.suggestionManager = suggestionManager;
        this.insightsDashboard = insightsDashboard;
        
        // Get statusBarManager from extension if needed
        // For now, we'll work with what we have
    }

    registerAll(): void {
        this.disposables.push(
            vscode.commands.registerCommand('dmentor.openPanel', () => {
                this.suggestionManager.openPanel();
            }),

            vscode.commands.registerCommand('dmentor.switchPersonality', () => {
                this.personalityManager.switchPersonality();
            }),

            vscode.commands.registerCommand('dmentor.requestReview', async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showWarningMessage('No active editor to review');
                    return;
                }

                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "DMentor is reviewing your code...",
                    cancellable: false
                }, async (_progress) => {
                    const interventions = await this.core.requestReview(editor.document);
                    
                    if (interventions.length === 0) {
                        vscode.window.showInformationMessage('✨ No issues found! Great job!');
                    } else {
                        this.suggestionManager.openPanel();
                        vscode.window.showInformationMessage(
                            `👻 DMentor found ${interventions.length} suggestion(s)`,
                            'View Suggestions'
                        );
                    }
                });
            }),

            vscode.commands.registerCommand('dmentor.askQuestion', async () => {
                const question = await vscode.window.showInputBox({
                    prompt: 'Ask DMentor a question about your code',
                    placeHolder: 'e.g., "Is this secure?" or "How can I optimize this?"'
                });

                if (question) {
                    const aiService = this.core.getAIService();
                    const editor = vscode.window.activeTextEditor;
                    const codeContext = editor?.document.getText();

                    vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: "DMentor is thinking...",
                        cancellable: false
                    }, async () => {
                        try {
                            const answer = await aiService.answerQuestion(question, codeContext);
                            const panel = vscode.window.createWebviewPanel(
                                'dmentorAnswer',
                                'DMentor Answer',
                                vscode.ViewColumn.Beside,
                                { enableScripts: true }
                            );
                            panel.webview.html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: var(--vscode-font-family); padding: 20px;">
    <h2>💬 Your Question</h2>
    <p style="background: var(--vscode-textBlockQuote-background); padding: 10px; border-radius: 4px;">${question}</p>
    <h2>👻 DMentor's Answer</h2>
    <div style="white-space: pre-wrap; line-height: 1.6;">${answer.replace(/\n/g, '<br>')}</div>
</body>
</html>`;
                        } catch (error) {
                            vscode.window.showErrorMessage(`Failed to get answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        }
                    });
                }
            }),

            vscode.commands.registerCommand('dmentor.toggleInterventions', () => {
                const isActive = this.core.toggleInterventions();
                const message = isActive 
                    ? '👻 DMentor interventions enabled' 
                    : '😴 DMentor interventions paused';
                vscode.window.showInformationMessage(message);
            }),

            vscode.commands.registerCommand('dmentor.viewInsights', () => {
                this.insightsDashboard.openDashboard();
            }),

            vscode.commands.registerCommand('dmentor.enableFocusMode', () => {
                const currentFocusMode = this.core.getFocusMode();
                this.core.setFocusMode(!currentFocusMode);
                const message = !currentFocusMode 
                    ? '😌 Focus mode enabled - DMentor will be quieter' 
                    : '👻 Focus mode disabled - DMentor is back to normal';
                vscode.window.showInformationMessage(message);
            }),

            vscode.commands.registerCommand('dmentor.voiceAsk', async () => {
                const voiceService = (this as any).voiceService || new VoiceService(this.context);
                try {
                    vscode.window.showInformationMessage('🎤 Listening... Speak your question.');
                    const question = await voiceService.listen();
                    if (question) {
                        vscode.commands.executeCommand('dmentor.askQuestion');
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(`Voice input failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }),

            vscode.commands.registerCommand('dmentor.syncTeam', async () => {
                const teamSyncService = (this as any).teamSyncService || new TeamSyncService(this.context);
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Syncing team preferences...",
                    cancellable: false
                }, async () => {
                    const success = await teamSyncService.syncWithTeam();
                    if (success) {
                        vscode.window.showInformationMessage('✅ Team preferences synced successfully');
                    }
                });
            }),

            vscode.commands.registerCommand('dmentor.viewLearningStats', () => {
                const learningSystem = this.core.getLearningSystem();
                const stats = learningSystem.getLearningStats();
                const rules = learningSystem.getAdaptationRules();
                
                const panel = vscode.window.createWebviewPanel(
                    'learningStats',
                    'DMentor Learning Statistics',
                    vscode.ViewColumn.Beside,
                    { enableScripts: true }
                );
                
                panel.webview.html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: var(--vscode-font-family); padding: 20px;">
    <h1>📊 Learning Statistics</h1>
    <div style="margin: 20px 0;">
        <h2>Feedback Summary</h2>
        <p>Total Feedback: ${stats.totalFeedback}</p>
        <p>✅ Accepted: ${stats.accepted}</p>
        <p>❌ Dismissed: ${stats.dismissed}</p>
        <p>✏️ Modified: ${stats.modified}</p>
    </div>
    <div style="margin: 20px 0;">
        <h2>Adaptation Rules</h2>
        <p>Skip Patterns: ${rules.skipPatterns.length}</p>
        <p>Preferred Patterns: ${rules.preferredPatterns.length}</p>
    </div>
</body>
</html>`;
            })
        );
    }

    setStatusBarManager(statusBarManager: StatusBarManager): void {
        this.statusBarManager = statusBarManager;
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}

