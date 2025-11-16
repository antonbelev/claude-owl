/**
 * Configuration-related type definitions
 * Based on Claude Code settings.json schema
 */

/**
 * Main Claude Code settings structure
 */
export interface ClaudeSettings {
  // Core Configuration
  model?: string;
  outputStyle?: string;
  statusLine?: StatusLineConfig;
  cleanupPeriodDays?: number;
  companyAnnouncements?: string;

  // Authentication & Authorization
  apiKeyHelper?: string;
  forceLoginMethod?: 'claudeai' | 'console';
  forceLoginOrgUUID?: string;
  awsAuthRefresh?: string;
  awsCredentialExport?: string;

  // Git & Development
  includeCoAuthoredBy?: boolean;

  // MCP Server Management
  enableAllProjectMcpServers?: boolean;
  enabledMcpjsonServers?: string[];
  disabledMcpjsonServers?: string[];
  allowedMcpServers?: string[];
  deniedMcpServers?: string[];

  // Permissions
  permissions?: PermissionsConfig;

  // Sandbox
  sandbox?: SandboxConfig;

  // Hooks
  hooks?: HooksConfig;
  disableAllHooks?: boolean;

  // Plugins
  enabledPlugins?: Record<string, boolean>;
  extraKnownMarketplaces?: MarketplaceConfig[];

  // Environment Variables
  env?: Record<string, string>;

  // Allow additional unknown properties
  [key: string]: unknown;
}

/**
 * Status line configuration for custom status display
 */
export interface StatusLineConfig {
  type?: 'command' | 'text';
  command?: string;
  text?: string;
  padding?: number;
}

/**
 * Permissions configuration for tool access control
 */
export interface PermissionsConfig {
  allow?: string[];
  deny?: string[];
  ask?: string[];
  additionalDirectories?: string[];
  defaultMode?: string;
  disableBypassPermissionsMode?: 'disable';
}

/**
 * Sandbox configuration for bash command isolation
 */
export interface SandboxConfig {
  enabled?: boolean;
  autoAllowBashIfSandboxed?: boolean;
  excludedCommands?: string[];
  allowUnsandboxedCommands?: boolean;
  network?: SandboxNetworkConfig;
  enableWeakerNestedSandbox?: boolean;
}

/**
 * Sandbox network configuration
 */
export interface SandboxNetworkConfig {
  allowUnixSockets?: string[];
  allowLocalBinding?: boolean;
  httpProxyPort?: number;
  socksProxyPort?: number;
}

/**
 * Hooks configuration for custom pre/post tool execution
 */
export interface HooksConfig {
  PreToolUse?: Record<string, string>;
  PostToolUse?: Record<string, string>;
  UserPromptSubmit?: Record<string, string>;
  [key: string]: Record<string, string> | undefined;
}

/**
 * Marketplace configuration for plugin sources
 */
export interface MarketplaceConfig {
  name: string;
  type: 'github' | 'git' | 'directory';
  repo?: string;
  url?: string;
  path?: string;
}

/**
 * Model configuration (legacy, now uses 'model' string)
 */
export interface ModelConfig {
  defaultModel?: 'sonnet' | 'opus' | 'haiku';
  temperature?: number;
  maxTokens?: number;
}

/**
 * Configuration level in the hierarchy
 */
export type ConfigLevel = 'user' | 'project' | 'local' | 'managed';

/**
 * Configuration source with metadata
 */
export interface ConfigSource {
  level: ConfigLevel;
  path: string;
  exists: boolean;
  content: ClaudeSettings;
}

/**
 * Effective (merged) configuration with sources
 */
export interface EffectiveConfig {
  merged: ClaudeSettings;
  sources: ConfigSource[];
}

/**
 * Validation error for settings
 */
export interface SettingsValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Settings validation result
 */
export interface SettingsValidationResult {
  valid: boolean;
  errors: SettingsValidationError[];
  warnings: SettingsValidationError[];
}
