import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { CodeAnalyzer } from '../../analysis/codeAnalyzer';

suite('Code Analyzer Tests', () => {
    let analyzer: CodeAnalyzer;
    let context: vscode.ExtensionContext;
    let tempDir: string;

    suiteSetup(() => {
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

        analyzer = new CodeAnalyzer(context);
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dmentor-test-'));
    });

    suiteTeardown(() => {
        // Cleanup temp directory
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
        } catch {
            // Ignore cleanup errors
        }
    });

    async function createTestFile(content: string, language: string, filename: string): Promise<vscode.TextDocument> {
        const filePath = path.join(tempDir, filename);
        fs.writeFileSync(filePath, content);
        const uri = vscode.Uri.file(filePath);
        return await vscode.workspace.openTextDocument(uri);
    }

    test('CodeAnalyzer should detect potential null access in JavaScript', async () => {
        const code = 'const user = getUser();\nconst name = user.name;';
        const doc = await createTestFile(code, 'javascript', 'test.js');

        const issues = await analyzer.analyzeDocument(doc);
        // Should detect potential null/undefined access
        assert.ok(issues.length > 0, 'Should detect potential issues');
    });

    test('CodeAnalyzer should detect SQL injection patterns', async () => {
        const code = 'const query = "SELECT * FROM users WHERE id = " + userId;';
        const doc = await createTestFile(code, 'javascript', 'test-sql.js');

        // Reset rate limiting by creating a new analyzer instance
        const testAnalyzer = new CodeAnalyzer(context);
        const issues = await testAnalyzer.analyzeDocument(doc);
        const securityIssues = issues.filter(i => i.type === 'security');
        assert.ok(securityIssues.length > 0, 'Should detect SQL injection vulnerability');
    });

    test('CodeAnalyzer should detect XSS vulnerabilities', async () => {
        const code = 'element.innerHTML = userInput;';
        const doc = await createTestFile(code, 'javascript', 'test-xss.js');

        const testAnalyzer = new CodeAnalyzer(context);
        const issues = await testAnalyzer.analyzeDocument(doc);
        const securityIssues = issues.filter(i => i.type === 'security' && i.message.includes('XSS'));
        assert.ok(securityIssues.length > 0, 'Should detect XSS vulnerability');
    });

    test('CodeAnalyzer should detect missing alt attributes', async () => {
        const code = '<img src="image.jpg">';
        const doc = await createTestFile(code, 'html', 'test.html');

        const testAnalyzer = new CodeAnalyzer(context);
        const issues = await testAnalyzer.analyzeDocument(doc);
        const accessibilityIssues = issues.filter(i => i.type === 'accessibility');
        assert.ok(accessibilityIssues.length > 0, 'Should detect missing alt attribute');
    });

    test('CodeAnalyzer should convert issues to suggestion context', () => {
        const issue = {
            type: 'bug' as const,
            severity: 'warning' as const,
            line: 1,
            message: 'Test issue',
            code: 'test code',
            suggestion: 'Fix it',
            filePath: 'test.js'
        };

        const context = analyzer.convertToSuggestionContext(issue);
        assert.equal(context.lineNumber, 1);
        assert.equal(context.issueType, 'bug');
        assert.equal(context.severity, 'warning');
    });
});

