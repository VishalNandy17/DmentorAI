import * as vscode from 'vscode';
import { DMentorCore } from './core/dmentorCore';
import { PersonalityManager } from './personalities/personalityManager';
import { CodeAnalyzer } from './analysis/codeAnalyzer';
import { SuggestionManager } from './ui/suggestionManager';
import { StatusBarManager } from './ui/statusBarManager';
import { InsightsDashboard } from './ui/insightsDashboard';
import { CommandManager } from './commands/commandManager';
import { LearningSystem } from './learning/learningSystem';
import { AIService } from './ai/aiService';
import { TeamSyncService } from './sync/teamSyncService';
import { VoiceService } from './voice/voiceService';

let dmentorCore: DMentorCore;
let statusBarManager: StatusBarManager;
let suggestionManager: SuggestionManager;
let insightsDashboard: InsightsDashboard;

export function activate(context: vscode.ExtensionContext) {
    console.log('DMentor AI is now active! 👻');

    // Initialize core components
    const personalityManager = new PersonalityManager(context);
    const codeAnalyzer = new CodeAnalyzer(context);
    const learningSystem = new LearningSystem(context);
    const aiService = new AIService(context);
    const teamSyncService = new TeamSyncService(context);
    const voiceService = new VoiceService(context);
    
    dmentorCore = new DMentorCore(context, personalityManager, codeAnalyzer, learningSystem, aiService);
    statusBarManager = new StatusBarManager(context, dmentorCore);
    suggestionManager = new SuggestionManager(context, dmentorCore);
    insightsDashboard = new InsightsDashboard(context, dmentorCore);
    
    // Initialize command manager
    const commandManager = new CommandManager(
        context,
        dmentorCore,
        personalityManager,
        suggestionManager,
        insightsDashboard
    );
    // Set optional services
    (commandManager as any).teamSyncService = teamSyncService;
    (commandManager as any).voiceService = voiceService;
    commandManager.setStatusBarManager(statusBarManager);
    commandManager.registerAll();

    // Initialize status bar (lower navbar)
    statusBarManager.initialize();

    // Start proactive code analysis
    dmentorCore.startProactiveAnalysis();

    // Register disposables
    context.subscriptions.push(dmentorCore);
    context.subscriptions.push(statusBarManager);
    context.subscriptions.push(suggestionManager);
    context.subscriptions.push(insightsDashboard);
    context.subscriptions.push(commandManager);
    context.subscriptions.push(teamSyncService);
    context.subscriptions.push(voiceService);

    // Show welcome message on first activation
    const isFirstActivation = context.globalState.get('dmentor.firstActivation', true);
    if (isFirstActivation) {
        showWelcomeMessage(context);
        context.globalState.update('dmentor.firstActivation', false);
    }
}

function showWelcomeMessage(_context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage(
        '👻 DMentor AI activated! Your proactive pair programmer is ready.',
        'Choose Personality',
        'Get Started'
    ).then((selection: string | undefined) => {
        if (selection === 'Choose Personality') {
            vscode.commands.executeCommand('dmentor.switchPersonality');
        }
    });
}

export function deactivate() {
    if (dmentorCore) {
        dmentorCore.dispose();
    }
    if (statusBarManager) {
        statusBarManager.dispose();
    }
    if (suggestionManager) {
        suggestionManager.dispose();
    }
    if (insightsDashboard) {
        insightsDashboard.dispose();
    }
}

