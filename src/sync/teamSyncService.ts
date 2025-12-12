import * as vscode from 'vscode';

export interface TeamPreferences {
    teamId: string;
    teamName: string;
    preferences: {
        personality?: string;
        interventionFrequency?: string;
        detectionRules?: any;
        customRules?: any[];
    };
    lastSynced: Date;
    version: number;
}

export interface SyncConfig {
    enabled: boolean;
    teamId?: string;
    serverUrl?: string;
    apiKey?: string;
    syncInterval?: number; // minutes
}

export class TeamSyncService {
    private context: vscode.ExtensionContext;
    private syncConfig!: SyncConfig;
    private localPreferences: TeamPreferences | null = null;
    private syncInterval: NodeJS.Timeout | null = null;
    private isSyncing: boolean = false;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadSyncConfig();
        this.loadLocalPreferences();
        
        if (this.syncConfig.enabled) {
            this.startAutoSync();
        }

        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('dmentorAI.syncTeamPreferences')) {
                this.loadSyncConfig();
                if (this.syncConfig.enabled) {
                    this.startAutoSync();
                } else {
                    this.stopAutoSync();
                }
            }
        });
    }

    private loadSyncConfig(): void {
        const config = vscode.workspace.getConfiguration('dmentorAI');
        this.syncConfig = {
            enabled: config.get<boolean>('syncTeamPreferences', false),
            teamId: config.get<string>('teamSync.teamId', ''),
            serverUrl: config.get<string>('teamSync.serverUrl', 'https://api.dmentor.ai'),
            apiKey: config.get<string>('teamSync.apiKey', ''),
            syncInterval: config.get<number>('teamSync.syncInterval', 60)
        };
    }

    private loadLocalPreferences(): void {
        const stored = this.context.globalState.get<TeamPreferences>('dmentor.team.preferences');
        if (stored) {
            this.localPreferences = {
                ...stored,
                lastSynced: new Date(stored.lastSynced)
            };
        }
    }

    private startAutoSync(): void {
        this.stopAutoSync();
        const intervalMs = (this.syncConfig.syncInterval || 60) * 60 * 1000;
        
        this.syncInterval = setInterval(async () => {
            await this.syncWithTeam();
        }, intervalMs);

        // Initial sync
        this.syncWithTeam();
    }

    private stopAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    async syncWithTeam(): Promise<boolean> {
        if (!this.syncConfig.enabled || !this.syncConfig.teamId) {
            return false;
        }

        if (this.isSyncing) {
            return false;
        }

        this.isSyncing = true;

        try {
            // Upload local preferences
            await this.uploadPreferences();

            // Download team preferences
            const teamPrefs = await this.downloadPreferences();
            
            if (teamPrefs) {
                await this.applyTeamPreferences(teamPrefs);
                this.localPreferences = teamPrefs;
                this.context.globalState.update('dmentor.team.preferences', teamPrefs);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Team sync error:', error);
            vscode.window.showErrorMessage(`Team sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false;
        } finally {
            this.isSyncing = false;
        }
    }

    private async uploadPreferences(): Promise<void> {
        if (!this.syncConfig.serverUrl || !this.syncConfig.apiKey) {
            // Simulate upload for local testing
            return;
        }

        const config = vscode.workspace.getConfiguration('dmentorAI');
        const preferences: TeamPreferences = {
            teamId: this.syncConfig.teamId!,
            teamName: config.get<string>('teamSync.teamName', 'My Team'),
            preferences: {
                personality: config.get<string>('personality'),
                interventionFrequency: config.get<string>('interventionFrequency'),
                detectionRules: config.get<any>('detectionRules')
            },
            lastSynced: new Date(),
            version: (this.localPreferences?.version || 0) + 1
        };

        try {
            const response = await fetch(`${this.syncConfig.serverUrl}/api/team/preferences`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.syncConfig.apiKey}`
                },
                body: JSON.stringify(preferences)
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }
        } catch (error) {
            // For offline/local mode, just log
            console.log('Team sync server not available, using local mode');
        }
    }

    private async downloadPreferences(): Promise<TeamPreferences | null> {
        if (!this.syncConfig.serverUrl || !this.syncConfig.apiKey || !this.syncConfig.teamId) {
            // Return local preferences for testing
            return this.localPreferences;
        }

        try {
            const response = await fetch(`${this.syncConfig.serverUrl}/api/team/preferences/${this.syncConfig.teamId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.syncConfig.apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`Download failed: ${response.statusText}`);
            }

            const data = await response.json() as TeamPreferences;
            return {
                ...data,
                lastSynced: new Date(data.lastSynced)
            };
        } catch (error) {
            console.log('Team sync server not available, using local preferences');
            return this.localPreferences;
        }
    }

    private async applyTeamPreferences(preferences: TeamPreferences): Promise<void> {
        const config = vscode.workspace.getConfiguration('dmentorAI');
        
        // Only apply if preferences are newer
        if (this.localPreferences && preferences.version <= this.localPreferences.version) {
            return;
        }

        // Apply team preferences
        const updates: Thenable<void>[] = [];

        if (preferences.preferences.personality) {
            updates.push(config.update('personality', preferences.preferences.personality, vscode.ConfigurationTarget.Global));
        }

        if (preferences.preferences.interventionFrequency) {
            updates.push(config.update('interventionFrequency', preferences.preferences.interventionFrequency, vscode.ConfigurationTarget.Global));
        }

        if (preferences.preferences.detectionRules) {
            updates.push(config.update('detectionRules', preferences.preferences.detectionRules, vscode.ConfigurationTarget.Global));
        }

        await Promise.all(updates.map(p => Promise.resolve(p)));

        vscode.window.showInformationMessage(`Team preferences synced: ${preferences.teamName}`);
    }

    getTeamPreferences(): TeamPreferences | null {
        return this.localPreferences;
    }

    getSyncStatus(): { enabled: boolean; lastSynced: Date | null; isSyncing: boolean } {
        return {
            enabled: this.syncConfig.enabled,
            lastSynced: this.localPreferences?.lastSynced || null,
            isSyncing: this.isSyncing
        };
    }

    dispose(): void {
        this.stopAutoSync();
    }
}

