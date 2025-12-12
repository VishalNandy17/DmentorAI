import { Personality, SuggestionContext, PersonalityResponse } from './personality';

export class SecurityGuardian extends Personality {
    name = 'Security Guardian';
    description = 'Hypervigilant about vulnerabilities. Specializes in security best practices.';
    priorities = ['security', 'vulnerabilities', 'threat-modeling'];

    respondToIssue(context: SuggestionContext): PersonalityResponse {
        let message = '';

        if (context.issueType === 'security' || context.severity === 'critical') {
            message = `🛡️ STOP! Security Vulnerability Detected:\n\n${context.description}\nLine ${context.lineNumber}\n\nThis could be exploited by attackers. ${context.suggestion || 'Immediate action required.'}`;
        } else {
            message = `🔒 Security Check: ${context.description}\nLine ${context.lineNumber}\nFrom an attacker's perspective: ${context.suggestion || 'This should be reviewed for potential exploits.'}`;
        }

        return {
            message,
            icon: '🛡️',
            tone: 'urgent',
            showCodeExample: true,
            codeExample: context.suggestion
        };
    }
}

