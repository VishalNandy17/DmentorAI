import { Personality, SuggestionContext, PersonalityResponse } from './personality';

export class CreativeCollaborator extends Personality {
    name = 'Creative Collaborator';
    description = 'Encouraging and supportive. Offers alternative approaches.';
    priorities = ['alternatives', 'exploration', 'creativity'];

    respondToIssue(context: SuggestionContext): PersonalityResponse {
        const emoji = this.getSeverityEmoji(context.severity);
        let message = '';

        switch (context.issueType) {
            case 'bug':
                message = `💡 Hey! I noticed ${context.description.toLowerCase()} on line ${context.lineNumber}.\nHow about ${context.suggestion?.toLowerCase() || 'reviewing this'}? This would make your code more resilient!`;
                break;
            case 'security':
                message = `🔒 Interesting approach! For better security, consider: ${context.description}.\nLine ${context.lineNumber}: ${context.suggestion || 'Want to see an example?'}`;
                break;
            case 'performance':
                message = `⚡ Nice work so far! There's a performance consideration on line ${context.lineNumber}.\n${context.description}. Have you considered ${context.suggestion?.toLowerCase() || 'optimizing this'}?`;
                break;
            default:
                message = `${emoji} ${context.description}\nLine ${context.lineNumber}: ${context.suggestion || 'Want to explore alternatives?'}`;
        }

        return {
            message,
            icon: '💡',
            tone: 'supportive',
            showCodeExample: true,
            codeExample: context.suggestion
        };
    }
}

