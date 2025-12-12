import * as vscode from 'vscode';
import { SuggestionContext } from '../personalities/personality';

export interface CodeIssue {
    type: 'bug' | 'security' | 'performance' | 'style' | 'accessibility' | 'code-smell';
    severity: 'critical' | 'warning' | 'info';
    line: number;
    column?: number;
    message: string;
    code: string;
    suggestion?: string;
    filePath: string;
}

export class CodeAnalyzer {
    private context: vscode.ExtensionContext;
    private diagnosticCollection: vscode.DiagnosticCollection;
    private analysisDelay: NodeJS.Timeout | null = null;
    private lastAnalysisTime: Map<string, number> = new Map();
    private suggestionsRateLimit: number = 0;
    private lastSuggestionTime: number = 0;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('dmentorAI');
        context.subscriptions.push(this.diagnosticCollection);
    }

    async analyzeDocument(document: vscode.TextDocument): Promise<CodeIssue[]> {
        const config = vscode.workspace.getConfiguration('dmentorAI');
        const proactiveInterruptions = config.get<boolean>('proactiveInterruptions', true);

        if (!proactiveInterruptions || document.uri.scheme !== 'file') {
            return [];
        }

        // Rate limiting
        const now = Date.now();
        if (now - this.lastSuggestionTime < 20000) { // 20 seconds between analyses
            return [];
        }
        this.lastSuggestionTime = now;

        const text = document.getText();
        const languageId = document.languageId;
        const issues: CodeIssue[] = [];

        // Analyze based on language
        switch (languageId) {
            case 'javascript':
            case 'typescript':
                issues.push(...this.analyzeJavaScript(text, document.fileName));
                break;
            case 'python':
                issues.push(...this.analyzePython(text, document.fileName));
                break;
            case 'html':
            case 'vue':
            case 'svelte':
                issues.push(...this.analyzeHTML(text, document.fileName));
                break;
            default:
                // Generic analysis for other languages
                issues.push(...this.analyzeGeneric(text, document.fileName, languageId));
        }

        return issues;
    }

    private analyzeJavaScript(code: string, filePath: string): CodeIssue[] {
        const issues: CodeIssue[] = [];
        const lines = code.split('\n');

        lines.forEach((line, index) => {
            const lineNum = index + 1;

            // Check for potential null/undefined access
            if (line.match(/\.\w+\s*[;)}]/) && !line.includes('?.') && !line.includes('||') && !line.includes('if')) {
                issues.push({
                    type: 'bug',
                    severity: 'warning',
                    line: lineNum,
                    message: 'Potential null/undefined access without optional chaining or null check',
                    code: line.trim(),
                    filePath,
                    suggestion: `Consider using optional chaining (?.) or adding a null check: ${line.trim().replace(/\.(\w+)/, '?.$1')}`
                });
            }

            // Check for SQL injection patterns
            if (line.match(/query\s*=\s*["'`].*\+\s*\w+|query\s*=\s*\w+\s*\+/i)) {
                issues.push({
                    type: 'security',
                    severity: 'critical',
                    line: lineNum,
                    message: 'Potential SQL injection vulnerability detected',
                    code: line.trim(),
                    filePath,
                    suggestion: 'Use parameterized queries or prepared statements instead of string concatenation'
                });
            }

            // Check for XSS patterns
            if (line.match(/innerHTML\s*=|document\.write|eval\(/i)) {
                issues.push({
                    type: 'security',
                    severity: 'warning',
                    line: lineNum,
                    message: 'Potential XSS vulnerability - dangerous DOM manipulation detected',
                    code: line.trim(),
                    filePath,
                    suggestion: 'Use textContent instead of innerHTML, or sanitize user input'
                });
            }

            // Check for console.log in production code
            if (line.match(/console\.(log|debug|warn)/) && !filePath.includes('test')) {
                issues.push({
                    type: 'style',
                    severity: 'info',
                    line: lineNum,
                    message: 'Console.log statement found - consider removing for production',
                    code: line.trim(),
                    filePath,
                    suggestion: 'Remove console.log or use a proper logging library'
                });
            }

            // Check for nested loops (performance)
            if (line.trim().match(/for\s*\(/) && this.hasNestedLoop(code, index)) {
                issues.push({
                    type: 'performance',
                    severity: 'warning',
                    line: lineNum,
                    message: 'Nested loop detected - potential O(n²) complexity',
                    code: line.trim(),
                    filePath,
                    suggestion: 'Consider using a Map or Set for O(1) lookups instead of nested loops'
                });
            }

            // Check for missing async/await
            if (line.match(/\.then\(|\.catch\(/) && !code.includes('async')) {
                issues.push({
                    type: 'style',
                    severity: 'info',
                    line: lineNum,
                    message: 'Promise chain detected - consider using async/await for better readability',
                    code: line.trim(),
                    filePath,
                    suggestion: 'Convert to async/await syntax for better readability and error handling'
                });
            }
        });

        return issues;
    }

    private analyzePython(code: string, filePath: string): CodeIssue[] {
        const issues: CodeIssue[] = [];
        const lines = code.split('\n');

        lines.forEach((line, index) => {
            const lineNum = index + 1;

            // Check for SQL injection
            if (line.match(/cursor\.execute\s*\(\s*["'f].*%\s*\w+/)) {
                issues.push({
                    type: 'security',
                    severity: 'critical',
                    line: lineNum,
                    message: 'Potential SQL injection - string formatting in SQL query',
                    code: line.trim(),
                    filePath,
                    suggestion: 'Use parameterized queries: cursor.execute("SELECT * FROM table WHERE id = ?", (id,))'
                });
            }

            // Check for bare except
            if (line.trim() === 'except:' || line.trim().match(/except\s*:$/)) {
                issues.push({
                    type: 'bug',
                    severity: 'warning',
                    line: lineNum,
                    message: 'Bare except clause catches all exceptions including system exits',
                    code: line.trim(),
                    filePath,
                    suggestion: 'Use specific exception types: except ValueError: or except Exception:'
                });
            }

            // Check for missing type hints (style)
            if (line.match(/^def\s+\w+\s*\([^)]*\)\s*:/) && !line.includes('->') && !line.includes(':')) {
                issues.push({
                    type: 'style',
                    severity: 'info',
                    line: lineNum,
                    message: 'Function missing type hints',
                    code: line.trim(),
                    filePath,
                    suggestion: 'Add type hints for better code documentation and IDE support'
                });
            }
        });

        return issues;
    }

    private analyzeHTML(code: string, filePath: string): CodeIssue[] {
        const issues: CodeIssue[] = [];
        const lines = code.split('\n');

        lines.forEach((line, index) => {
            const lineNum = index + 1;

            // Check for missing alt text
            if (line.match(/<img[^>]*>/i) && !line.match(/alt\s*=/i)) {
                issues.push({
                    type: 'accessibility',
                    severity: 'warning',
                    line: lineNum,
                    message: 'Image missing alt attribute - accessibility issue',
                    code: line.trim(),
                    filePath,
                    suggestion: 'Add alt attribute: <img src="..." alt="descriptive text">'
                });
            }

            // Check for missing aria-label on buttons
            if (line.match(/<button[^>]*>/i) && !line.match(/aria-label\s*=|aria-labelledby\s*=/i) && !line.match(/>[^<]+</)) {
                issues.push({
                    type: 'accessibility',
                    severity: 'info',
                    line: lineNum,
                    message: 'Button may need aria-label for screen readers',
                    code: line.trim(),
                    filePath,
                    suggestion: 'Add aria-label if button text is not descriptive enough'
                });
            }

            // Check for inline styles (style issue)
            if (line.match(/style\s*=/i)) {
                issues.push({
                    type: 'style',
                    severity: 'info',
                    line: lineNum,
                    message: 'Inline styles detected - consider using CSS classes',
                    code: line.trim(),
                    filePath,
                    suggestion: 'Move styles to external stylesheet or style tag for better maintainability'
                });
            }
        });

        return issues;
    }

    private analyzeGeneric(code: string, filePath: string, _languageId: string): CodeIssue[] {
        const issues: CodeIssue[] = [];
        const lines = code.split('\n');

        // Generic checks that apply to most languages
        lines.forEach((line, index) => {
            const lineNum = index + 1;

            // Check for TODO/FIXME comments
            if (line.match(/TODO|FIXME|HACK|XXX/i)) {
                issues.push({
                    type: 'code-smell',
                    severity: 'info',
                    line: lineNum,
                    message: 'TODO/FIXME comment found',
                    code: line.trim(),
                    filePath,
                    suggestion: 'Consider addressing this before merging to production'
                });
            }

            // Check for very long lines
            if (line.length > 120) {
                issues.push({
                    type: 'style',
                    severity: 'info',
                    line: lineNum,
                    message: 'Line exceeds 120 characters - consider breaking it up',
                    code: line.trim().substring(0, 100) + '...',
                    filePath,
                    suggestion: 'Break long lines for better readability'
                });
            }
        });

        return issues;
    }

    private hasNestedLoop(code: string, startLine: number): boolean {
        const lines = code.split('\n');
        let braceCount = 0;
        let foundFor = false;

        for (let i = startLine; i < Math.min(startLine + 20, lines.length); i++) {
            const line = lines[i];
            if (line.trim().match(/for\s*\(/)) {
                if (foundFor && braceCount === 1) {
                    return true;
                }
                foundFor = true;
            }
            braceCount += (line.match(/\{/g) || []).length;
            braceCount -= (line.match(/\}/g) || []).length;
        }

        return false;
    }

    convertToSuggestionContext(issue: CodeIssue): SuggestionContext {
        return {
            filePath: issue.filePath,
            lineNumber: issue.line,
            code: issue.code,
            issueType: issue.type,
            severity: issue.severity,
            description: issue.message,
            suggestion: issue.suggestion
        };
    }

    dispose() {
        this.diagnosticCollection.dispose();
        if (this.analysisDelay) {
            clearTimeout(this.analysisDelay);
        }
    }
}

