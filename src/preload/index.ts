import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@/shared/types';
import type { ComputeMetricsRequest } from '@/shared/types';

// Define settings channel strings directly to avoid tree-shaking
const SETTINGS_CHANNELS = {
  GET_SETTINGS: 'settings:get',
  SAVE_SETTINGS: 'settings:save',
  VALIDATE_SETTINGS: 'settings:validate',
  GET_EFFECTIVE_SETTINGS: 'settings:get-effective',
  SETTINGS_FILE_EXISTS: 'settings:file-exists',
  ENSURE_SETTINGS_FILE: 'settings:ensure-file',
  DELETE_SETTINGS: 'settings:delete',
  CREATE_BACKUP: 'settings:create-backup',
  RESTORE_BACKUP: 'settings:restore-backup',
  PARSE_RULE: 'settings:parse-rule',
  FORMAT_RULE: 'settings:format-rule',
  VALIDATE_RULE: 'settings:validate-rule',
  VALIDATE_PATTERN: 'settings:validate-pattern',
  TEST_RULE: 'settings:test-rule',
  GET_RULE_TEMPLATES: 'settings:get-rule-templates',
  APPLY_TEMPLATE: 'settings:apply-template',
} as const;

// Define ccusage channel strings directly to avoid tree-shaking
const CCUSAGE_CHANNELS = {
  CHECK_CCUSAGE_INSTALLED: 'ccusage:check-installed',
  GET_CCUSAGE_VERSION: 'ccusage:get-version',
  GET_USAGE_REPORT: 'ccusage:get-report',
  GET_RAW_OUTPUT: 'ccusage:get-raw-output',
} as const;

// Define metrics channel strings directly to avoid tree-shaking
const METRICS_CHANNELS = {
  COMPUTE_METRICS: 'metrics:compute',
} as const;

// Define plugins channel strings directly to avoid tree-shaking
const PLUGINS_CHANNELS = {
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
  VALIDATE_MARKETPLACE: 'plugins:validate-marketplace',
} as const;

// Define file browser channel strings directly to avoid tree-shaking
const FILEBROWSER_CHANNELS = {
  READ_DIRECTORY: 'filebrowser:read-directory',
  READ_FILE_CONTENT: 'filebrowser:read-file-content',
} as const;

// Define hooks channel strings directly to avoid tree-shaking
const HOOKS_CHANNELS = {
  GET_ALL_HOOKS: 'hooks:get-all',
  GET_TEMPLATES: 'hooks:get-templates',
  GET_SETTINGS_PATH: 'hooks:get-settings-path',
  OPEN_SETTINGS_FILE: 'hooks:open-settings',
} as const;

// Define MCP channel strings directly to avoid tree-shaking
const MCP_CHANNELS = {
  ADD_MCP_SERVER: 'mcp:add',
  REMOVE_MCP_SERVER: 'mcp:remove',
  LIST_MCP_SERVERS: 'mcp:list',
  GET_MCP_SERVER: 'mcp:get',
} as const;

// Define status channel strings directly to avoid tree-shaking
const STATUS_CHANNELS = {
  GET_SERVICE_STATUS: 'status:get-service-status',
} as const;

// Define debug logs channel strings directly to avoid tree-shaking
const LOGS_CHANNELS = {
  LIST_DEBUG_LOGS: 'logs:list',
  GET_DEBUG_LOG: 'logs:get',
  DELETE_DEBUG_LOG: 'logs:delete',
  SEARCH_DEBUG_LOGS: 'logs:search',
} as const;

// Define commands channel strings directly to avoid tree-shaking
const COMMANDS_CHANNELS = {
  LIST_COMMANDS: 'commands:list',
  GET_COMMAND: 'commands:get',
  CREATE_COMMAND: 'commands:create',
  UPDATE_COMMAND: 'commands:update',
  DELETE_COMMAND: 'commands:delete',
  MOVE_COMMAND: 'commands:move',
} as const;

