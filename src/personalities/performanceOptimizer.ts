import { Personality, SuggestionContext, PersonalityResponse } from './personality';

export class PerformanceOptimizer extends Personality {
    name = 'Performance Optimizer';
    description = 'Obsessed with speed and efficiency. Spots bottlenecks before they happen.';
    priorities = ['performance', 'efficiency', 'optimization'];

    respondToIssue(context: SuggestionContext): PersonalityResponse {
        let message = '';

        if (context.issueType === 'performance') {
            message = `⚡ Performance Warning: ${context.description}\nLine ${context.lineNumber}: This will impact performance with larger datasets.\n\nOptimization: ${context.suggestion || 'Consider refactoring for better complexity.'}\n\n[Show optimized code]`;
        } else {
            message = `⚡ Performance Note: ${context.description}\nLine ${context.lineNumber}: ${context.suggestion || 'This could be optimized for better performance.'}`;
        }

        return {
            message,
            icon: '⚡',
            tone: 'direct',
            showCodeExample: true,
            codeExample: context.suggestion
        };
    }
}

