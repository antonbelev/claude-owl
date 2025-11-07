/**
 * IPC (Inter-Process Communication) type definitions
 * Defines the contract between main and renderer processes
 */
import type { ClaudeSettings, EffectiveConfig } from './config.types';
import type { Agent, Skill, Command } from './agent.types';
/**
 * IPC Channel names
 */
export declare const IPC_CHANNELS: {
    readonly GET_CONFIG: "config:get";
    readonly SAVE_CONFIG: "config:save";
    readonly VALIDATE_CONFIG: "config:validate";
    readonly GET_EFFECTIVE_CONFIG: "config:get-effective";
    readonly LIST_AGENTS: "agents:list";
    readonly GET_AGENT: "agents:get";
    readonly SAVE_AGENT: "agents:save";
    readonly DELETE_AGENT: "agents:delete";
    readonly LIST_SKILLS: "skills:list";
    readonly GET_SKILL: "skills:get";
    readonly SAVE_SKILL: "skills:save";
    readonly DELETE_SKILL: "skills:delete";
    readonly LIST_COMMANDS: "commands:list";
    readonly GET_COMMAND: "commands:get";
    readonly SAVE_COMMAND: "commands:save";
    readonly DELETE_COMMAND: "commands:delete";
    readonly EXECUTE_CLI: "cli:execute";
    readonly STOP_CLI: "cli:stop";
    readonly READ_FILE: "fs:read";
    readonly WRITE_FILE: "fs:write";
    readonly LIST_DIRECTORY: "fs:list";
    readonly GET_APP_VERSION: "system:version";
    readonly GET_CLAUDE_VERSION: "system:claude-version";
    readonly CHECK_CLAUDE_INSTALLED: "system:check-claude";
};
/**
 * IPC Request/Response types
 */
export interface GetConfigRequest {
    level: 'user' | 'project' | 'local';
}
export interface GetConfigResponse {
    success: boolean;
    data?: ClaudeSettings;
    error?: string;
}
export interface SaveConfigRequest {
    level: 'user' | 'project' | 'local';
    config: ClaudeSettings;
}
export interface SaveConfigResponse {
    success: boolean;
    error?: string;
}
export interface GetEffectiveConfigResponse {
    success: boolean;
    data?: EffectiveConfig;
    error?: string;
}
export interface ListAgentsResponse {
    success: boolean;
    data?: Agent[];
    error?: string;
}
export interface GetAgentRequest {
    filePath: string;
}
export interface GetAgentResponse {
    success: boolean;
    data?: Agent;
    error?: string;
}
export interface SaveAgentRequest {
    agent: Omit<Agent, 'lastModified'>;
}
export interface SaveAgentResponse {
    success: boolean;
    error?: string;
}
export interface DeleteAgentRequest {
    filePath: string;
}
export interface DeleteAgentResponse {
    success: boolean;
    error?: string;
}
export interface ListSkillsResponse {
    success: boolean;
    data?: Skill[];
    error?: string;
}
export interface ListCommandsResponse {
    success: boolean;
    data?: Command[];
    error?: string;
}
export interface ExecuteCLIRequest {
    command: string;
    args: string[];
    cwd?: string;
}
export interface ExecuteCLIResponse {
    success: boolean;
    stdout?: string;
    stderr?: string;
    exitCode?: number;
    error?: string;
}
export interface CheckClaudeInstalledResponse {
    success: boolean;
    installed: boolean;
    version?: string;
    path?: string;
    error?: string;
}
/**
 * IPC Event types for streaming/notifications
 */
export interface CLIOutputEvent {
    type: 'stdout' | 'stderr';
    data: string;
}
export interface FileChangedEvent {
    path: string;
    type: 'add' | 'change' | 'unlink';
}
export interface ValidationErrorEvent {
    path: string;
    errors: Array<{
        message: string;
        line?: number;
        column?: number;
    }>;
}
//# sourceMappingURL=ipc.types.d.ts.map