// Define GitHub import channel strings directly to avoid tree-shaking
const GITHUB_CHANNELS = {
  GITHUB_BROWSE_URL: 'github:browse-url',
  GITHUB_NAVIGATE_FOLDER: 'github:navigate-folder',
  FETCH_GITHUB_FILES: 'github:fetch-files',
  SCAN_COMMAND_SECURITY: 'github:scan-security',
  AUTO_FIX_COMMAND: 'github:auto-fix',
  IMPORT_GITHUB_COMMANDS: 'github:import-commands',
} as const;

// Define project discovery channel strings directly to avoid tree-shaking
const PROJECTS_CHANNELS = {
  GET_PROJECTS: 'projects:get-all',
  GET_PROJECT_INFO: 'projects:get-info',
  GET_PROJECT_MCP_SERVERS: 'projects:get-mcp-servers',
  CHECK_CLAUDE_CONFIG: 'projects:check-config',
  READ_CLAUDE_CONFIG: 'projects:read-config',
} as const;

// Define statusline channel strings directly to avoid tree-shaking
const STATUSLINE_CHANNELS = {
  GET_ACTIVE_STATUSLINE: 'statusline:get-active',
  LIST_STATUSLINE_TEMPLATES: 'statusline:list-templates',
  SET_STATUSLINE_TEMPLATE: 'statusline:set-template',
  SET_CUSTOM_STATUSLINE: 'statusline:set-custom',
  PREVIEW_STATUSLINE: 'statusline:preview',
  DISABLE_STATUSLINE: 'statusline:disable',
  SCAN_STATUSLINE_SCRIPT: 'statusline:scan-script',
  EXPORT_STATUSLINE_SCRIPT: 'statusline:export-script',
} as const;

