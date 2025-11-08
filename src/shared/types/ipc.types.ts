/**
 * IPC (Inter-Process Communication) type definitions
 * Defines the contract between main and renderer processes
 */

import type { ClaudeSettings, EffectiveConfig } from './config.types';
import type { Agent, Skill, Command } from './agent.types';
import type {
  Marketplace,
  MarketplacePlugin,
  InstalledPlugin,
  PluginInstallResult,
  GitHubRepoInfo,
  PluginHealthScore,
} from './plugin.types';

/**
 * IPC Channel names
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
} as const;

/**
 * IPC Request/Response types
 */

// Settings
export interface GetSettingsRequest {
  level: 'user' | 'project' | 'local' | 'managed';
}

export interface GetSettingsResponse {
  success: boolean;
  data?: {
    level: 'user' | 'project' | 'local' | 'managed';
    path: string;
    exists: boolean;
    content: ClaudeSettings;
  };
  error?: string;
}

export interface SaveSettingsRequest {
  level: 'user' | 'project' | 'local';
  settings: ClaudeSettings;
}

export interface SaveSettingsResponse {
  success: boolean;
  error?: string;
}

export interface ValidateSettingsRequest {
  settings: ClaudeSettings;
}

export interface ValidateSettingsResponse {
  success: boolean;
  data?: {
    valid: boolean;
    errors: Array<{ path: string; message: string; severity: 'error' | 'warning' | 'info' }>;
    warnings: Array<{ path: string; message: string; severity: 'error' | 'warning' | 'info' }>;
  };
  error?: string;
}

export interface GetEffectiveSettingsResponse {
  success: boolean;
  data?: EffectiveConfig;
  error?: string;
}

export interface SettingsFileExistsRequest {
  level: 'user' | 'project' | 'local' | 'managed';
}

export interface SettingsFileExistsResponse {
  success: boolean;
  data?: { exists: boolean };
  error?: string;
}

export interface EnsureSettingsFileRequest {
  level: 'user' | 'project' | 'local';
}

export interface EnsureSettingsFileResponse {
  success: boolean;
  error?: string;
}

export interface DeleteSettingsRequest {
  level: 'user' | 'project' | 'local';
}

export interface DeleteSettingsResponse {
  success: boolean;
  error?: string;
}

// Configuration (legacy, keeping for backwards compatibility)
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

// Agents
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

// Skills (similar structure to agents)
export interface ListSkillsResponse {
  success: boolean;
  data?: Skill[];
  error?: string;
}

export interface GetSkillRequest {
  name: string;
  location: 'user' | 'project';
}

export interface GetSkillResponse {
  success: boolean;
  data?: Skill;
  error?: string;
}

export interface SaveSkillRequest {
  skill: {
    name: string;
    description: string;
    'allowed-tools'?: string[];
    content: string;
    location: 'user' | 'project';
  };
}

export interface SaveSkillResponse {
  success: boolean;
  data?: Skill;
  error?: string;
}

export interface DeleteSkillRequest {
  name: string;
  location: 'user' | 'project';
}

export interface DeleteSkillResponse {
  success: boolean;
  error?: string;
}

// Commands (similar structure to agents)
export interface ListCommandsResponse {
  success: boolean;
  data?: Command[];
  error?: string;
}

// Claude CLI
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

// System
export interface CheckClaudeInstalledResponse {
  success: boolean;
  installed: boolean;
  version?: string;
  path?: string;
  error?: string;
}

// CCUsage
export interface UsageDay {
  date: string;
  models: string[];
  input: number;
  output: number;
  cacheCreate: number;
  cacheRead: number;
  totalTokens: number;
  cost: number;
}

export interface UsageReport {
  days: UsageDay[];
  total: {
    input: number;
    output: number;
    cacheCreate: number;
    cacheRead: number;
    totalTokens: number;
    cost: number;
  };
}

export interface CheckCCUsageInstalledResponse {
  success: boolean;
  installed: boolean;
  error?: string;
}

export interface GetCCUsageVersionResponse {
  success: boolean;
  version: string | null;
  error?: string;
}

export interface GetUsageReportResponse {
  success: boolean;
  data?: UsageReport;
  error?: string;
}

// Plugins
export interface GetMarketplacesResponse {
  success: boolean;
  data?: Marketplace[];
  error?: string;
}

export interface AddMarketplaceRequest {
  name: string;
  source: string;
}

export interface AddMarketplaceResponse {
  success: boolean;
  error?: string;
}

export interface RemoveMarketplaceRequest {
  name: string;
}

export interface RemoveMarketplaceResponse {
  success: boolean;
  error?: string;
}

export interface GetAvailablePluginsResponse {
  success: boolean;
  data?: MarketplacePlugin[];
  error?: string;
}

export interface GetInstalledPluginsResponse {
  success: boolean;
  data?: InstalledPlugin[];
  error?: string;
}

export interface InstallPluginRequest {
  pluginName: string;
  marketplaceName: string;
}

export interface InstallPluginResponse {
  success: boolean;
  data?: PluginInstallResult;
  error?: string;
}

export interface UninstallPluginRequest {
  pluginId: string;
}

export interface UninstallPluginResponse {
  success: boolean;
  error?: string;
}

export interface TogglePluginRequest {
  pluginId: string;
  enabled: boolean;
}

export interface TogglePluginResponse {
  success: boolean;
  error?: string;
}

export interface GetGitHubRepoInfoRequest {
  repoUrl: string;
}

export interface GetGitHubRepoInfoResponse {
  success: boolean;
  data?: GitHubRepoInfo | null;
  error?: string;
}

export interface GetPluginHealthRequest {
  plugin: MarketplacePlugin | InstalledPlugin;
}

export interface GetPluginHealthResponse {
  success: boolean;
  data?: PluginHealthScore;
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

// Hooks
export interface GetAllHooksRequest {
  projectPath?: string;
}

export interface GetAllHooksResponse {
  success: boolean;
  data?: import('./hook.types').HookEventSummary[];
  error?: string;
}

export interface GetTemplatesResponse {
  success: boolean;
  data?: import('./hook.types').HookTemplate[];
  error?: string;
}

export interface GetSettingsPathRequest {
  location: 'user' | 'project';
  projectPath?: string;
}

export interface GetSettingsPathResponse {
  success: boolean;
  data?: {
    path: string;
    exists: boolean;
  };
  error?: string;
}

export interface OpenSettingsFileRequest {
  location: 'user' | 'project';
  projectPath?: string;
}

export interface OpenSettingsFileResponse {
  success: boolean;
  error?: string;
}

// Service Status
export type ServiceStatusLevel = 'operational' | 'degraded' | 'outage' | 'maintenance' | 'unknown';

export interface ServiceIncidentUpdate {
  status: string; // e.g., "Resolved", "Investigating", "Monitoring"
  message: string;
  timestamp: string; // ISO 8601
}

export interface ServiceIncident {
  id: string;
  title: string;
  url: string;
  publishedAt: string; // ISO 8601
  updates: ServiceIncidentUpdate[];
  resolved: boolean;
}

export interface ServiceStatus {
  level: ServiceStatusLevel;
  message: string;
  lastChecked: string; // ISO 8601
  recentIncidents: ServiceIncident[];
}

export interface GetServiceStatusResponse {
  success: boolean;
  data?: ServiceStatus;
  error?: string;
}
