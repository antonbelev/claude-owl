/**
 * Configuration-related type definitions
 */
export interface ClaudeSettings {
    statusLine?: StatusLineConfig;
    enabledPlugins?: Record<string, boolean>;
    alwaysThinkingEnabled?: boolean;
    permissions?: PermissionsConfig;
    environment?: Record<string, string>;
    modelConfig?: ModelConfig;
    [key: string]: unknown;
}
export interface StatusLineConfig {
    type: 'command' | 'text';
    command?: string;
    text?: string;
    padding?: number;
}
export interface PermissionsConfig {
    allow?: string[];
    ask?: string[];
    deny?: string[];
}
export interface ModelConfig {
    defaultModel?: 'sonnet' | 'opus' | 'haiku';
    temperature?: number;
    maxTokens?: number;
}
export type ConfigLevel = 'user' | 'project' | 'local' | 'managed';
export interface ConfigSource {
    level: ConfigLevel;
    path: string;
    content: ClaudeSettings;
}
export interface EffectiveConfig {
    merged: ClaudeSettings;
    sources: ConfigSource[];
}
//# sourceMappingURL=config.types.d.ts.map