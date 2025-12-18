/**
 * Service for managing Claude Code plugins and marketplaces
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  InstalledPlugin,
  Marketplace,
  MarketplacePlugin,
  MarketplaceManifest,
  PluginMetadata,
  PluginInstallResult,
  GitHubRepoInfo,
  PluginHealthScore,
} from '../../shared/types/plugin.types';
import type { ClaudeService } from './ClaudeService';
import type { SettingsService } from './SettingsService';

export class PluginsService {
  private claudeUserDir: string;
  private pluginsDir: string;
  private marketplacesFile: string;
  private installedPluginsFile: string;
  private claudeService: ClaudeService | null = null;
  private settingsService: SettingsService | null = null;

  constructor(claudeService?: ClaudeService, settingsService?: SettingsService) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    this.claudeUserDir = path.join(homeDir, '.claude');
    this.pluginsDir = path.join(this.claudeUserDir, 'plugins');
    this.marketplacesFile = path.join(this.pluginsDir, 'known_marketplaces.json');
    this.installedPluginsFile = path.join(this.pluginsDir, 'installed_plugins.json');
    this.claudeService = claudeService || null;
    this.settingsService = settingsService || null;

    console.log('[PluginsService] Initialized with paths:', {
      claudeUserDir: this.claudeUserDir,
      pluginsDir: this.pluginsDir,
      marketplacesFile: this.marketplacesFile,
      installedPluginsFile: this.installedPluginsFile,
      hasCLIDelegation: !!this.claudeService,
      hasSettingsService: !!this.settingsService,
    });
  }

  /**
   * Get all configured marketplaces
   */
  async getMarketplaces(): Promise<Marketplace[]> {
    console.log('[PluginsService] getMarketplaces - reading from:', this.marketplacesFile);
    try {
      const content = await fs.readFile(this.marketplacesFile, 'utf-8');
      const data = JSON.parse(content);
      console.log(
        '[PluginsService] getMarketplaces - file content:',
        JSON.stringify(data, null, 2)
      );
      const marketplaces: Marketplace[] = [];

      // CLI writes flat format: { "name": { source: {...}, installLocation: "...", lastUpdated: "..." } }
      // No "marketplaces" wrapper
      const marketplacesData = data;

      console.log('[PluginsService] Found', Object.keys(marketplacesData).length, 'marketplaces');

      for (const [name, marketplaceEntry] of Object.entries(marketplacesData)) {
        // CLI format: { source: { source: "github", repo: "owner/repo" }, installLocation: "...", lastUpdated: "..." }
        if (typeof marketplaceEntry !== 'object' || !marketplaceEntry || !('source' in marketplaceEntry)) {
          console.warn('[PluginsService] Skipping marketplace with invalid format:', name, marketplaceEntry);
          continue;
        }

        const entry = marketplaceEntry as { source: { source: string; repo?: string; url?: string }; installLocation: string; lastUpdated: string };

        // Convert CLI's source object to a URL string for our internal use
        let source: string;
        if (entry.source.source === 'github' && entry.source.repo) {
          source = `https://github.com/${entry.source.repo}`;
        } else if (entry.source.url) {
          source = entry.source.url;
        } else {
          console.warn('[PluginsService] Skipping marketplace with unknown source type:', name, entry.source);
          continue;
        }

        console.log('[PluginsService] Processing marketplace:', { name, source });

        try {
          const manifest = await this.fetchMarketplaceManifest(source);

          if (!manifest) {
            console.warn('[PluginsService] No manifest found for marketplace:', name);
            marketplaces.push({
              name,
              source,
              pluginCount: 0,
              addedAt: entry.lastUpdated || new Date().toISOString(),
              available: false,
              error: 'Marketplace manifest not found',
            });
            continue;
          }

          const marketplace: Marketplace = {
            name,
            source,
            pluginCount: manifest.plugins?.length || 0,
            addedAt: entry.lastUpdated || new Date().toISOString(),
            available: true,
          };
          if (manifest.owner) marketplace.owner = manifest.owner;
          if (manifest.description) marketplace.description = manifest.description;
          if (manifest.version) marketplace.version = manifest.version;
          marketplaces.push(marketplace);
          console.log('[PluginsService] Successfully loaded marketplace:', name, 'with', marketplace.pluginCount, 'plugins');
        } catch (error) {
          console.error('[PluginsService] Failed to load marketplace:', name, error);
          marketplaces.push({
            name,
            source,
            pluginCount: 0,
            addedAt: entry.lastUpdated || new Date().toISOString(),
            available: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return marketplaces;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('[PluginsService] No marketplaces file found, returning empty array');
        return [];
      }
      console.error('[PluginsService] Error reading marketplaces file:', error);
      throw error;
    }
  }

  /**
   * Add a new marketplace
   * The marketplace name is determined by the "name" field in .claude-plugin/marketplace.json
   * Delegates to Claude CLI which handles marketplace registration
   */
  async addMarketplace(
    source: string
  ): Promise<{ success: boolean; marketplaceName?: string; error?: string }> {
    console.log('[PluginsService] Adding marketplace from source:', source);

    if (!this.claudeService) {
      return {
        success: false,
        error: 'Claude service not initialized',
      };
    }

    try {
      // Validate marketplace by fetching manifest first
      console.log('[PluginsService] Fetching marketplace manifest to validate and get name...');
      const manifest = await this.fetchMarketplaceManifest(source);

      if (!manifest) {
        const errorMsg = `Cannot find marketplace manifest at ${source}. ` +
          `Please ensure the URL points to a valid marketplace with a .claude-plugin/marketplace.json file. ` +
          `For GitHub repos, use: https://github.com/owner/repo`;
        console.error('[PluginsService]', errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }

      if (!manifest.name) {
        const errorMsg = `Marketplace manifest at ${source} is missing the required "name" field.`;
        console.error('[PluginsService]', errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }

      const marketplaceName = manifest.name;
      console.log('[PluginsService] Marketplace name from manifest:', marketplaceName);
      console.log('[PluginsService] Delegating to Claude CLI...');

      // Delegate to CLI which handles the marketplace registration
      const result = await this.claudeService.addPluginMarketplace(source);

      if (result.success) {
        console.log('[PluginsService] Marketplace added successfully via CLI:', marketplaceName);
        return { success: true, marketplaceName };
      } else {
        console.error('[PluginsService] CLI failed to add marketplace:', result.error);
        return {
          success: false,
          error: result.error || 'Failed to add marketplace via CLI',
        };
      }
    } catch (error) {
      console.error('[PluginsService] Failed to add marketplace:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add marketplace',
      };
    }
  }

  /**
   * Remove a marketplace
   * Delegates to Claude CLI which handles marketplace removal
   */
  async removeMarketplace(name: string): Promise<{ success: boolean; error?: string }> {
    console.log('[PluginsService] Removing marketplace:', name);

    if (!this.claudeService) {
      return {
        success: false,
        error: 'Claude service not initialized',
      };
    }

    try {
      // Delegate to CLI
      const result = await this.claudeService.removePluginMarketplace(name);

      if (result.success) {
        console.log('[PluginsService] Marketplace removed successfully via CLI');
        return { success: true };
      } else {
        console.error('[PluginsService] CLI failed to remove marketplace:', result.error);
        return {
          success: false,
          error: result.error || 'Failed to remove marketplace via CLI',
        };
      }
    } catch (error) {
      console.error('[PluginsService] Failed to remove marketplace:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove marketplace',
      };
    }
  }

  /**
   * Get all plugins from all marketplaces
   */
  async getAvailablePlugins(): Promise<MarketplacePlugin[]> {
    const marketplaces = await this.getMarketplaces();
    const installedPlugins = await this.getInstalledPlugins();
    const installedMap = new Map(installedPlugins.map(p => [p.id, p]));

    const allPlugins: MarketplacePlugin[] = [];

    for (const marketplace of marketplaces) {
      if (!marketplace.available) continue;

      try {
        const manifest = await this.fetchMarketplaceManifest(marketplace.source);
        if (!manifest?.plugins) continue;

        for (const plugin of manifest.plugins) {
          const pluginId = `${plugin.name}@${marketplace.name}`;
          const installed = installedMap.get(pluginId);

          // Normalize source to string
          let sourceUrl: string;
          if (typeof plugin.source === 'string') {
            sourceUrl = plugin.source;
          } else if (typeof plugin.source === 'object' && plugin.source !== null) {
            // Handle object format from manifest: { source: "github", repo: "owner/repo" }
            const sourceObj = plugin.source as { source?: string; repo?: string; url?: string };
            if (sourceObj.source === 'github' && sourceObj.repo) {
              sourceUrl = `https://github.com/${sourceObj.repo}`;
            } else if (sourceObj.url) {
              sourceUrl = sourceObj.url;
            } else {
              console.warn('[PluginsService] Unknown source format for plugin:', plugin.name, plugin.source);
              continue; // Skip this plugin
            }
          } else {
            console.warn('[PluginsService] Invalid source for plugin:', plugin.name, plugin.source);
            continue; // Skip this plugin
          }

          const marketplacePlugin: MarketplacePlugin = {
            ...plugin,
            source: sourceUrl, // Use normalized string source
            marketplace: marketplace.name,
            installed: !!installed,
          };
          if (installed?.version) {
            marketplacePlugin.installedVersion = installed.version;
          }
          if (installed && plugin.version && plugin.version !== installed.version) {
            marketplacePlugin.updateAvailable = true;
          }
          allPlugins.push(marketplacePlugin);
        }
      } catch (error) {
        console.error(`Failed to fetch plugins from ${marketplace.name}:`, error);
      }
    }

    return allPlugins;
  }

  /**
   * Get all installed plugins
   */
  async getInstalledPlugins(): Promise<InstalledPlugin[]> {
    console.log('[PluginsService] getInstalledPlugins - reading from:', this.installedPluginsFile);
    try {
      const content = await fs.readFile(this.installedPluginsFile, 'utf-8');
      const data = JSON.parse(content);
      console.log(
        '[PluginsService] getInstalledPlugins - file content:',
        JSON.stringify(data, null, 2)
      );
      const plugins: InstalledPlugin[] = [];

      // Read enabled state from settings
      let enabledPlugins: Record<string, boolean> = {};
      if (this.settingsService) {
        try {
          const settings = await this.settingsService.readSettings('user');
          enabledPlugins = settings.content?.enabledPlugins || {};
          console.log('[PluginsService] Loaded enabled plugins from settings:', enabledPlugins);
        } catch (error) {
          console.warn('[PluginsService] Failed to read enabled plugins from settings:', error);
        }
      }

      // CLI format: plugins are arrays of installations (can have multiple scopes)
      for (const [id, pluginInstalls] of Object.entries(data.plugins || {})) {
        // pluginInstalls is an array of plugin installations
        if (!Array.isArray(pluginInstalls)) {
          console.warn('[PluginsService] Plugin data is not an array:', id, pluginInstalls);
          continue;
        }

        // Process each installation (usually just one, but can be multiple with different scopes)
        for (const plugin of pluginInstalls) {
          const installPath = plugin.installPath || plugin.path;

          if (!installPath) {
            console.warn('[PluginsService] Plugin missing installPath:', id, plugin);
            continue;
          }

          console.log('[PluginsService] Processing installed plugin:', { id, installPath, scope: plugin.scope });

          try {
            // Read plugin.json
            const metadata = await this.readPluginMetadata(installPath);

            // Count components
            const componentCounts = await this.countPluginComponents(installPath);

            // Extract marketplace name from ID (format: "pluginName@marketplace")
            const marketplace: string = id.includes('@') ? id.split('@')[1] || 'unknown' : 'unknown';

            // Check enabled state from settings (defaults to true if not found)
            const isEnabled = enabledPlugins[id] !== undefined ? enabledPlugins[id] : true;

            plugins.push({
              ...metadata,
              id,
              marketplace,
              installPath,
              enabled: isEnabled,
              installedAt: plugin.installedAt || new Date().toISOString(),
              componentCounts,
            });
            console.log('[PluginsService] Successfully loaded installed plugin:', id);
          } catch (error) {
            console.error(`[PluginsService] Failed to read plugin ${id}:`, error);
          }
        }
      }

      return plugins;
    } catch (error) {
      console.error('[PluginsService] getInstalledPlugins error:', error);
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Install a plugin from marketplace
   * Delegates to Claude CLI
   */
  async installPlugin(pluginName: string, marketplaceName: string): Promise<PluginInstallResult> {
    console.log('[PluginsService] Installing plugin:', { pluginName, marketplaceName });

    if (!this.claudeService) {
      return {
        success: false,
        error: 'Claude service not initialized',
      };
    }

    try {
      // Validate marketplace exists
      const marketplaces = await this.getMarketplaces();
      const marketplace = marketplaces.find(m => m.name === marketplaceName);
      if (!marketplace) {
        return { success: false, error: 'Marketplace not found' };
      }

      console.log('[PluginsService] Delegating to Claude CLI...');
      const result = await this.claudeService.installPlugin(pluginName, marketplaceName);

      if (result.success) {
        console.log('[PluginsService] Plugin installed successfully via CLI');
        return { success: true };
      } else {
        console.error('[PluginsService] CLI failed to install plugin:', result.error);
        return {
          success: false,
          error: result.error || 'Failed to install plugin via CLI',
        };
      }
    } catch (error) {
      console.error('[PluginsService] Installation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Installation failed',
      };
    }
  }

  /**
   * Uninstall a plugin
   * Delegates to Claude CLI
   */
  async uninstallPlugin(pluginId: string): Promise<{ success: boolean; error?: string }> {
    console.log('[PluginsService] Uninstalling plugin:', pluginId);

    if (!this.claudeService) {
      return {
        success: false,
        error: 'Claude service not initialized',
      };
    }

    try {
      const plugins = await this.getInstalledPlugins();
      const plugin = plugins.find(p => p.id === pluginId);
      if (!plugin) {
        return { success: false, error: 'Plugin not found' };
      }

      // Extract plugin name and marketplace from ID (format: pluginName@marketplaceName)
      const [pluginName, marketplaceName] = pluginId.split('@');
      if (!pluginName || !marketplaceName) {
        return { success: false, error: 'Invalid plugin ID format' };
      }

      console.log('[PluginsService] Delegating to Claude CLI...');
      const result = await this.claudeService.uninstallPlugin(pluginName, marketplaceName);

      if (result.success) {
        console.log('[PluginsService] Plugin uninstalled successfully via CLI');
        return { success: true };
      } else {
        console.error('[PluginsService] CLI failed to uninstall plugin:', result.error);
        return {
          success: false,
          error: result.error || 'Failed to uninstall plugin via CLI',
        };
      }
    } catch (error) {
      console.error('[PluginsService] Uninstallation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Uninstallation failed',
      };
    }
  }

  /**
   * Enable/disable a plugin
   * Delegates to Claude CLI
   */
  async togglePlugin(
    pluginId: string,
    enabled: boolean
  ): Promise<{ success: boolean; error?: string }> {
    console.log('[PluginsService] Toggling plugin:', { pluginId, enabled });

    if (!this.claudeService) {
      return {
        success: false,
        error: 'Claude service not initialized',
      };
    }

    try {
      // Extract plugin name and marketplace from ID (format: pluginName@marketplaceName)
      const [pluginName, marketplaceName] = pluginId.split('@');
      if (!pluginName || !marketplaceName) {
        return { success: false, error: 'Invalid plugin ID format' };
      }

      console.log('[PluginsService] Delegating to Claude CLI...');
      const result = enabled
        ? await this.claudeService.enablePlugin(pluginName, marketplaceName)
        : await this.claudeService.disablePlugin(pluginName, marketplaceName);

      if (result.success) {
        console.log(`[PluginsService] Plugin ${enabled ? 'enabled' : 'disabled'} successfully via CLI`);
        return { success: true };
      } else {
        console.error('[PluginsService] CLI failed to toggle plugin:', result.error);
        return {
          success: false,
          error: result.error || `Failed to ${enabled ? 'enable' : 'disable'} plugin via CLI`,
        };
      }
    } catch (error) {
      console.error('[PluginsService] Toggle failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle plugin',
      };
    }
  }

  /**
   * Fetch GitHub repository information
   */
  async getGitHubRepoInfo(repoUrl: string): Promise<GitHubRepoInfo | null> {
    try {
      const match = repoUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
      if (!match) return null;

      const owner = match[1];
      const repo = match[2];
      if (!owner || !repo) return null;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

      const response = await fetch(apiUrl, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Claude-Owl',
        },
      });

      if (!response.ok) return null;

      const data = (await response.json()) as any;

      const info: GitHubRepoInfo = {
        owner,
        repo,
        stars: data.stargazers_count || 0,
        forks: data.forks_count || 0,
        openIssues: data.open_issues_count || 0,
        lastUpdate: data.updated_at,
        defaultBranch: data.default_branch,
        topics: data.topics || [],
        hasReadme: true,
        url: data.html_url,
      };
      if (data.description) info.description = data.description;
      if (data.language) info.language = data.language;
      if (data.license?.spdx_id) info.license = data.license.spdx_id;
      if (data.network_count !== undefined) info.contributors = data.network_count;
      return info;
    } catch (error) {
      console.error('Failed to fetch GitHub repo info:', error);
      return null;
    }
  }

  /**
   * Calculate plugin health score
   */
  async calculateHealthScore(
    plugin: MarketplacePlugin | InstalledPlugin
  ): Promise<PluginHealthScore> {
    const factors = {
      recentlyUpdated: false,
      hasDocumentation: !!plugin.description && plugin.description.length > 20,
      hasTests: false,
      activelyMaintained: true,
      hasLicense: !!plugin.license,
      wellDescribed: !!plugin.description && plugin.description.length > 50,
    };

    // Check if recently updated (if we have GitHub info)
    if (plugin.repository) {
      const githubInfo = await this.getGitHubRepoInfo(plugin.repository);
      if (githubInfo) {
        const lastUpdate = new Date(githubInfo.lastUpdate);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        factors.recentlyUpdated = lastUpdate > sixMonthsAgo;
        factors.activelyMaintained = lastUpdate > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      }
    }

    const score = Object.values(factors).filter(Boolean).length * (100 / 6);

    const recommendations: string[] = [];
    if (!factors.recentlyUpdated) recommendations.push('Not updated in the last 6 months');
    if (!factors.hasDocumentation) recommendations.push('Missing detailed documentation');
    if (!factors.hasLicense) recommendations.push('No license specified');

    return { score: Math.round(score), factors, recommendations };
  }

  /**
   * Private helper methods
   */

  private async fetchMarketplaceManifest(source: string): Promise<MarketplaceManifest | null> {
    try {
      // Handle GitHub URLs
      if (source.includes('github.com')) {
        const match = source.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
        if (match) {
          const [, owner, repo] = match;
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/.claude-plugin/marketplace.json`;
          const response = await fetch(rawUrl);
          if (response.ok) {
            return (await response.json()) as MarketplaceManifest;
          }
          // Try master branch
          const masterUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/.claude-plugin/marketplace.json`;
          const masterResponse = await fetch(masterUrl);
          if (masterResponse.ok) {
            return (await masterResponse.json()) as MarketplaceManifest;
          }
        }
      }

      // Handle HTTP URLs
      if (source.startsWith('http://') || source.startsWith('https://')) {
        const response = await fetch(source);
        if (response.ok) {
          return (await response.json()) as MarketplaceManifest;
        }
      }

      // Handle local paths
      const localPath = source.startsWith('~')
        ? source.replace('~', process.env.HOME || '')
        : source;
      const manifestPath = localPath.endsWith('.json')
        ? localPath
        : path.join(localPath, '.claude-plugin', 'marketplace.json');
      const content = await fs.readFile(manifestPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to fetch marketplace manifest:', error);
      return null;
    }
  }

  private async readPluginMetadata(pluginPath: string): Promise<PluginMetadata> {
    const manifestPath = path.join(pluginPath, '.claude-plugin', 'plugin.json');
    const content = await fs.readFile(manifestPath, 'utf-8');
    return JSON.parse(content);
  }

  private async countPluginComponents(pluginPath: string): Promise<{
    commands: number;
    agents: number;
    skills: number;
    hooks: number;
    mcpServers: number;
  }> {
    const counts = {
      commands: 0,
      agents: 0,
      skills: 0,
      hooks: 0,
      mcpServers: 0,
    };

    try {
      const commandsDir = path.join(pluginPath, 'commands');
      const commandFiles = await fs.readdir(commandsDir);
      counts.commands = commandFiles.filter(f => f.endsWith('.md')).length;
    } catch {
      // Commands directory doesn't exist, keep default count of 0
    }

    try {
      const agentsDir = path.join(pluginPath, 'agents');
      const agentFiles = await fs.readdir(agentsDir);
      counts.agents = agentFiles.filter(f => f.endsWith('.md')).length;
    } catch {
      // Agents directory doesn't exist, keep default count of 0
    }

    try {
      const skillsDir = path.join(pluginPath, 'skills');
      const skillDirs = await fs.readdir(skillsDir, { withFileTypes: true });
      counts.skills = skillDirs.filter(d => d.isDirectory()).length;
    } catch {
      // Skills directory doesn't exist, keep default count of 0
    }

    try {
      const hooksPath = path.join(pluginPath, 'hooks', 'hooks.json');
      const hooksContent = await fs.readFile(hooksPath, 'utf-8');
      const hooks = JSON.parse(hooksContent);
      counts.hooks = Object.keys(hooks).length;
    } catch {
      // Hooks file doesn't exist, keep default count of 0
    }

    try {
      const mcpPath = path.join(pluginPath, '.mcp.json');
      const mcpContent = await fs.readFile(mcpPath, 'utf-8');
      const mcp = JSON.parse(mcpContent);
      counts.mcpServers = Object.keys(mcp.mcpServers || {}).length;
    } catch {
      // MCP config file doesn't exist, keep default count of 0
    }

    return counts;
  }
}
