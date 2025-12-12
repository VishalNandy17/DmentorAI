import * as vscode from 'vscode';

export interface AIProvider {
    name: string;
    analyzeCode(code: string, context: string, language: string): Promise<string>;
    answerQuestion(question: string, codeContext?: string): Promise<string>;
    improveSuggestion(originalSuggestion: string, feedback: string): Promise<string>;
}

export class OpenAIProvider implements AIProvider {
    name = 'OpenAI';
    private apiKey: string;
    private baseUrl = 'https://api.openai.com/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async analyzeCode(code: string, context: string, language: string): Promise<string> {
        const prompt = `You are an expert ${language} code reviewer. ${context}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide specific, actionable feedback. Be concise and helpful.`;
        return this.callAPI(prompt, 'You are a helpful code review assistant.');
    }

    async answerQuestion(question: string, codeContext?: string): Promise<string> {
        const prompt = codeContext 
            ? `Question: ${question}\n\nCode context:\n\`\`\`\n${codeContext}\n\`\`\`\n\nProvide a helpful answer.`
            : `Question: ${question}\n\nProvide a helpful answer.`;
        return this.callAPI(prompt, 'You are a helpful coding mentor.');
    }

    async improveSuggestion(originalSuggestion: string, feedback: string): Promise<string> {
        const prompt = `Original suggestion: ${originalSuggestion}\n\nUser feedback: ${feedback}\n\nProvide an improved suggestion based on the feedback.`;
        return this.callAPI(prompt, 'You are a helpful coding mentor.');
    }

    private async callAPI(prompt: string, systemMessage: string): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4-turbo-preview',
                    messages: [
                        { role: 'system', content: systemMessage },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.statusText}`);
            }

            const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
            return data.choices?.[0]?.message?.content || 'No response from AI';
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw error;
        }
    }
}

export class AnthropicProvider implements AIProvider {
    name = 'Anthropic';
    private apiKey: string;
    private baseUrl = 'https://api.anthropic.com/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async analyzeCode(code: string, context: string, language: string): Promise<string> {
        const prompt = `You are an expert ${language} code reviewer. ${context}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide specific, actionable feedback. Be concise and helpful.`;
        return this.callAPI(prompt, 'You are a helpful code review assistant.');
    }

    async answerQuestion(question: string, codeContext?: string): Promise<string> {
        const prompt = codeContext 
            ? `Question: ${question}\n\nCode context:\n\`\`\`\n${codeContext}\n\`\`\`\n\nProvide a helpful answer.`
            : `Question: ${question}\n\nProvide a helpful answer.`;
        return this.callAPI(prompt, 'You are a helpful coding mentor.');
    }

    async improveSuggestion(originalSuggestion: string, feedback: string): Promise<string> {
        const prompt = `Original suggestion: ${originalSuggestion}\n\nUser feedback: ${feedback}\n\nProvide an improved suggestion based on the feedback.`;
        return this.callAPI(prompt, 'You are a helpful coding mentor.');
    }

    private async callAPI(prompt: string, systemMessage: string): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 500,
                    system: systemMessage,
                    messages: [
                        { role: 'user', content: prompt }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`Anthropic API error: ${response.statusText}`);
            }

            const data = await response.json() as { content?: Array<{ text?: string }> };
            return data.content?.[0]?.text || 'No response from AI';
        } catch (error) {
            console.error('Anthropic API error:', error);
            throw error;
        }
    }
}

export class LocalAIProvider implements AIProvider {
    name = 'Local (Rule-Based)';
    
    async analyzeCode(code: string, context: string, _language: string): Promise<string> {
        // Fallback to enhanced rule-based analysis
        return `Analysis: ${context}. Review the code for best practices, potential bugs, and improvements.`;
    }

    async answerQuestion(question: string, _codeContext?: string): Promise<string> {
        // Simple keyword-based responses
        if (question.toLowerCase().includes('secure')) {
            return 'For security, always validate user input, use parameterized queries, and avoid eval().';
        }
        if (question.toLowerCase().includes('optimize') || question.toLowerCase().includes('performance')) {
            return 'Consider algorithm complexity, avoid unnecessary loops, and use efficient data structures.';
        }
        return 'Use code review feature (Ctrl+Shift+R) for detailed analysis of your code.';
    }

    async improveSuggestion(originalSuggestion: string, feedback: string): Promise<string> {
        return `Based on your feedback: ${feedback}. Here's an improved approach: ${originalSuggestion}`;
    }
}

export class AIService {
    private provider: AIProvider | null = null;
    private context: vscode.ExtensionContext;
    private apiKey: string | undefined;
    private providerType: 'openai' | 'anthropic' | 'local' | 'none' = 'local';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadConfiguration();
        
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('dmentorAI.aiProvider') || 
                e.affectsConfiguration('dmentorAI.aiApiKey')) {
                this.loadConfiguration();
            }
        });
    }

    private loadConfiguration(): void {
        const config = vscode.workspace.getConfiguration('dmentorAI');
        this.providerType = config.get<'openai' | 'anthropic' | 'local' | 'none'>('aiProvider', 'local');
        this.apiKey = config.get<string>('aiApiKey', '');
        
        switch (this.providerType) {
            case 'openai':
                if (this.apiKey) {
                    this.provider = new OpenAIProvider(this.apiKey);
                } else {
                    vscode.window.showWarningMessage('OpenAI API key not configured. Using local provider.');
                    this.provider = new LocalAIProvider();
                }
                break;
            case 'anthropic':
                if (this.apiKey) {
                    this.provider = new AnthropicProvider(this.apiKey);
                } else {
                    vscode.window.showWarningMessage('Anthropic API key not configured. Using local provider.');
                    this.provider = new LocalAIProvider();
                }
                break;
            case 'local':
                this.provider = new LocalAIProvider();
                break;
            default:
                this.provider = new LocalAIProvider();
        }
    }

    async analyzeCodeWithAI(code: string, language: string, issueType: string): Promise<string> {
        if (!this.provider) {
            return '';
        }

        const context = `Analyze this code for ${issueType} issues. Provide specific, actionable feedback.`;
        
        try {
            return await this.provider.analyzeCode(code, context, language);
        } catch (error) {
            console.error('AI analysis error:', error);
            vscode.window.showErrorMessage(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return '';
        }
    }

    async answerQuestion(question: string, codeContext?: string): Promise<string> {
        if (!this.provider) {
            return 'AI service is not available. Please configure an AI provider in settings.';
        }

        try {
            return await this.provider.answerQuestion(question, codeContext);
        } catch (error) {
            console.error('AI question answering error:', error);
            vscode.window.showErrorMessage(`AI service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return 'Sorry, I encountered an error. Please try again or check your AI provider configuration.';
        }
    }

    async improveSuggestion(originalSuggestion: string, feedback: string): Promise<string> {
        if (!this.provider) {
            return originalSuggestion;
        }

        try {
            return await this.provider.improveSuggestion(originalSuggestion, feedback);
        } catch (error) {
            console.error('AI improvement error:', error);
            return originalSuggestion;
        }
    }

    getProviderName(): string {
        return this.provider?.name || 'None';
    }

    isConfigured(): boolean {
        return this.provider !== null && this.providerType !== 'none';
    }
}

