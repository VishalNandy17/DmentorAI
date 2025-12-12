import * as vscode from 'vscode';
import { DMentorCore, Intervention } from '../core/dmentorCore';

export class SuggestionManager implements vscode.Disposable {
    private context: vscode.ExtensionContext;
    private core: DMentorCore;
    private panel: vscode.WebviewPanel | undefined;
    private disposables: vscode.Disposable[] = [];

    constructor(context: vscode.ExtensionContext, core: DMentorCore) {
        this.context = context;
        this.core = core;

        // Listen for intervention events
        this.disposables.push(
            vscode.commands.registerCommand('dmentor.onInterventionCreated', (intervention: Intervention) => {
                this.handleNewIntervention(intervention);
            })
        );
    }

    openPanel(): void {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'dmentorSuggestions',
            'DMentor Suggestions',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.updatePanelContent();

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        }, null, this.disposables);

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            message => {
            switch (message.command) {
                case 'dismiss': {
                    const feedback = message.feedback || undefined;
                    this.core.dismissIntervention(message.id, feedback);
                    this.updatePanelContent();
                    break;
                }
                case 'accept': {
                    this.core.acceptIntervention(message.id);
                    this.updatePanelContent();
                    break;
                }
                case 'showCode': {
                    this.showInEditor(message.filePath, message.lineNumber);
                    break;
                }
                case 'provideFeedback': {
                    if (message.id && message.feedback) {
                        this.core.dismissIntervention(message.id, message.feedback);
                    }
                    break;
                }
            }
            },
            null,
            this.disposables
        );
    }

    private updatePanelContent(): void {
        if (!this.panel) {
            return;
        }

        const interventions = this.core.getInterventions();
        this.panel.webview.html = this.getWebviewContent(interventions);
    }

    private getWebviewContent(interventions: Intervention[]): string {
        if (interventions.length === 0) {
            return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DMentor Suggestions</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
        }
        .empty-state {
            text-align: center;
            padding: 40px 20px;
        }
        .empty-state h2 {
            margin-bottom: 10px;
        }
        .empty-state p {
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="empty-state">
        <h2>👻 All Clear!</h2>
        <p>No suggestions at the moment. Keep coding!</p>
    </div>
</body>
</html>`;
        }

        const itemsHtml = interventions.map(intervention => {
            const severityClass = intervention.context.severity;
            const icon = intervention.response.icon;
            const date = intervention.timestamp.toLocaleTimeString();

            return `
<div class="intervention-item ${severityClass}">
    <div class="intervention-header">
        <span class="intervention-icon">${icon}</span>
        <span class="intervention-type">${intervention.context.issueType.toUpperCase()}</span>
        <span class="intervention-severity ${severityClass}">${severityClass.toUpperCase()}</span>
        <span class="intervention-time">${date}</span>
    </div>
    <div class="intervention-message">${this.escapeHtml(intervention.response.message)}</div>
    <div class="intervention-location">
        📄 ${intervention.context.filePath} • Line ${intervention.context.lineNumber}
    </div>
    ${intervention.response.codeExample ? `
    <div class="intervention-code">
        <pre><code>${this.escapeHtml(intervention.response.codeExample)}</code></pre>
    </div>
    ` : ''}
    <div class="intervention-actions">
        <button class="btn-accept" onclick="handleAccept('${intervention.id}')">✓ Accept</button>
        <button class="btn-dismiss" onclick="handleDismiss('${intervention.id}')">✗ Dismiss</button>
        <button class="btn-show" onclick="handleShowCode('${intervention.context.filePath}', ${intervention.context.lineNumber})">🔍 Show in Editor</button>
    </div>
</div>`;
        }).join('');

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DMentor Suggestions</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 0;
            margin: 0;
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
        }
        .header {
            padding: 15px 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
            background: var(--vscode-panel-background);
        }
        .header h2 {
            margin: 0;
            font-size: 18px;
        }
        .interventions-list {
            padding: 10px;
        }
        .intervention-item {
            margin-bottom: 15px;
            padding: 15px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            background: var(--vscode-editor-background);
        }
        .intervention-item.critical {
            border-left: 4px solid var(--vscode-errorForeground);
        }
        .intervention-item.warning {
            border-left: 4px solid var(--vscode-textLink-foreground);
        }
        .intervention-item.info {
            border-left: 4px solid var(--vscode-descriptionForeground);
        }
        .intervention-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            font-size: 12px;
        }
        .intervention-icon {
            font-size: 20px;
        }
        .intervention-type {
            padding: 2px 8px;
            background: var(--vscode-textBlockQuote-background);
            border-radius: 3px;
            font-weight: bold;
        }
        .intervention-severity {
            padding: 2px 8px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 10px;
        }
        .intervention-severity.critical {
            background: var(--vscode-errorForeground);
            color: var(--vscode-errorForeground);
        }
        .intervention-severity.warning {
            background: var(--vscode-textLink-foreground);
        }
        .intervention-severity.info {
            background: var(--vscode-descriptionForeground);
        }
        .intervention-time {
            margin-left: auto;
            opacity: 0.7;
        }
        .intervention-message {
            margin: 10px 0;
            white-space: pre-wrap;
            line-height: 1.5;
        }
        .intervention-location {
            font-size: 12px;
            opacity: 0.7;
            margin: 10px 0;
        }
        .intervention-code {
            margin: 10px 0;
            padding: 10px;
            background: var(--vscode-textCodeBlock-background);
            border-radius: 4px;
        }
        .intervention-code pre {
            margin: 0;
            overflow-x: auto;
        }
        .intervention-code code {
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
        }
        .intervention-actions {
            margin-top: 15px;
            display: flex;
            gap: 10px;
        }
        button {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-family: var(--vscode-font-family);
        }
        .btn-accept {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .btn-accept:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .btn-dismiss {
            background: transparent;
            color: var(--vscode-foreground);
            border: 1px solid var(--vscode-panel-border);
        }
        .btn-dismiss:hover {
            background: var(--vscode-list-hoverBackground);
        }
        .btn-show {
            background: transparent;
            color: var(--vscode-textLink-foreground);
            border: 1px solid var(--vscode-panel-border);
        }
        .btn-show:hover {
            background: var(--vscode-list-hoverBackground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>👻 DMentor Suggestions (${interventions.length})</h2>
    </div>
    <div class="interventions-list">
        ${itemsHtml}
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        
        function handleAccept(id) {
            vscode.postMessage({ command: 'accept', id: id });
        }
        
        function handleDismiss(id) {
            vscode.postMessage({ command: 'dismiss', id: id });
        }
        
        function handleShowCode(filePath, lineNumber) {
            vscode.postMessage({ command: 'showCode', filePath: filePath, lineNumber: lineNumber });
        }
    </script>
</body>
</html>`;
    }

    private escapeHtml(text: string): string {
        // Escape HTML special characters
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\n/g, '<br>');
    }

    private handleNewIntervention(intervention: Intervention): void {
        const config = vscode.workspace.getConfiguration('dmentorAI');
        const showInlineHints = config.get<boolean>('showInlineHints', true);

        if (showInlineHints && intervention.context.severity === 'critical') {
            // Show notification for critical issues
            vscode.window.showWarningMessage(
                `🚨 ${intervention.response.message.substring(0, 100)}...`,
                'View Details',
                'Dismiss'
            ).then(selection => {
                if (selection === 'View Details') {
                    this.openPanel();
                }
            });
        }

        // Update panel if open
        if (this.panel) {
            this.updatePanelContent();
        }
    }

    private showInEditor(filePath: string, lineNumber: number): void {
        vscode.workspace.openTextDocument(filePath).then(doc => {
            vscode.window.showTextDocument(doc).then(editor => {
                const position = new vscode.Position(lineNumber - 1, 0);
                editor.revealRange(new vscode.Range(position, position));
                editor.selection = new vscode.Selection(position, position);
            });
        });
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
        if (this.panel) {
            this.panel.dispose();
        }
    }
}