// Define remote MCP channel strings directly to avoid tree-shaking
const REMOTE_MCP_CHANNELS = {
  FETCH_DIRECTORY: 'remote-mcp:fetch-directory',
  SEARCH_SERVERS: 'remote-mcp:search',
  GET_SERVER_DETAILS: 'remote-mcp:get-details',
  TEST_CONNECTION: 'remote-mcp:test-connection',
  TEST_ALL_CONNECTIONS: 'remote-mcp:test-all',
  ADD_REMOTE_SERVER: 'remote-mcp:add',
  REFRESH_DIRECTORY: 'remote-mcp:refresh',
  GET_CACHE_STATUS: 'remote-mcp:cache-status',
} as const;

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // System
  getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.GET_APP_VERSION),
  getClaudeVersion: () => ipcRenderer.invoke(IPC_CHANNELS.GET_CLAUDE_VERSION),
  checkClaudeInstalled: () => ipcRenderer.invoke(IPC_CHANNELS.CHECK_CLAUDE_INSTALLED),
  openExternal: (url: string) => ipcRenderer.invoke('system:open-external', url),

  // Settings
  getSettings: (args: unknown) => ipcRenderer.invoke(SETTINGS_CHANNELS.GET_SETTINGS, args),
  saveSettings: (args: unknown) => ipcRenderer.invoke(SETTINGS_CHANNELS.SAVE_SETTINGS, args),
  validateSettings: (args: unknown) =>
    ipcRenderer.invoke(SETTINGS_CHANNELS.VALIDATE_SETTINGS, args),
  getEffectiveSettings: () => ipcRenderer.invoke(SETTINGS_CHANNELS.GET_EFFECTIVE_SETTINGS),
  settingsFileExists: (args: unknown) =>
    ipcRenderer.invoke(SETTINGS_CHANNELS.SETTINGS_FILE_EXISTS, args),
  ensureSettingsFile: (args: unknown) =>
    ipcRenderer.invoke(SETTINGS_CHANNELS.ENSURE_SETTINGS_FILE, args),
  deleteSettings: (args: unknown) => ipcRenderer.invoke(SETTINGS_CHANNELS.DELETE_SETTINGS, args),
  createBackup: (args: unknown) => ipcRenderer.invoke(SETTINGS_CHANNELS.CREATE_BACKUP, args),
  restoreBackup: (args: unknown) => ipcRenderer.invoke(SETTINGS_CHANNELS.RESTORE_BACKUP, args),

  // Permission Rules
  parseRule: (args: unknown) => ipcRenderer.invoke(SETTINGS_CHANNELS.PARSE_RULE, args),
  formatRule: (args: unknown) => ipcRenderer.invoke(SETTINGS_CHANNELS.FORMAT_RULE, args),
  validateRule: (args: unknown) => ipcRenderer.invoke(SETTINGS_CHANNELS.VALIDATE_RULE, args),
  validatePattern: (args: unknown) => ipcRenderer.invoke(SETTINGS_CHANNELS.VALIDATE_PATTERN, args),
  testRule: (args: unknown) => ipcRenderer.invoke(SETTINGS_CHANNELS.TEST_RULE, args),
  getRuleTemplates: () => ipcRenderer.invoke(SETTINGS_CHANNELS.GET_RULE_TEMPLATES),
  applyTemplate: (args: unknown) => ipcRenderer.invoke(SETTINGS_CHANNELS.APPLY_TEMPLATE, args),

  // Configuration (legacy)
  getConfig: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.GET_CONFIG, args),
  saveConfig: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_CONFIG, args),
  validateConfig: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.VALIDATE_CONFIG, args),
  getEffectiveConfig: () => ipcRenderer.invoke(IPC_CHANNELS.GET_EFFECTIVE_CONFIG),

  // Agents
  listAgents: () => ipcRenderer.invoke(IPC_CHANNELS.LIST_AGENTS),
  getAgent: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.GET_AGENT, args),
  saveAgent: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_AGENT, args),
  deleteAgent: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_AGENT, args),

  // Skills
  listSkills: () => ipcRenderer.invoke(IPC_CHANNELS.LIST_SKILLS),
  getSkill: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.GET_SKILL, args),
  saveSkill: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_SKILL, args),
  deleteSkill: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_SKILL, args),

  // Commands
  listCommands: (args?: unknown) => ipcRenderer.invoke(COMMANDS_CHANNELS.LIST_COMMANDS, args),
  getCommand: (args: unknown) => ipcRenderer.invoke(COMMANDS_CHANNELS.GET_COMMAND, args),
  createCommand: (args: unknown) => ipcRenderer.invoke(COMMANDS_CHANNELS.CREATE_COMMAND, args),
  updateCommand: (args: unknown) => ipcRenderer.invoke(COMMANDS_CHANNELS.UPDATE_COMMAND, args),
  deleteCommand: (args: unknown) => ipcRenderer.invoke(COMMANDS_CHANNELS.DELETE_COMMAND, args),
  moveCommand: (args: unknown) => ipcRenderer.invoke(COMMANDS_CHANNELS.MOVE_COMMAND, args),

  // GitHub Import
  // GitHub Import (refactored with lazy loading)
  browseGitHubUrl: (args: unknown) => ipcRenderer.invoke(GITHUB_CHANNELS.GITHUB_BROWSE_URL, args),
  navigateGitHubFolder: (args: unknown) =>
    ipcRenderer.invoke(GITHUB_CHANNELS.GITHUB_NAVIGATE_FOLDER, args),
  fetchGitHubFiles: (args: unknown) => ipcRenderer.invoke(GITHUB_CHANNELS.FETCH_GITHUB_FILES, args),
  scanCommandSecurity: (args: unknown) =>
    ipcRenderer.invoke(GITHUB_CHANNELS.SCAN_COMMAND_SECURITY, args),
  autoFixCommand: (args: unknown) => ipcRenderer.invoke(GITHUB_CHANNELS.AUTO_FIX_COMMAND, args),
  importGitHubCommands: (args: unknown) =>
    ipcRenderer.invoke(GITHUB_CHANNELS.IMPORT_GITHUB_COMMANDS, args),

  // Plugins
  getMarketplaces: () => ipcRenderer.invoke(PLUGINS_CHANNELS.GET_MARKETPLACES),
  addMarketplace: (args: unknown) => ipcRenderer.invoke(PLUGINS_CHANNELS.ADD_MARKETPLACE, args),
  removeMarketplace: (args: unknown) =>
    ipcRenderer.invoke(PLUGINS_CHANNELS.REMOVE_MARKETPLACE, args),
  getAvailablePlugins: () => ipcRenderer.invoke(PLUGINS_CHANNELS.GET_AVAILABLE_PLUGINS),
  getInstalledPlugins: () => ipcRenderer.invoke(PLUGINS_CHANNELS.GET_INSTALLED_PLUGINS),
  installPlugin: (args: unknown) => ipcRenderer.invoke(PLUGINS_CHANNELS.INSTALL_PLUGIN, args),
  uninstallPlugin: (args: unknown) => ipcRenderer.invoke(PLUGINS_CHANNELS.UNINSTALL_PLUGIN, args),
  togglePlugin: (args: unknown) => ipcRenderer.invoke(PLUGINS_CHANNELS.TOGGLE_PLUGIN, args),
  getGitHubRepoInfo: (args: unknown) =>
    ipcRenderer.invoke(PLUGINS_CHANNELS.GET_GITHUB_REPO_INFO, args),
  getPluginHealth: (args: unknown) => ipcRenderer.invoke(PLUGINS_CHANNELS.GET_PLUGIN_HEALTH, args),
  validateMarketplace: (args: unknown) =>
    ipcRenderer.invoke(PLUGINS_CHANNELS.VALIDATE_MARKETPLACE, args),

  // File Browser
  readDirectory: (args: unknown) => ipcRenderer.invoke(FILEBROWSER_CHANNELS.READ_DIRECTORY, args),
  readFileContent: (args: unknown) =>
    ipcRenderer.invoke(FILEBROWSER_CHANNELS.READ_FILE_CONTENT, args),

  // CCUsage (deprecated - replaced by Metrics)
  checkCCUsageInstalled: () => ipcRenderer.invoke(CCUSAGE_CHANNELS.CHECK_CCUSAGE_INSTALLED),
  getCCUsageVersion: () => ipcRenderer.invoke(CCUSAGE_CHANNELS.GET_CCUSAGE_VERSION),
  getUsageReport: () => ipcRenderer.invoke(CCUSAGE_CHANNELS.GET_USAGE_REPORT),
  getCCUsageRawOutput: () => ipcRenderer.invoke(CCUSAGE_CHANNELS.GET_RAW_OUTPUT),

  // Metrics
  computeMetrics: (request?: ComputeMetricsRequest) =>
    ipcRenderer.invoke(METRICS_CHANNELS.COMPUTE_METRICS, request),

  // Hooks
  getAllHooks: (args: unknown) => ipcRenderer.invoke(HOOKS_CHANNELS.GET_ALL_HOOKS, args),
  getHookTemplates: () => ipcRenderer.invoke(HOOKS_CHANNELS.GET_TEMPLATES),
  getHookSettingsPath: (args: unknown) =>
    ipcRenderer.invoke(HOOKS_CHANNELS.GET_SETTINGS_PATH, args),
  openHookSettingsFile: (args: unknown) =>
    ipcRenderer.invoke(HOOKS_CHANNELS.OPEN_SETTINGS_FILE, args),

  // MCP Servers
  addMCPServer: (args: unknown) => ipcRenderer.invoke(MCP_CHANNELS.ADD_MCP_SERVER, args),
  removeMCPServer: (args: unknown) => ipcRenderer.invoke(MCP_CHANNELS.REMOVE_MCP_SERVER, args),
  listMCPServers: (args?: unknown) => ipcRenderer.invoke(MCP_CHANNELS.LIST_MCP_SERVERS, args),
  getMCPServer: (args: unknown) => ipcRenderer.invoke(MCP_CHANNELS.GET_MCP_SERVER, args),

  // Service Status
  getServiceStatus: () => ipcRenderer.invoke(STATUS_CHANNELS.GET_SERVICE_STATUS),

  // Debug Logs
  listDebugLogs: () => ipcRenderer.invoke(LOGS_CHANNELS.LIST_DEBUG_LOGS),
  getDebugLog: (args: unknown) => ipcRenderer.invoke(LOGS_CHANNELS.GET_DEBUG_LOG, args),
  deleteDebugLog: (args: unknown) => ipcRenderer.invoke(LOGS_CHANNELS.DELETE_DEBUG_LOG, args),
  searchDebugLogs: (args: unknown) => ipcRenderer.invoke(LOGS_CHANNELS.SEARCH_DEBUG_LOGS, args),

  // Project Discovery
  getProjects: () => ipcRenderer.invoke(PROJECTS_CHANNELS.GET_PROJECTS),
  getProjectInfo: (args: unknown) => ipcRenderer.invoke(PROJECTS_CHANNELS.GET_PROJECT_INFO, args),
  getProjectMCPServers: (args: unknown) =>
    ipcRenderer.invoke(PROJECTS_CHANNELS.GET_PROJECT_MCP_SERVERS, args),
  checkClaudeConfig: () => ipcRenderer.invoke(PROJECTS_CHANNELS.CHECK_CLAUDE_CONFIG),
  readClaudeConfig: () => ipcRenderer.invoke(PROJECTS_CHANNELS.READ_CLAUDE_CONFIG),

  // Status Line
  getActiveStatusLine: () => ipcRenderer.invoke(STATUSLINE_CHANNELS.GET_ACTIVE_STATUSLINE),
  listStatusLineTemplates: () => ipcRenderer.invoke(STATUSLINE_CHANNELS.LIST_STATUSLINE_TEMPLATES),
  setStatusLineTemplate: (args: unknown) =>
    ipcRenderer.invoke(STATUSLINE_CHANNELS.SET_STATUSLINE_TEMPLATE, args),
  setCustomStatusLine: (args: unknown) =>
    ipcRenderer.invoke(STATUSLINE_CHANNELS.SET_CUSTOM_STATUSLINE, args),
  previewStatusLine: (args: unknown) =>
    ipcRenderer.invoke(STATUSLINE_CHANNELS.PREVIEW_STATUSLINE, args),
  disableStatusLine: () => ipcRenderer.invoke(STATUSLINE_CHANNELS.DISABLE_STATUSLINE),
  scanStatusLineScript: (args: unknown) =>
    ipcRenderer.invoke(STATUSLINE_CHANNELS.SCAN_STATUSLINE_SCRIPT, args),
  exportStatusLineScript: (args: unknown) =>
    ipcRenderer.invoke(STATUSLINE_CHANNELS.EXPORT_STATUSLINE_SCRIPT, args),

  // Remote MCP Servers
  fetchRemoteMCPDirectory: (args?: unknown) =>
    ipcRenderer.invoke(REMOTE_MCP_CHANNELS.FETCH_DIRECTORY, args),
  searchRemoteMCPServers: (args: unknown) =>
    ipcRenderer.invoke(REMOTE_MCP_CHANNELS.SEARCH_SERVERS, args),
  getRemoteMCPServerDetails: (args: unknown) =>
    ipcRenderer.invoke(REMOTE_MCP_CHANNELS.GET_SERVER_DETAILS, args),
  testRemoteMCPConnection: (args: unknown) =>
    ipcRenderer.invoke(REMOTE_MCP_CHANNELS.TEST_CONNECTION, args),
  testAllRemoteMCPConnections: (args: unknown) =>
    ipcRenderer.invoke(REMOTE_MCP_CHANNELS.TEST_ALL_CONNECTIONS, args),
  addRemoteMCPServer: (args: unknown) =>
    ipcRenderer.invoke(REMOTE_MCP_CHANNELS.ADD_REMOTE_SERVER, args),
  refreshRemoteMCPDirectory: () => ipcRenderer.invoke(REMOTE_MCP_CHANNELS.REFRESH_DIRECTORY),
  getRemoteMCPCacheStatus: () => ipcRenderer.invoke(REMOTE_MCP_CHANNELS.GET_CACHE_STATUS),

  // Claude CLI
  executeCLI: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.EXECUTE_CLI, args),
  stopCLI: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.STOP_CLI, args),

  // File System
  readFile: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.READ_FILE, args),
  writeFile: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.WRITE_FILE, args),
  listDirectory: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.LIST_DIRECTORY, args),

  // Event listeners
  onCLIOutput: (callback: (event: unknown, data: unknown) => void) => {
    ipcRenderer.on('cli:output', callback);
    return () => ipcRenderer.removeListener('cli:output', callback);
  },
  onFileChanged: (callback: (event: unknown, data: unknown) => void) => {
    ipcRenderer.on('file:changed', callback);
    return () => ipcRenderer.removeListener('file:changed', callback);
  },
});

