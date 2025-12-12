import * as vscode from 'vscode';
import { DMentorCore } from '../core/dmentorCore';

export class InsightsDashboard implements vscode.Disposable {
    private context: vscode.ExtensionContext;
    private core: DMentorCore;
    private panel: vscode.WebviewPanel | undefined;

    constructor(context: vscode.ExtensionContext, core: DMentorCore) {
        this.context = context;
        this.core = core;
    }

    openDashboard(): void {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'dmentorInsights',
            'DMentor Insights',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.updateDashboardContent();

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
    }

    private updateDashboardContent(): void {
        if (!this.panel) {
            return;
        }

        const interventions = this.core.getInterventions();
        const stats = this.calculateStats(interventions);

        this.panel.webview.html = this.getDashboardHtml(stats);
    }

    private calculateStats(interventions: any[]): any {
        const stats = {
            total: interventions.length,
            byType: {} as { [key: string]: number },
            bySeverity: {} as { [key: string]: number },
            accepted: interventions.filter(i => i.accepted).length,
            dismissed: interventions.filter(i => i.dismissed).length,
            personality: this.core.getPersonalityManager().getPersonalityType()
        };

        interventions.forEach(i => {
            stats.byType[i.context.issueType] = (stats.byType[i.context.issueType] || 0) + 1;
            stats.bySeverity[i.context.severity] = (stats.bySeverity[i.context.severity] || 0) + 1;
        });

        return stats;
    }

    private getDashboardHtml(stats: any): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DMentor Insights</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
        }
        .dashboard-header {
            margin-bottom: 30px;
        }
        .dashboard-header h1 {
            margin: 0 0 10px 0;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .stat-card {
            padding: 20px;
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
        }
        .stat-card h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            opacity: 0.7;
        }
        .stat-card .value {
            font-size: 32px;
            font-weight: bold;
            margin: 0;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            margin-bottom: 15px;
        }
        .chart {
            padding: 15px;
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
        }
        .bar {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        .bar-label {
            width: 150px;
            font-size: 12px;
        }
        .bar-fill {
            height: 20px;
            background: var(--vscode-textLink-foreground);
            border-radius: 3px;
            display: flex;
            align-items: center;
            padding: 0 10px;
            color: white;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="dashboard-header">
        <h1>👻 DMentor Insights Dashboard</h1>
        <p>Your coding journey and improvement metrics</p>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <h3>Total Suggestions</h3>
            <p class="value">${stats.total}</p>
        </div>
        <div class="stat-card">
            <h3>Accepted</h3>
            <p class="value">${stats.accepted}</p>
        </div>
        <div class="stat-card">
            <h3>Dismissed</h3>
            <p class="value">${stats.dismissed}</p>
        </div>
        <div class="stat-card">
            <h3>Personality</h3>
            <p class="value" style="font-size: 18px;">${stats.personality.replace('-', ' ')}</p>
        </div>
    </div>

    <div class="section">
        <h2>Issues by Type</h2>
        <div class="chart">
            ${Object.entries(stats.byType).map(([type, count]: [string, any]) => `
                <div class="bar">
                    <div class="bar-label">${type}</div>
                    <div class="bar-fill" style="width: ${(count / stats.total) * 100}%;">
                        ${count}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <h2>Issues by Severity</h2>
        <div class="chart">
            ${Object.entries(stats.bySeverity).map(([severity, count]: [string, any]) => `
                <div class="bar">
                    <div class="bar-label">${severity}</div>
                    <div class="bar-fill" style="width: ${(count / stats.total) * 100}%; background: ${severity === 'critical' ? 'var(--vscode-errorForeground)' : severity === 'warning' ? 'var(--vscode-textLink-foreground)' : 'var(--vscode-descriptionForeground)'};">
                        ${count}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
    }

    dispose() {
        if (this.panel) {
            this.panel.dispose();
        }
    }
}

