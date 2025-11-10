/**
 * Common IPC type definitions shared across domains
 */

/**
 * IPC Channel names - All channels organized by domain
 * This is the single source of truth for all IPC channel definitions
 */
export const IPC_CHANNELS = {
  // Settings
  GET_SETTINGS: 'settings:get',
  SAVE_SETTINGS: 'settings:save',
  VALIDATE_SETTINGS: 'settings:validate',
  GET_EFFECTIVE_SETTINGS: 'settings:get-effective',
  SETTINGS_FILE_EXISTS: 'settings:file-exists',
  ENSURE_SETTINGS_FILE: 'settings:ensure-file',
  DELETE_SETTINGS: 'settings:delete',

  // Configuration (legacy, keeping for backwards compatibility)
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

  // CCUsage
  CHECK_CCUSAGE_INSTALLED: 'ccusage:check-installed',
  GET_CCUSAGE_VERSION: 'ccusage:get-version',
  GET_USAGE_REPORT: 'ccusage:get-report',

  // Plugins
  GET_MARKETPLACES: 'plugins:get-marketplaces',
  ADD_MARKETPLACE: 'plugins:add-marketplace',
  REMOVE_MARKETPLACE: 'plugins:remove-marketplace',
  GET_AVAILABLE_PLUGINS: 'plugins:get-available',
  GET_INSTALLED_PLUGINS: 'plugins:get-installed',
  INSTALL_PLUGIN: 'plugins:install',
  UNINSTALL_PLUGIN: 'plugins:uninstall',
  TOGGLE_PLUGIN: 'plugins:toggle',
  GET_GITHUB_REPO_INFO: 'plugins:get-github-info',
  GET_PLUGIN_HEALTH: 'plugins:get-health',

  // Hooks
  GET_ALL_HOOKS: 'hooks:get-all',
  GET_TEMPLATES: 'hooks:get-templates',
  GET_SETTINGS_PATH: 'hooks:get-settings-path',
  OPEN_SETTINGS_FILE: 'hooks:open-settings',

  // Service Status
  GET_SERVICE_STATUS: 'status:get-service-status',

  // Debug Logs
  LIST_DEBUG_LOGS: 'logs:list',
  GET_DEBUG_LOG: 'logs:get',
  DELETE_DEBUG_LOG: 'logs:delete',
  SEARCH_DEBUG_LOGS: 'logs:search',
} as const;

/**
 * Base response interface used by all IPC responses
 */
export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
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
