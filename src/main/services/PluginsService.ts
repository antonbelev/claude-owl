/**
 * Service for managing Claude Code plugins and marketplaces
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
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

export class PluginsService {
  private claudeUserDir: string;
  private pluginsDir: string;
  private marketplacesFile: string;
  private installedPluginsFile: string;
  private claudeService: ClaudeService | null = null;

  constructor(claudeService?: ClaudeService) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    this.claudeUserDir = path.join(homeDir, '.claude');
    this.pluginsDir = path.join(this.claudeUserDir, 'plugins');
    this.marketplacesFile = path.join(this.pluginsDir, 'known_marketplaces.json');
    this.installedPluginsFile = path.join(this.pluginsDir, 'installed_plugins.json');
    this.claudeService = claudeService || null;

    console.log('[PluginsService] Initialized with paths:', {
      claudeUserDir: this.claudeUserDir,
      pluginsDir: this.pluginsDir,
      marketplacesFile: this.marketplacesFile,
      installedPluginsFile: this.installedPluginsFile,
      hasCLIDelegation: !!this.claudeService,
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

      // The file format we write is: { "marketplaces": { "name": "url" } }
      const marketplacesData = data.marketplaces || {};

      console.log('[PluginsService] Found', Object.keys(marketplacesData).length, 'marketplaces');

      for (const [name, source] of Object.entries(marketplacesData)) {
        // Source is directly a string (URL)
        if (typeof source !== 'string') {
          console.warn('[PluginsService] Skipping marketplace with invalid source:', name, source);
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
              addedAt: new Date().toISOString(),
              available: false,
              error: 'Marketplace manifest not found',
            });
            continue;
          }

          const marketplace: Marketplace = {
            name,
            source,
            pluginCount: manifest.plugins?.length || 0,
            addedAt: new Date().toISOString(),
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
            addedAt: new Date().toISOString(),
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
   */
  async addMarketplace(
    name: string,
    source: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log('[PluginsService] Adding marketplace:', { name, source });

    // TODO: CLI delegation disabled - the `claude /plugin marketplace add` command
    // doesn't exist in the current Claude CLI (causes crash at cli.js:1087)
    // Re-enable when the CLI supports this command
    // if (this.claudeService) {
    //   console.log('[PluginsService] Delegating to Claude CLI...');
    //   const result = await this.claudeService.addPluginMarketplace(source);
    //   if (result.success) return { success: true };
    //   // Fall through to legacy mode on failure
    // }

    // Use direct file manipulation
    console.log('[PluginsService] Using direct file manipulation mode');
    try {
      // Validate marketplace by fetching manifest
      console.log('[PluginsService] Validating marketplace manifest...');
      const manifest = await this.fetchMarketplaceManifest(source);

      if (!manifest) {
        const errorMsg = `Cannot find marketplace manifest at ${source}. ` +
          `Please ensure the URL points to a valid marketplace with a .claude-plugin/marketplace.json file. ` +
          `For GitHub repos, use: github:owner/repo or https://github.com/owner/repo`;
        console.error('[PluginsService]', errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }

      console.log('[PluginsService] Marketplace manifest validated successfully');

      // Read current marketplaces
      let marketplaces: Record<string, string> = {};
      try {
        const content = await fs.readFile(this.marketplacesFile, 'utf-8');
        const data = JSON.parse(content);
        marketplaces = data.marketplaces || {};
      } catch (error) {
        console.log('[PluginsService] No existing marketplaces file, will create new one');
        // File doesn't exist, will create new one
      }

      // Add new marketplace
      marketplaces[name] = source;

      // Save updated marketplaces
      await fs.mkdir(this.claudeUserDir, { recursive: true });
      await fs.writeFile(this.marketplacesFile, JSON.stringify({ marketplaces }, null, 2), 'utf-8');

      console.log('[PluginsService] Marketplace added successfully:', name);
      return { success: true };
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
   */
  async removeMarketplace(name: string): Promise<{ success: boolean; error?: string }> {
    try {
      const content = await fs.readFile(this.marketplacesFile, 'utf-8');
      const data = JSON.parse(content);
      const marketplaces = data.marketplaces || {};

      if (!marketplaces[name]) {
        return { success: false, error: 'Marketplace not found' };
      }

      delete marketplaces[name];

      await fs.writeFile(this.marketplacesFile, JSON.stringify({ marketplaces }, null, 2), 'utf-8');

      return { success: true };
    } catch (error) {
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

          const marketplacePlugin: MarketplacePlugin = {
            ...plugin,
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

      for (const [id, pluginData] of Object.entries(data.plugins || {})) {
        const plugin = pluginData as any;
        // The actual file has installPath field
        const installPath = plugin.installPath || plugin.path;

        if (!installPath) {
          console.warn('[PluginsService] Plugin missing installPath:', id);
          continue;
        }

        console.log('[PluginsService] Processing installed plugin:', { id, installPath });

        try {
          // Read plugin.json
          const metadata = await this.readPluginMetadata(installPath);

          // Count components
          const componentCounts = await this.countPluginComponents(installPath);

          // Extract marketplace name from ID (format: "pluginName@marketplace")
          const marketplace: string = id.includes('@') ? id.split('@')[1] || 'unknown' : 'unknown';

          plugins.push({
            ...metadata,
            id,
            marketplace,
            installPath,
            enabled: !plugin.isLocal, // isLocal plugins are always enabled
            installedAt: plugin.installedAt || new Date().toISOString(),
            componentCounts,
          });
          console.log('[PluginsService] Successfully loaded installed plugin:', id);
        } catch (error) {
          console.error(`[PluginsService] Failed to read plugin ${id}:`, error);
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
   */
  async installPlugin(pluginName: string, marketplaceName: string): Promise<PluginInstallResult> {
    try {
      // Get marketplace source
      const marketplaces = await this.getMarketplaces();
      const marketplace = marketplaces.find(m => m.name === marketplaceName);
      if (!marketplace) {
        return { success: false, error: 'Marketplace not found' };
      }

      // Get plugin from marketplace
      const manifest = await this.fetchMarketplaceManifest(marketplace.source);
      const pluginEntry = manifest?.plugins?.find(p => p.name === pluginName);
      if (!pluginEntry) {
        return { success: false, error: 'Plugin not found in marketplace' };
      }

      // Determine install path
      const installPath = path.join(this.pluginsDir, pluginName);

      // Clone/copy plugin
      await this.fetchPluginSource(pluginEntry.source, installPath, marketplace.source);

      // Read plugin metadata
      const metadata = await this.readPluginMetadata(installPath);

      // Count components
      const componentCounts = await this.countPluginComponents(installPath);

      // Register plugin
      const plugin: InstalledPlugin = {
        ...metadata,
        id: `${pluginName}@${marketplaceName}`,
        marketplace: marketplaceName,
        installPath,
        enabled: true,
        installedAt: new Date().toISOString(),
        componentCounts,
      };

      await this.registerInstalledPlugin(plugin);

      return { success: true, plugin };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Installation failed',
      };
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const plugins = await this.getInstalledPlugins();
      const plugin = plugins.find(p => p.id === pluginId);
      if (!plugin) {
        return { success: false, error: 'Plugin not found' };
      }

      // Remove plugin files
      await fs.rm(plugin.installPath, { recursive: true, force: true });

      // Unregister plugin
      await this.unregisterInstalledPlugin(pluginId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Uninstallation failed',
      };
    }
  }

  /**
   * Enable/disable a plugin
   */
  async togglePlugin(
    pluginId: string,
    enabled: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const content = await fs.readFile(this.installedPluginsFile, 'utf-8');
      const data = JSON.parse(content);

      if (!data.plugins[pluginId]) {
        return { success: false, error: 'Plugin not found' };
      }

      data.plugins[pluginId].enabled = enabled;

      await fs.writeFile(this.installedPluginsFile, JSON.stringify(data, null, 2), 'utf-8');

      return { success: true };
    } catch (error) {
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

  private async fetchPluginSource(
    source: string,
    installPath: string,
    marketplaceSource: string
  ): Promise<void> {
    await fs.mkdir(installPath, { recursive: true });

    // Handle relative paths (relative to marketplace)
    if (!source.startsWith('http') && !source.startsWith('git@') && !path.isAbsolute(source)) {
      // Resolve relative to marketplace location
      const marketplaceDir = path.dirname(marketplaceSource);
      source = path.join(marketplaceDir, source);
    }

    // Handle GitHub URLs or git URLs
    if (source.includes('github.com') || source.startsWith('git@') || source.endsWith('.git')) {
      execSync(`git clone ${source} ${installPath}`, { stdio: 'inherit' });
      return;
    }

    // Handle HTTP URLs (download and extract)
    if (source.startsWith('http://') || source.startsWith('https://')) {
      // For now, treat as git URL
      execSync(`git clone ${source} ${installPath}`, { stdio: 'inherit' });
      return;
    }

    // Handle local paths (copy)
    const sourcePath = source.startsWith('~')
      ? source.replace('~', process.env.HOME || '')
      : source;
    await this.copyDirectory(sourcePath, installPath);
  }

  private async copyDirectory(source: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
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

  private async registerInstalledPlugin(plugin: InstalledPlugin): Promise<void> {
    let data: any = { plugins: {} };
    try {
      const content = await fs.readFile(this.installedPluginsFile, 'utf-8');
      data = JSON.parse(content);
    } catch {
      // File doesn't exist yet, use empty template
    }

    data.plugins[plugin.id] = {
      name: plugin.name,
      marketplace: plugin.marketplace,
      path: plugin.installPath,
      enabled: plugin.enabled,
      installedAt: plugin.installedAt,
      version: plugin.version,
    };

    await fs.mkdir(this.claudeUserDir, { recursive: true });
    await fs.writeFile(this.installedPluginsFile, JSON.stringify(data, null, 2), 'utf-8');
  }

  private async unregisterInstalledPlugin(pluginId: string): Promise<void> {
    const content = await fs.readFile(this.installedPluginsFile, 'utf-8');
    const data = JSON.parse(content);
    delete data.plugins[pluginId];
    await fs.writeFile(this.installedPluginsFile, JSON.stringify(data, null, 2), 'utf-8');
  }
}
