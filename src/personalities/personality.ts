export interface SuggestionContext {
    filePath: string;
    lineNumber: number;
    code: string;
    issueType: 'bug' | 'security' | 'performance' | 'style' | 'accessibility' | 'code-smell';
    severity: 'critical' | 'warning' | 'info';
    description: string;
    suggestion?: string;
}

export interface PersonalityResponse {
    message: string;
    icon: string;
    tone: 'direct' | 'supportive' | 'questioning' | 'urgent' | 'gentle';
    showCodeExample?: boolean;
    codeExample?: string;
}

export abstract class Personality {
    abstract name: string;
    abstract description: string;
    abstract priorities: string[];

    abstract respondToIssue(context: SuggestionContext): PersonalityResponse;

    protected formatMessage(template: string, context: SuggestionContext): string {
        return template
            .replace('{issue}', context.description)
            .replace('{line}', context.lineNumber.toString())
            .replace('{code}', context.code.substring(0, 50))
            .replace('{suggestion}', context.suggestion || 'Consider reviewing this');
    }

    protected getSeverityEmoji(severity: string): string {
        switch (severity) {
            case 'critical':
                return '🚨';
            case 'warning':
                return '⚠️';
            case 'info':
                return '💡';
            default:
                return '📌';
        }
    }
}

