import * as vscode from 'vscode';
import { Personality } from './personality';
import { StrictMentor } from './strictMentor';
import { CreativeCollaborator } from './creativeCollaborator';
import { RubberDuck } from './rubberDuck';
import { SecurityGuardian } from './securityGuardian';
import { PerformanceOptimizer } from './performanceOptimizer';
import { AccessibilityAdvocate } from './accessibilityAdvocate';

export type PersonalityType = 
    | 'strict-mentor'
    | 'creative-collaborator'
    | 'rubber-duck'
    | 'security-guardian'
    | 'performance-optimizer'
    | 'accessibility-advocate';

export class PersonalityManager {
    private currentPersonality: Personality;
    private personalities: Map<PersonalityType, Personality>;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.personalities = new Map();
        this.initializePersonalities();
        this.currentPersonality = this.loadCurrentPersonality();
    }

    private initializePersonalities() {
        this.personalities.set('strict-mentor', new StrictMentor());
        this.personalities.set('creative-collaborator', new CreativeCollaborator());
        this.personalities.set('rubber-duck', new RubberDuck());
        this.personalities.set('security-guardian', new SecurityGuardian());
        this.personalities.set('performance-optimizer', new PerformanceOptimizer());
        this.personalities.set('accessibility-advocate', new AccessibilityAdvocate());
    }

    private loadCurrentPersonality(): Personality {
        const config = vscode.workspace.getConfiguration('dmentorAI');
        const personalityType = config.get<PersonalityType>('personality', 'creative-collaborator');
        return this.personalities.get(personalityType) || this.personalities.get('creative-collaborator')!;
    }

    getCurrentPersonality(): Personality {
        return this.currentPersonality;
    }

    getPersonalityType(): PersonalityType {
        for (const [type, personality] of this.personalities.entries()) {
            if (personality === this.currentPersonality) {
                return type;
            }
        }
        return 'creative-collaborator';
    }

    async switchPersonality(newType?: PersonalityType): Promise<void> {
        if (!newType) {
            const items: vscode.QuickPickItem[] = [
                {
                    label: '$(person) Strict Mentor',
                    description: 'Direct, no-nonsense feedback. Enforces best practices rigorously.',
                    detail: 'Perfect for learning or working on critical projects'
                },
                {
                    label: '$(heart) Creative Collaborator',
                    description: 'Encouraging and supportive. Offers alternative approaches.',
                    detail: 'Great for brainstorming and exploration'
                },
                {
                    label: '$(duck) Rubber Duck',
                    description: 'Asks clarifying questions. Helps you think through problems.',
                    detail: 'Minimal interruptions, maximum insight'
                },
                {
                    label: '$(shield) Security Guardian',
                    description: 'Hypervigilant about vulnerabilities. Specializes in security best practices.',
                    detail: 'Reviews code from an attacker\'s perspective'
                },
                {
                    label: '$(zap) Performance Optimizer',
                    description: 'Obsessed with speed and efficiency. Spots bottlenecks before they happen.',
                    detail: 'Suggests optimizations in real-time'
                },
                {
                    label: '$(accessible) Accessibility Advocate',
                    description: 'Ensures inclusive code. Checks WCAG compliance.',
                    detail: 'Suggests semantic improvements'
                }
            ];

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Choose your mentor personality'
            });

            if (!selected) {
                return;
            }

            const typeMap: { [key: string]: PersonalityType } = {
                '$(person) Strict Mentor': 'strict-mentor',
                '$(heart) Creative Collaborator': 'creative-collaborator',
                '$(duck) Rubber Duck': 'rubber-duck',
                '$(shield) Security Guardian': 'security-guardian',
                '$(zap) Performance Optimizer': 'performance-optimizer',
                '$(accessible) Accessibility Advocate': 'accessibility-advocate'
            };

            newType = typeMap[selected.label] || 'creative-collaborator';
        }

        const newPersonality = this.personalities.get(newType);
        if (newPersonality) {
            this.currentPersonality = newPersonality;
            await vscode.workspace.getConfiguration('dmentorAI').update('personality', newType, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`👻 DMentor personality switched to: ${newType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
        }
    }

    getAllPersonalities(): Map<PersonalityType, Personality> {
        return this.personalities;
    }
}

