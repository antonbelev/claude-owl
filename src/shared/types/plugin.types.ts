/**
 * Type definitions for Claude Code plugins and marketplaces
 */

import type { PluginSecurityContext, OfficialPluginCategory } from './plugin-security.types';

/**
 * Plugin metadata from plugin.json
 */
export interface PluginMetadata {
  name: string;
  version?: string;
  description?: string;
  author?: {
    name?: string;
    email?: string;
    url?: string;
  };
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  category?: string;

  // Component paths
  commands?: string | string[];
  agents?: string | string[];
  hooks?: string | object;
  mcpServers?: string | object;
  skills?: string | string[];
}

/**
 * Installed plugin information
 */
export interface InstalledPlugin extends PluginMetadata {
  id: string; // Unique identifier: name@marketplace
  marketplace: string;
  installPath: string;
  enabled: boolean;
  installedAt: string;

  // Component counts
  componentCounts?: {
    commands: number;
    agents: number;
    skills: number;
    hooks: number;
    mcpServers: number;
  };
}

/**
 * Plugin listing in marketplace
 */
export interface MarketplacePlugin {
  name: string;
  source: string; // GitHub URL, git URL, or local path
  description?: string;
  version?: string;
  author?: string | { name?: string; email?: string; url?: string };
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  category?: string | OfficialPluginCategory;

  // Marketplace context
  marketplace: string;

  // Installation status
  installed?: boolean;
  installedVersion?: string;
  updateAvailable?: boolean;

  // Security context
  security?: PluginSecurityContext;

  // Official plugin flags
  isOfficial?: boolean;
  featured?: boolean;
}

/**
 * GitHub repository intelligence data
 */
export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  description?: string;
  stars: number;
  forks: number;
  openIssues: number;
  lastUpdate: string;
  defaultBranch: string;
  topics: string[];
  language?: string;
  license?: string;
  hasReadme: boolean;
  readmeContent?: string;
  contributors?: number;
  url: string;
}

/**
 * Marketplace metadata
 */
export interface Marketplace {
  name: string;
  source: string; // GitHub URL, git URL, local path, or HTTP URL
  owner?: string;
  description?: string;
  version?: string;
  pluginCount: number;
  addedAt: string;
  lastUpdated?: string;

  // Status
  available: boolean;
  error?: string;
}

/**
 * Marketplace manifest structure
 */
export interface MarketplaceManifest {
  name: string;
  owner: string;
  description?: string;
  version?: string;
  pluginRoot?: string;
  plugins: Array<{
    name: string;
    source: string;
    description?: string;
    version?: string;
    author?: string | object;
    homepage?: string;
    repository?: string;
    license?: string;
    keywords?: string[];
    category?: string;
  }>;
}

/**
 * Plugin installation result
 */
export interface PluginInstallResult {
  success: boolean;
  plugin?: InstalledPlugin;
  error?: string;
  warnings?: string[];
}

/**
 * Plugin health score metrics
 */
export interface PluginHealthScore {
  score: number; // 0-100
  factors: {
    recentlyUpdated: boolean;
    hasDocumentation: boolean;
    hasTests: boolean;
    activelyMaintained: boolean;
    hasLicense: boolean;
    wellDescribed: boolean;
  };
  recommendations?: string[];
}

/**
 * Plugin search filters
 */
export interface PluginFilters {
  search?: string;
  marketplace?: string;
  category?: string;
  hasCommands?: boolean;
  hasAgents?: boolean;
  hasSkills?: boolean;
  hasHooks?: boolean;
  hasMcpServers?: boolean;
  installedOnly?: boolean;
  updateAvailable?: boolean;
}

/**
 * Plugin view mode
 */
export type PluginViewMode = 'grid' | 'list';

/**
 * Plugin sort options
 */
export type PluginSortBy = 'name' | 'stars' | 'updated' | 'installed' | 'relevance';
