/**
 * Plugins IPC type definitions
 */

import type {
  Marketplace,
  MarketplacePlugin,
  InstalledPlugin,
  PluginInstallResult,
  GitHubRepoInfo,
  PluginHealthScore,
} from './plugin.types';
import type { IPCResponse } from './ipc.common.types';

/**
 * Marketplace request/response types
 */

export interface GetMarketplacesResponse extends IPCResponse<Marketplace[]> {}

export interface AddMarketplaceRequest {
  source: string; // GitHub URL, Git URL, or local path
  // Note: marketplace name comes from the .claude-plugin/marketplace.json file's "name" field
}

export interface AddMarketplaceResponse extends IPCResponse {}

export interface RemoveMarketplaceRequest {
  name: string;
}

export interface RemoveMarketplaceResponse extends IPCResponse {}

/**
 * Plugin request/response types
 */

export interface GetAvailablePluginsResponse extends IPCResponse<MarketplacePlugin[]> {}

export interface GetInstalledPluginsResponse extends IPCResponse<InstalledPlugin[]> {}

export interface InstallPluginRequest {
  pluginName: string;
  marketplaceName: string;
}

export interface InstallPluginResponse extends IPCResponse<PluginInstallResult> {}

export interface UninstallPluginRequest {
  pluginId: string;
}

export interface UninstallPluginResponse extends IPCResponse {}

export interface TogglePluginRequest {
  pluginId: string;
  enabled: boolean;
}

export interface TogglePluginResponse extends IPCResponse {}

/**
 * GitHub and Health request/response types
 */

export interface GetGitHubRepoInfoRequest {
  repoUrl: string;
}

export interface GetGitHubRepoInfoResponse extends IPCResponse<GitHubRepoInfo | null> {}

export interface GetPluginHealthRequest {
  plugin: MarketplacePlugin | InstalledPlugin;
}

export interface GetPluginHealthResponse extends IPCResponse<PluginHealthScore> {}

/**
 * Marketplace validation request/response types
 */

export interface ValidateMarketplaceRequest {
  url: string;
}

export interface MarketplaceValidationResult {
  valid: boolean;
  url: string;
  hasManifest: boolean;
  manifestPath?: string;
  marketplaceName?: string; // Name from manifest.json
  pluginCount?: number; // Number of plugins in manifest
  error?: string;
  suggestions?: string[];
}

export interface ValidateMarketplaceResponse extends IPCResponse<MarketplaceValidationResult> {}
