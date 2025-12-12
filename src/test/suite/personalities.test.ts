import * as assert from 'assert';
import * as vscode from 'vscode';
import { PersonalityManager } from '../../personalities/personalityManager';
import { StrictMentor } from '../../personalities/strictMentor';
import { CreativeCollaborator } from '../../personalities/creativeCollaborator';
import { RubberDuck } from '../../personalities/rubberDuck';
import { SecurityGuardian } from '../../personalities/securityGuardian';
import { PerformanceOptimizer } from '../../personalities/performanceOptimizer';
import { AccessibilityAdvocate } from '../../personalities/accessibilityAdvocate';
import { SuggestionContext } from '../../personalities/personality';

suite('Personality Tests', () => {
    let context: vscode.ExtensionContext;

    suiteSetup(() => {
        // Create a mock extension context for testing
        context = {
            subscriptions: [],
            workspaceState: {} as any,
            globalState: {} as any,
            extensionPath: '',
            storagePath: '',
            globalStoragePath: '',
            logPath: '',
            extensionUri: vscode.Uri.parse('file:///test'),
            environmentVariableCollection: {} as any,
            secrets: {} as any,
            extensionMode: vscode.ExtensionMode.Test,
            extension: {} as any,
            storageUri: undefined,
            globalStorageUri: undefined,
            logUri: undefined,
            extensionRuntime: 1,
            asAbsolutePath: (relativePath: string) => relativePath,
            languageModelAccessInformation: {} as any
        } as unknown as vscode.ExtensionContext;
    });

    test('PersonalityManager should initialize', () => {
        const manager = new PersonalityManager(context);
        assert.ok(manager);
        assert.ok(manager.getCurrentPersonality());
    });

    test('StrictMentor should respond to issues', () => {
        const mentor = new StrictMentor();
        const context: SuggestionContext = {
            filePath: 'test.js',
            lineNumber: 1,
            code: 'test code',
            issueType: 'bug',
            severity: 'critical',
            description: 'Test bug',
            suggestion: 'Fix it'
        };

        const response = mentor.respondToIssue(context);
        assert.ok(response);
        assert.ok(response.message);
        assert.equal(response.icon, '🚨');
    });

    test('CreativeCollaborator should respond supportively', () => {
        const collaborator = new CreativeCollaborator();
        const context: SuggestionContext = {
            filePath: 'test.js',
            lineNumber: 1,
            code: 'test code',
            issueType: 'bug',
            severity: 'warning',
            description: 'Potential issue',
            suggestion: 'Consider fixing'
        };

        const response = collaborator.respondToIssue(context);
        assert.ok(response);
        assert.equal(response.tone, 'supportive');
    });

    test('RubberDuck should ask questions', () => {
        const duck = new RubberDuck();
        const context: SuggestionContext = {
            filePath: 'test.js',
            lineNumber: 1,
            code: 'test code',
            issueType: 'bug',
            severity: 'info',
            description: 'Potential issue',
            suggestion: 'Think about it'
        };

        const response = duck.respondToIssue(context);
        assert.ok(response);
        assert.equal(response.tone, 'questioning');
        assert.ok(response.message.includes('Question:'));
    });

    test('SecurityGuardian should prioritize security', () => {
        const guardian = new SecurityGuardian();
        const context: SuggestionContext = {
            filePath: 'test.js',
            lineNumber: 1,
            code: 'eval(userInput)',
            issueType: 'security',
            severity: 'critical',
            description: 'Security vulnerability',
            suggestion: 'Use safe methods'
        };

        const response = guardian.respondToIssue(context);
        assert.ok(response);
        assert.equal(response.icon, '🛡️');
        assert.ok(response.message.toLowerCase().includes('security'));
    });

    test('PerformanceOptimizer should focus on performance', () => {
        const optimizer = new PerformanceOptimizer();
        const context: SuggestionContext = {
            filePath: 'test.js',
            lineNumber: 1,
            code: 'for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) {} }',
            issueType: 'performance',
            severity: 'warning',
            description: 'Nested loop detected',
            suggestion: 'Use Map for O(1) lookup'
        };

        const response = optimizer.respondToIssue(context);
        assert.ok(response);
        assert.equal(response.icon, '⚡');
        assert.ok(response.message.toLowerCase().includes('performance'));
    });

    test('AccessibilityAdvocate should focus on accessibility', () => {
        const advocate = new AccessibilityAdvocate();
        const context: SuggestionContext = {
            filePath: 'test.html',
            lineNumber: 1,
            code: '<img src="image.jpg">',
            issueType: 'accessibility',
            severity: 'warning',
            description: 'Missing alt text',
            suggestion: 'Add alt attribute'
        };

        const response = advocate.respondToIssue(context);
        assert.ok(response);
        assert.equal(response.icon, '♿');
        assert.ok(response.message.toLowerCase().includes('accessibility'));
    });
});

