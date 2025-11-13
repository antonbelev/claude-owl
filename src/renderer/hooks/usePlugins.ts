import { useState, useEffect, useCallback } from 'react';
import type {
  Marketplace,
  MarketplacePlugin,
  InstalledPlugin,
  GetMarketplacesResponse,
  GetAvailablePluginsResponse,
  GetInstalledPluginsResponse,
  AddMarketplaceRequest,
  AddMarketplaceResponse,
  RemoveMarketplaceRequest,
  RemoveMarketplaceResponse,
  InstallPluginRequest,
  InstallPluginResponse,
  UninstallPluginRequest,
  UninstallPluginResponse,
  TogglePluginRequest,
  TogglePluginResponse,
  GetGitHubRepoInfoRequest,
  GetGitHubRepoInfoResponse,
  GetPluginHealthRequest,
  GetPluginHealthResponse,
  GitHubRepoInfo,
  PluginHealthScore,
} from '@/shared/types';

export interface PluginsState {
  marketplaces: Marketplace[];
  availablePlugins: MarketplacePlugin[];
  installedPlugins: InstalledPlugin[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing Claude Code plugins and marketplaces
 * Provides methods for browsing, installing, and managing plugins
 */
export function usePlugins() {
  const [state, setState] = useState<PluginsState>({
    marketplaces: [],
    availablePlugins: [],
    installedPlugins: [],
    loading: true,
    error: null,
  });

  /**
   * Load all plugin data (marketplaces, available plugins, installed plugins)
   */
  const loadPluginData = useCallback(async () => {
    console.log('[usePlugins] Loading plugin data...');
    setState(prev => ({ ...prev, loading: true, error: null }));

    if (!window.electronAPI) {
      console.error('[usePlugins] window.electronAPI not available');
      setState({
        marketplaces: [],
        availablePlugins: [],
        installedPlugins: [],
        loading: false,
        error: 'Not running in Electron',
      });
      return;
    }

    try {
      console.log('[usePlugins] Calling IPC methods in parallel...');
      // Load all data in parallel
      const [marketplacesRes, availableRes, installedRes] = await Promise.all([
        window.electronAPI.getMarketplaces() as Promise<GetMarketplacesResponse>,
        window.electronAPI.getAvailablePlugins() as Promise<GetAvailablePluginsResponse>,
        window.electronAPI.getInstalledPlugins() as Promise<GetInstalledPluginsResponse>,
      ]);

      console.log('[usePlugins] IPC responses received:', {
        marketplaces: marketplacesRes,
        available: availableRes,
        installed: installedRes,
      });

      const marketplaces =
        marketplacesRes.success && marketplacesRes.data ? marketplacesRes.data : [];
      const availablePlugins = availableRes.success && availableRes.data ? availableRes.data : [];
      const installedPlugins = installedRes.success && installedRes.data ? installedRes.data : [];

      // Mark installed plugins in available list
      const installedPluginIds = new Set(installedPlugins.map(p => p.id));
      const enrichedAvailablePlugins = availablePlugins.map(plugin => {
        const installedPlugin = installedPlugins.find(
          p => p.id === `${plugin.name}@${plugin.marketplace}`
        );
        return {
          ...plugin,
          installed: installedPluginIds.has(`${plugin.name}@${plugin.marketplace}`),
          installedVersion: installedPlugin?.version,
        } as MarketplacePlugin;
      });

      console.log('[usePlugins] Plugin data processed successfully:', {
        marketplaces: marketplaces.length,
        availablePlugins: enrichedAvailablePlugins.length,
        installedPlugins: installedPlugins.length,
      });

      setState({
        marketplaces,
        availablePlugins: enrichedAvailablePlugins,
        installedPlugins,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('[usePlugins] Failed to load plugin data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load plugin data',
      }));
    }
  }, []);

  /**
   * Add a new marketplace
   */
  const addMarketplace = useCallback(
    async (name: string, source: string): Promise<boolean> => {
      if (!window.electronAPI) {
        return false;
      }

      try {
        const request: AddMarketplaceRequest = { name, source };
        const response = (await window.electronAPI.addMarketplace(
          request
        )) as AddMarketplaceResponse;

        if (response.success) {
          await loadPluginData();
          return true;
        } else {
          console.error('Failed to add marketplace:', response.error);
          return false;
        }
      } catch (error) {
        console.error('Failed to add marketplace:', error);
        return false;
      }
    },
    [loadPluginData]
  );

  /**
   * Remove a marketplace
   */
  const removeMarketplace = useCallback(
    async (name: string): Promise<boolean> => {
      if (!window.electronAPI) {
        return false;
      }

      try {
        const request: RemoveMarketplaceRequest = { name };
        const response = (await window.electronAPI.removeMarketplace(
          request
        )) as RemoveMarketplaceResponse;

        if (response.success) {
          await loadPluginData();
          return true;
        } else {
          console.error('Failed to remove marketplace:', response.error);
          return false;
        }
      } catch (error) {
        console.error('Failed to remove marketplace:', error);
        return false;
      }
    },
    [loadPluginData]
  );

  /**
   * Install a plugin from a marketplace
   */
  const installPlugin = useCallback(
    async (pluginName: string, marketplaceName: string): Promise<boolean> => {
      if (!window.electronAPI) {
        return false;
      }

      try {
        const request: InstallPluginRequest = { pluginName, marketplaceName };
        const response = (await window.electronAPI.installPlugin(request)) as InstallPluginResponse;

        if (response.success) {
          await loadPluginData();
          return true;
        } else {
          console.error('Failed to install plugin:', response.error);
          return false;
        }
      } catch (error) {
        console.error('Failed to install plugin:', error);
        return false;
      }
    },
    [loadPluginData]
  );

  /**
   * Uninstall a plugin
   */
  const uninstallPlugin = useCallback(
    async (pluginId: string): Promise<boolean> => {
      if (!window.electronAPI) {
        return false;
      }

      try {
        const request: UninstallPluginRequest = { pluginId };
        const response = (await window.electronAPI.uninstallPlugin(
          request
        )) as UninstallPluginResponse;

        if (response.success) {
          await loadPluginData();
          return true;
        } else {
          console.error('Failed to uninstall plugin:', response.error);
          return false;
        }
      } catch (error) {
        console.error('Failed to uninstall plugin:', error);
        return false;
      }
    },
    [loadPluginData]
  );

  /**
   * Toggle plugin enabled state
   */
  const togglePlugin = useCallback(
    async (pluginId: string, enabled: boolean): Promise<boolean> => {
      if (!window.electronAPI) {
        return false;
      }

      try {
        const request: TogglePluginRequest = { pluginId, enabled };
        const response = (await window.electronAPI.togglePlugin(request)) as TogglePluginResponse;

        if (response.success) {
          await loadPluginData();
          return true;
        } else {
          console.error('Failed to toggle plugin:', response.error);
          return false;
        }
      } catch (error) {
        console.error('Failed to toggle plugin:', error);
        return false;
      }
    },
    [loadPluginData]
  );

  /**
   * Get GitHub repository information
   */
  const getGitHubRepoInfo = useCallback(async (repoUrl: string): Promise<GitHubRepoInfo | null> => {
    if (!window.electronAPI) {
      return null;
    }

    try {
      const request: GetGitHubRepoInfoRequest = { repoUrl };
      const response = (await window.electronAPI.getGitHubRepoInfo(
        request
      )) as GetGitHubRepoInfoResponse;

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to get GitHub repo info:', error);
      return null;
    }
  }, []);

  /**
   * Get plugin health score
   */
  const getPluginHealth = useCallback(
    async (plugin: MarketplacePlugin | InstalledPlugin): Promise<PluginHealthScore | null> => {
      if (!window.electronAPI) {
        return null;
      }

      try {
        const request: GetPluginHealthRequest = { plugin };
        const response = (await window.electronAPI.getPluginHealth(
          request
        )) as GetPluginHealthResponse;

        if (response.success && response.data) {
          return response.data;
        }

        return null;
      } catch (error) {
        console.error('Failed to get plugin health:', error);
        return null;
      }
    },
    []
  );

  // Load plugin data on mount
  useEffect(() => {
    loadPluginData();
  }, [loadPluginData]);

  return {
    ...state,
    loadPluginData,
    addMarketplace,
    removeMarketplace,
    installPlugin,
    uninstallPlugin,
    togglePlugin,
    getGitHubRepoInfo,
    getPluginHealth,
    refetch: loadPluginData,
  };
}