// Type definitions for the exposed API
export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getClaudeVersion: () => Promise<string | null>;
  checkClaudeInstalled: () => Promise<unknown>;
  openExternal: (url: string) => Promise<unknown>;
  getSettings: (args: unknown) => Promise<unknown>;
  saveSettings: (args: unknown) => Promise<unknown>;
  validateSettings: (args: unknown) => Promise<unknown>;
  getEffectiveSettings: () => Promise<unknown>;
  settingsFileExists: (args: unknown) => Promise<unknown>;
  ensureSettingsFile: (args: unknown) => Promise<unknown>;
  deleteSettings: (args: unknown) => Promise<unknown>;
  createBackup: (args: unknown) => Promise<unknown>;
  restoreBackup: (args: unknown) => Promise<unknown>;
  parseRule: (args: unknown) => Promise<unknown>;
  formatRule: (args: unknown) => Promise<unknown>;
  validateRule: (args: unknown) => Promise<unknown>;
  validatePattern: (args: unknown) => Promise<unknown>;
  testRule: (args: unknown) => Promise<unknown>;
  getRuleTemplates: () => Promise<unknown>;
  applyTemplate: (args: unknown) => Promise<unknown>;
  getConfig: (args: unknown) => Promise<unknown>;
  saveConfig: (args: unknown) => Promise<unknown>;
  validateConfig: (args: unknown) => Promise<unknown>;
  getEffectiveConfig: () => Promise<unknown>;
  listAgents: () => Promise<unknown>;
  getAgent: (args: unknown) => Promise<unknown>;
  saveAgent: (args: unknown) => Promise<unknown>;
  deleteAgent: (args: unknown) => Promise<unknown>;
  listSkills: () => Promise<unknown>;
  getSkill: (args: unknown) => Promise<unknown>;
  saveSkill: (args: unknown) => Promise<unknown>;
  deleteSkill: (args: unknown) => Promise<unknown>;
  listCommands: (args?: unknown) => Promise<unknown>;
  getCommand: (args: unknown) => Promise<unknown>;
  createCommand: (args: unknown) => Promise<unknown>;
  updateCommand: (args: unknown) => Promise<unknown>;
  deleteCommand: (args: unknown) => Promise<unknown>;
  moveCommand: (args: unknown) => Promise<unknown>;
  // GitHub Import (refactored with lazy loading)
  browseGitHubUrl: (args: unknown) => Promise<unknown>;
  navigateGitHubFolder: (args: unknown) => Promise<unknown>;
  fetchGitHubFiles: (args: unknown) => Promise<unknown>;
  scanCommandSecurity: (args: unknown) => Promise<unknown>;
  autoFixCommand: (args: unknown) => Promise<unknown>;
  importGitHubCommands: (args: unknown) => Promise<unknown>;
  getMarketplaces: () => Promise<unknown>;
  addMarketplace: (args: unknown) => Promise<unknown>;
  removeMarketplace: (args: unknown) => Promise<unknown>;
  getAvailablePlugins: () => Promise<unknown>;
  getInstalledPlugins: () => Promise<unknown>;
  installPlugin: (args: unknown) => Promise<unknown>;
  uninstallPlugin: (args: unknown) => Promise<unknown>;
  togglePlugin: (args: unknown) => Promise<unknown>;
  getGitHubRepoInfo: (args: unknown) => Promise<unknown>;
  getPluginHealth: (args: unknown) => Promise<unknown>;
  validateMarketplace: (args: unknown) => Promise<unknown>;
  readDirectory: (args: unknown) => Promise<unknown>;
  readFileContent: (args: unknown) => Promise<unknown>;
  executeCLI: (args: unknown) => Promise<unknown>;
  stopCLI: (args: unknown) => Promise<unknown>;
  readFile: (args: unknown) => Promise<unknown>;
  writeFile: (args: unknown) => Promise<unknown>;
  listDirectory: (args: unknown) => Promise<unknown>;
  onCLIOutput: (callback: (event: unknown, data: unknown) => void) => () => void;
  onFileChanged: (callback: (event: unknown) => void) => () => void;
  checkCCUsageInstalled: () => Promise<unknown>;
  getCCUsageVersion: () => Promise<unknown>;
  getUsageReport: () => Promise<unknown>;
  getCCUsageRawOutput: () => Promise<unknown>;
  computeMetrics: (
    request?: ComputeMetricsRequest
  ) => Promise<import('@/shared/types').ComputeMetricsResponse>;
  getServiceStatus: () => Promise<unknown>;
  getAllHooks: (args: unknown) => Promise<unknown>;
  getHookTemplates: () => Promise<unknown>;
  getHookSettingsPath: (args: unknown) => Promise<unknown>;
  openHookSettingsFile: (args: unknown) => Promise<unknown>;
  addMCPServer: (args: unknown) => Promise<unknown>;
  removeMCPServer: (args: unknown) => Promise<unknown>;
  listMCPServers: (args?: unknown) => Promise<unknown>;
  getMCPServer: (args: unknown) => Promise<unknown>;
  listDebugLogs: () => Promise<unknown>;
  getDebugLog: (args: unknown) => Promise<unknown>;
  deleteDebugLog: (args: unknown) => Promise<unknown>;
  searchDebugLogs: (args: unknown) => Promise<unknown>;
  getProjects: () => Promise<unknown>;
  getProjectInfo: (args: unknown) => Promise<unknown>;
  getProjectMCPServers: (args: unknown) => Promise<unknown>;
  checkClaudeConfig: () => Promise<unknown>;
  readClaudeConfig: () => Promise<unknown>;
  getActiveStatusLine: () => Promise<unknown>;
  listStatusLineTemplates: () => Promise<unknown>;
  setStatusLineTemplate: (args: unknown) => Promise<unknown>;
  setCustomStatusLine: (args: unknown) => Promise<unknown>;
  previewStatusLine: (args: unknown) => Promise<unknown>;
  disableStatusLine: () => Promise<unknown>;
  scanStatusLineScript: (args: unknown) => Promise<unknown>;
  exportStatusLineScript: (args: unknown) => Promise<unknown>;
  fetchRemoteMCPDirectory: (args?: unknown) => Promise<unknown>;
  searchRemoteMCPServers: (args: unknown) => Promise<unknown>;
  getRemoteMCPServerDetails: (args: unknown) => Promise<unknown>;
  testRemoteMCPConnection: (args: unknown) => Promise<unknown>;
  testAllRemoteMCPConnections: (args: unknown) => Promise<unknown>;
  addRemoteMCPServer: (args: unknown) => Promise<unknown>;
  refreshRemoteMCPDirectory: () => Promise<unknown>;
  getRemoteMCPCacheStatus: () => Promise<unknown>;
}
