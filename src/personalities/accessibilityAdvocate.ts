import { Personality, SuggestionContext, PersonalityResponse } from './personality';

export class AccessibilityAdvocate extends Personality {
    name = 'Accessibility Advocate';
    description = 'Ensures inclusive code. Checks WCAG compliance.';
    priorities = ['accessibility', 'inclusivity', 'wcag-compliance'];

    respondToIssue(context: SuggestionContext): PersonalityResponse {
        let message = '';

        if (context.issueType === 'accessibility') {
            message = `♿ Accessibility Issue: ${context.description}\nLine ${context.lineNumber}\n\nThis affects users with disabilities. WCAG compliance requires: ${context.suggestion || 'Adding proper accessibility attributes.'}`;
        } else {
            message = `♿ Inclusive Design Check: ${context.description}\nLine ${context.lineNumber}\nFor better accessibility: ${context.suggestion || 'Consider semantic HTML and ARIA labels.'}`;
        }

        return {
            message,
            icon: '♿',
            tone: 'supportive',
            showCodeExample: true,
            codeExample: context.suggestion
        };
    }
}

