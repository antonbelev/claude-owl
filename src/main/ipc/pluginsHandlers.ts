/**
 * IPC handlers for plugin operations
 */

import { ipcMain } from 'electron';
import { PluginsService } from '../services/PluginsService';
import type {
  AddMarketplaceRequest,
  RemoveMarketplaceRequest,
  InstallPluginRequest,
  UninstallPluginRequest,
  TogglePluginRequest,
  GetGitHubRepoInfoRequest,
  GetPluginHealthRequest,
} from '../../shared/types/ipc.types';

// Define channels directly to prevent tree-shaking in build
// These MUST match the strings in IPC_CHANNELS (src/shared/types/ipc.types.ts)
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
} as const;

const pluginsService = new PluginsService();

export function registerPluginsHandlers(): void {
  console.log('[PluginsHandlers] Registering plugin IPC handlers');

  // Get all marketplaces
  ipcMain.handle(PLUGINS_CHANNELS.GET_MARKETPLACES, async () => {
    console.log('[PluginsHandlers] GET_MARKETPLACES request received');
    try {
      const marketplaces = await pluginsService.getMarketplaces();
      console.log('[PluginsHandlers] GET_MARKETPLACES success:', { count: marketplaces.length });
      return { success: true, data: marketplaces };
    } catch (error) {
      console.error('[PluginsHandlers] GET_MARKETPLACES failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get marketplaces',
      };
    }
  });

  // Add marketplace
  ipcMain.handle(PLUGINS_CHANNELS.ADD_MARKETPLACE, async (_, request: AddMarketplaceRequest) => {
    console.log('[PluginsHandlers] ADD_MARKETPLACE request:', request);
    try {
      const result = await pluginsService.addMarketplace(request.name, request.source);
      console.log('[PluginsHandlers] ADD_MARKETPLACE success:', { name: request.name });
      return result;
    } catch (error) {
      console.error('[PluginsHandlers] ADD_MARKETPLACE failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add marketplace',
      };
    }
  });

  // Remove marketplace
  ipcMain.handle(
    PLUGINS_CHANNELS.REMOVE_MARKETPLACE,
    async (_, request: RemoveMarketplaceRequest) => {
      console.log('[PluginsHandlers] REMOVE_MARKETPLACE request:', request);
      try {
        const result = await pluginsService.removeMarketplace(request.name);
        console.log('[PluginsHandlers] REMOVE_MARKETPLACE success:', { name: request.name });
        return result;
      } catch (error) {
        console.error('[PluginsHandlers] REMOVE_MARKETPLACE failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to remove marketplace',
        };
      }
    }
  );

  // Get available plugins from all marketplaces
  ipcMain.handle(PLUGINS_CHANNELS.GET_AVAILABLE_PLUGINS, async () => {
    console.log('[PluginsHandlers] GET_AVAILABLE_PLUGINS request received');
    try {
      const plugins = await pluginsService.getAvailablePlugins();
      console.log('[PluginsHandlers] GET_AVAILABLE_PLUGINS success:', { count: plugins.length });
      return { success: true, data: plugins };
    } catch (error) {
      console.error('[PluginsHandlers] GET_AVAILABLE_PLUGINS failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get available plugins',
      };
    }
  });

  // Get installed plugins
  ipcMain.handle(PLUGINS_CHANNELS.GET_INSTALLED_PLUGINS, async () => {
    console.log('[PluginsHandlers] GET_INSTALLED_PLUGINS request received');
    try {
      const plugins = await pluginsService.getInstalledPlugins();
      console.log('[PluginsHandlers] GET_INSTALLED_PLUGINS success:', { count: plugins.length });
      return { success: true, data: plugins };
    } catch (error) {
      console.error('[PluginsHandlers] GET_INSTALLED_PLUGINS failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get installed plugins',
      };
    }
  });

  // Install plugin
  ipcMain.handle(PLUGINS_CHANNELS.INSTALL_PLUGIN, async (_, request: InstallPluginRequest) => {
    console.log('[PluginsHandlers] INSTALL_PLUGIN request:', request);
    try {
      const result = await pluginsService.installPlugin(
        request.pluginName,
        request.marketplaceName
      );
      console.log('[PluginsHandlers] INSTALL_PLUGIN result:', {
        success: result.success,
        plugin: result.plugin?.id,
      });
      return { success: result.success, data: result, error: result.error };
    } catch (error) {
      console.error('[PluginsHandlers] INSTALL_PLUGIN failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to install plugin',
      };
    }
  });

  // Uninstall plugin
  ipcMain.handle(PLUGINS_CHANNELS.UNINSTALL_PLUGIN, async (_, request: UninstallPluginRequest) => {
    console.log('[PluginsHandlers] UNINSTALL_PLUGIN request:', request);
    try {
      const result = await pluginsService.uninstallPlugin(request.pluginId);
      console.log('[PluginsHandlers] UNINSTALL_PLUGIN success:', { pluginId: request.pluginId });
      return result;
    } catch (error) {
      console.error('[PluginsHandlers] UNINSTALL_PLUGIN failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to uninstall plugin',
      };
    }
  });

  // Toggle plugin enabled/disabled
  ipcMain.handle(PLUGINS_CHANNELS.TOGGLE_PLUGIN, async (_, request: TogglePluginRequest) => {
    console.log('[PluginsHandlers] TOGGLE_PLUGIN request:', request);
    try {
      const result = await pluginsService.togglePlugin(request.pluginId, request.enabled);
      console.log('[PluginsHandlers] TOGGLE_PLUGIN success:', {
        pluginId: request.pluginId,
        enabled: request.enabled,
      });
      return result;
    } catch (error) {
      console.error('[PluginsHandlers] TOGGLE_PLUGIN failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle plugin',
      };
    }
  });

  // Get GitHub repository information
  ipcMain.handle(
    PLUGINS_CHANNELS.GET_GITHUB_REPO_INFO,
    async (_, request: GetGitHubRepoInfoRequest) => {
      console.log('[PluginsHandlers] GET_GITHUB_REPO_INFO request:', request);
      try {
        const info = await pluginsService.getGitHubRepoInfo(request.repoUrl);
        console.log('[PluginsHandlers] GET_GITHUB_REPO_INFO success');
        return { success: true, data: info };
      } catch (error) {
        console.error('[PluginsHandlers] GET_GITHUB_REPO_INFO failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get GitHub repo info',
        };
      }
    }
  );

  // Get plugin health score
  ipcMain.handle(PLUGINS_CHANNELS.GET_PLUGIN_HEALTH, async (_, request: GetPluginHealthRequest) => {
    console.log('[PluginsHandlers] GET_PLUGIN_HEALTH request:', request);
    try {
      const health = await pluginsService.calculateHealthScore(request.plugin);
      console.log('[PluginsHandlers] GET_PLUGIN_HEALTH success:', { score: health.score });
      return { success: true, data: health };
    } catch (error) {
      console.error('[PluginsHandlers] GET_PLUGIN_HEALTH failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate plugin health',
      };
    }
  });

  console.log('[PluginsHandlers] All plugin IPC handlers registered successfully');
}
