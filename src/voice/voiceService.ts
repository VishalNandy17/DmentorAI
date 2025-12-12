import * as vscode from 'vscode';

export interface VoiceConfig {
    enabled: boolean;
    speechLanguage: string;
    voiceGender: 'male' | 'female' | 'neutral';
    speechRate: number;
    speechVolume: number;
}

export class VoiceService {
    private context: vscode.ExtensionContext;
    private config!: VoiceConfig;
    private recognition: any = null; // SpeechRecognition
    private synth: any = null; // SpeechSynthesis
    private isListeningFlag: boolean = false;
    private currentUtterance: any = null; // SpeechSynthesisUtterance

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadConfig();
        this.initializeSpeechSynthesis();
        this.initializeSpeechRecognition();

        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('dmentorAI.voice')) {
                this.loadConfig();
            }
        });
    }

    private loadConfig(): void {
        const config = vscode.workspace.getConfiguration('dmentorAI.voice');
        this.config = {
            enabled: config.get<boolean>('enabled', false),
            speechLanguage: config.get<string>('speechLanguage', 'en-US'),
            voiceGender: config.get<'male' | 'female' | 'neutral'>('voiceGender', 'neutral'),
            speechRate: config.get<number>('speechRate', 1.0),
            speechVolume: config.get<number>('speechVolume', 1.0)
        };
    }

    private initializeSpeechSynthesis(): void {
        // In VS Code extension context, we need to use webview for speech synthesis
        // SpeechSynthesis is browser-only, so we'll handle it through webviews
        this.synth = null; // Will be initialized in webview context
    }

    private initializeSpeechRecognition(): void {
        // Speech Recognition API is browser-only, so we'll use a webview-based approach
        // For VS Code extensions, we'll need to use the Webview API
        // Recognition will be handled in webview context
        this.recognition = null;
    }

    async speak(text: string): Promise<void> {
        if (!this.config.enabled) {
            return;
        }
        
        // In VS Code extension, we'll use a webview for TTS
        const panel = vscode.window.createWebviewPanel(
            'voiceOutput',
            'Voice Output',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );
        
        panel.webview.html = this.getTTSWebviewHtml(text);
        
        // Close panel after speaking
        panel.webview.onDidReceiveMessage((message) => {
            if (message.command === 'done') {
                panel.dispose();
            }
        });
    }

    stopSpeaking(): void {
        // Speech is handled in webview, this is a no-op for now
        this.currentUtterance = null;
    }

    async listen(): Promise<string> {
        if (!this.config.enabled) {
            throw new Error('Voice mode is not enabled');
        }

        // Always use webview-based input for VS Code extension context
        return this.listenViaWebview();
    }

    private async listenViaWebview(): Promise<string> {
        // Create a webview panel for speech recognition
        const panel = vscode.window.createWebviewPanel(
            'voiceInput',
            'Voice Input',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: false
            }
        );

        panel.webview.html = this.getVoiceInputWebviewHtml();

        return new Promise((resolve, reject) => {
            const messageHandler = panel.webview.onDidReceiveMessage(message => {
                if (message.command === 'transcript') {
                    messageHandler.dispose();
                    panel.dispose();
                    resolve(message.text);
                } else if (message.command === 'error') {
                    messageHandler.dispose();
                    panel.dispose();
                    reject(new Error(message.error));
                }
            });

            panel.onDidDispose(() => {
                messageHandler.dispose();
            });
        });
    }

    private getTTSWebviewHtml(text: string): string {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Voice Output</title>
</head>
<body>
    <script>
        const vscode = acquireVsCodeApi();
        const utterance = new SpeechSynthesisUtterance(${JSON.stringify(text)});
        utterance.lang = '${this.config.speechLanguage}';
        utterance.rate = ${this.config.speechRate};
        utterance.volume = ${this.config.speechVolume};
        utterance.onend = () => {
            vscode.postMessage({ command: 'done' });
        };
        speechSynthesis.speak(utterance);
    </script>
</body>
</html>`;
    }

    private getVoiceInputWebviewHtml(): string {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voice Input</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            text-align: center;
        }
        .status {
            margin: 20px 0;
            font-size: 18px;
        }
        .button {
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px;
        }
    </style>
</head>
<body>
    <h2>🎤 Voice Input</h2>
    <div class="status" id="status">Click Start to begin listening...</div>
    <button class="button" onclick="startListening()">Start Listening</button>
    <button class="button" onclick="stopListening()">Stop</button>
    <div id="transcript" style="margin-top: 20px; min-height: 50px;"></div>
    
    <script>
        const vscode = acquireVsCodeApi();
        let recognition = null;
        
        function initSpeechRecognition() {
            if ('webkitSpeechRecognition' in window) {
                recognition = new webkitSpeechRecognition();
            } else if ('SpeechRecognition' in window) {
                recognition = new SpeechRecognition();
            } else {
                document.getElementById('status').textContent = 'Speech recognition not supported';
                return false;
            }
            
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            
            recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                document.getElementById('transcript').textContent = transcript;
            };
            
            recognition.onend = () => {
                document.getElementById('status').textContent = 'Stopped listening';
            };
            
            recognition.onerror = (event) => {
                vscode.postMessage({ command: 'error', error: event.error });
            };
            
            return true;
        }
        
        function startListening() {
            if (!recognition && !initSpeechRecognition()) {
                return;
            }
            
            if (recognition && recognition.state !== 'listening') {
                recognition.start();
                document.getElementById('status').textContent = '🎤 Listening...';
            }
        }
        
        function stopListening() {
            if (recognition && recognition.state === 'listening') {
                recognition.stop();
                const transcript = document.getElementById('transcript').textContent;
                if (transcript) {
                    vscode.postMessage({ command: 'transcript', text: transcript });
                }
            }
        }
    </script>
</body>
</html>`;
    }

    isListening(): boolean {
        return this.isListeningFlag;
    }

    isSpeaking(): boolean {
        return false; // Always handled in webview
    }

    dispose(): void {
        this.stopSpeaking();
        if (this.recognition) {
            this.recognition.abort();
        }
    }
}

