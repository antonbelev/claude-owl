/**
 * Security and trust types for Claude Code plugins
 */

export type PluginTrustLevel =
  | 'official' // Anthropic official plugins
  | 'verified' // Third-party verified publishers
  | 'community' // Community-submitted
  | 'unknown'; // Unverified source

export interface PluginPublisher {
  name: string;
  verified: boolean;
  url?: string;
}

export interface PluginRepository {
  url: string;
  stars?: number;
  lastUpdate?: string;
  license?: string;
}

export interface PluginRiskFactor {
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
}

export type PluginPermissionType = 'filesystem' | 'network' | 'shell' | 'mcp';

export interface PluginPermission {
  type: PluginPermissionType;
  description: string;
  scope?: string;
}

export interface PluginSecurityContext {
  trustLevel: PluginTrustLevel;
  publisher: PluginPublisher;
  repository: PluginRepository;
  riskFactors: PluginRiskFactor[];
  permissions: PluginPermission[];
}

/**
 * Plugin with security context for UI display
 */
export interface PluginWithSecurity {
  name: string;
  description?: string;
  version?: string;
  marketplace: string;
  security: PluginSecurityContext;
}

/**
 * Official Anthropic plugin category
 */
export type OfficialPluginCategory =
  | 'code-review'
  | 'development'
  | 'security'
  | 'productivity'
  | 'learning';

/**
 * Plugin installation options
 */
export interface PluginInstallOptions {
  pluginName: string;
  marketplaceName: string;
  scope: 'user' | 'project';
  projectPath?: string;
  skipSecurityCheck?: boolean; // For official plugins only
}
