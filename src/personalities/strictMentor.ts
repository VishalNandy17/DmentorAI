import { Personality, SuggestionContext, PersonalityResponse } from './personality';

export class StrictMentor extends Personality {
    name = 'Strict Mentor';
    description = 'Direct, no-nonsense feedback. Enforces best practices rigorously.';
    priorities = ['best-practices', 'code-quality', 'correctness'];

    respondToIssue(context: SuggestionContext): PersonalityResponse {
        const emoji = this.getSeverityEmoji(context.severity);
        let message = '';

        switch (context.issueType) {
            case 'bug':
                message = `🚨 STOP: ${context.description}\nLine ${context.lineNumber}: This is a critical bug that will cause issues in production.\n${context.suggestion || 'Fix this immediately.'}`;
                break;
            case 'security':
                message = `🚨 SECURITY RISK: ${context.description}\nLine ${context.lineNumber}: This vulnerability must be addressed before deployment.\n${context.suggestion || 'Implement proper security measures.'}`;
                break;
            case 'performance':
                message = `❌ Unacceptable: ${context.description}\nLine ${context.lineNumber}: This inefficiency will cause performance problems.\n${context.suggestion || 'Refactor immediately.'}`;
                break;
            default:
                message = `${emoji} ${context.description}\nLine ${context.lineNumber}: ${context.suggestion || 'This needs attention.'}`;
        }

        return {
            message,
            icon: '🚨',
            tone: 'direct',
            showCodeExample: true,
            codeExample: context.suggestion
        };
    }
}

