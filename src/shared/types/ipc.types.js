/**
 * IPC (Inter-Process Communication) type definitions
 * Defines the contract between main and renderer processes
 */
/**
 * IPC Channel names
 */
export const IPC_CHANNELS = {
    // Configuration
    GET_CONFIG: 'config:get',
    SAVE_CONFIG: 'config:save',
    VALIDATE_CONFIG: 'config:validate',
    GET_EFFECTIVE_CONFIG: 'config:get-effective',
    // Agents
    LIST_AGENTS: 'agents:list',
    GET_AGENT: 'agents:get',
    SAVE_AGENT: 'agents:save',
    DELETE_AGENT: 'agents:delete',
    // Skills
    LIST_SKILLS: 'skills:list',
    GET_SKILL: 'skills:get',
    SAVE_SKILL: 'skills:save',
    DELETE_SKILL: 'skills:delete',
    // Commands
    LIST_COMMANDS: 'commands:list',
    GET_COMMAND: 'commands:get',
    SAVE_COMMAND: 'commands:save',
    DELETE_COMMAND: 'commands:delete',
    // Claude CLI
    EXECUTE_CLI: 'cli:execute',
    STOP_CLI: 'cli:stop',
    // File System
    READ_FILE: 'fs:read',
    WRITE_FILE: 'fs:write',
    LIST_DIRECTORY: 'fs:list',
    // System
    GET_APP_VERSION: 'system:version',
    GET_CLAUDE_VERSION: 'system:claude-version',
    CHECK_CLAUDE_INSTALLED: 'system:check-claude',
};
//# sourceMappingURL=ipc.types.js.map