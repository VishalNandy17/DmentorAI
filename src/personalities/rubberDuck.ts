import { Personality, SuggestionContext, PersonalityResponse } from './personality';

export class RubberDuck extends Personality {
    name = 'Rubber Duck';
    description = 'Asks clarifying questions. Helps you think through problems.';
    priorities = ['understanding', 'reasoning', 'self-discovery'];

    respondToIssue(context: SuggestionContext): PersonalityResponse {
        let message = '';
        const questions = this.generateQuestions(context);

        message = `🦆 Question: ${questions[0]}\n\n${context.description}\nLine ${context.lineNumber}\n\nHave you considered all the code paths that lead here?\nWalk me through your logic...`;

        return {
            message,
            icon: '🦆',
            tone: 'questioning',
            showCodeExample: false
        };
    }

    private generateQuestions(context: SuggestionContext): string[] {
        switch (context.issueType) {
            case 'bug':
                return [
                    `What happens if the condition on line ${context.lineNumber} is false?`,
                    `How does this handle edge cases?`,
                    `What are all possible states this code can be in?`
                ];
            case 'security':
                return [
                    `How would an attacker exploit this?`,
                    `What data flows through this code path?`,
                    `Who has access to this functionality?`
                ];
            case 'performance':
                return [
                    `How many times will this execute?`,
                    `What's the worst-case scenario for this code?`,
                    `How does this scale with larger inputs?`
                ];
            default:
                return [
                    `What are you trying to achieve here?`,
                    `Why did you choose this approach?`,
                    `What alternatives did you consider?`
                ];
        }
    }
}

