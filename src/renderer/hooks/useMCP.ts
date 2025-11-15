import { useState, useCallback, useEffect } from 'react';
import type {
  MCPServer,
  MCPConnectionTestResult,
  AddMCPServerRequest,
  RemoveMCPServerRequest,
  ListMCPServersResponse,
  AddMCPServerResponse,
  RemoveMCPServerResponse,
} from '@/shared/types';

interface UseMCPOptions {
  autoLoad?: boolean;
}

/**
 * Hook for managing MCP servers
 */
export function useMCP(options: UseMCPOptions = {}) {
  const { autoLoad = true } = options;

  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_platformHints, _setPlatformHints] = useState<any>(null);

  /**
   * Load all MCP servers
   */
  const listServers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[useMCP] Loading MCP servers');

      const response = (await window.electronAPI.listMCPServers()) as ListMCPServersResponse;

      if (!response.success) {
        throw new Error(response.error || 'Failed to load servers');
      }

      setServers(response.servers || []);
      console.log('[useMCP] Loaded servers:', response.servers);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useMCP] Failed to load servers:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load platform hints
   * @deprecated Not implemented yet
   */
  const loadPlatformHints = useCallback(async () => {
    // TODO: Implement when getMCPPlatformHints is available
    console.log('[useMCP] Platform hints not implemented yet');
  }, []);

  /**
   * Add a new MCP server
   */
  const addServer = useCallback(
    async (config: AddMCPServerRequest) => {
      try {
        setError(null);
        console.log('[useMCP] Adding server:', config.name);

        const response = (await window.electronAPI.addMCPServer(config)) as AddMCPServerResponse;

        if (!response.success) {
          throw new Error(response.error || 'Failed to add server');
        }

        // Refresh servers list
        await listServers();
        console.log('[useMCP] Server added:', config.name);
        return undefined;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useMCP] Failed to add server:', message);
        setError(message);
        throw err;
      }
    },
    [listServers]
  );

  /**
   * Remove an MCP server
   */
  const removeServer = useCallback(
    async (request: RemoveMCPServerRequest) => {
      try {
        setError(null);
        console.log('[useMCP] Removing server:', request.name);

        const response = (await window.electronAPI.removeMCPServer(
          request
        )) as RemoveMCPServerResponse;

        if (!response.success) {
          throw new Error(response.error || 'Failed to remove server');
        }

        // Refresh servers list
        await listServers();
        console.log('[useMCP] Server removed:', request.name);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useMCP] Failed to remove server:', message);
        setError(message);
        throw err;
      }
    },
    [listServers]
  );

  /**
   * Test MCP server connection
   * @deprecated Not implemented yet
   */
  const testConnection = useCallback(
    async (name: string, _timeout?: number): Promise<MCPConnectionTestResult> => {
      // TODO: Implement when testMCPServer API is available
      console.log('[useMCP] Connection test not implemented yet for:', name);
      return {
        success: false,
        steps: [],
        error: 'Not implemented',
      };
    },
    []
  );

  /**
   * Test all MCP server connections
   * @deprecated Not implemented yet
   */
  const testAllConnections = useCallback(async (_timeout?: number) => {
    // TODO: Implement when testAllMCPServers API is available
    console.log('[useMCP] Test all connections not implemented yet');
    return [];
  }, []);

  /**
   * Validate MCP config
   * @deprecated Not implemented yet
   */
  const validateConfig = useCallback(async (name: string, _config: unknown) => {
    // TODO: Implement when validateMCPConfig API is available
    console.log('[useMCP] Validation not implemented yet for:', name);
    return { valid: false, errors: ['Not implemented'] };
  }, []);

  /**
   * Get server tools
   * @deprecated Not implemented yet
   */
  const getServerTools = useCallback(async (name: string) => {
    // TODO: Implement when getMCPServerTools API is available
    console.log('[useMCP] Get server tools not implemented yet for:', name);
    return [];
  }, []);

  /**
   * Auto-load on mount
   */
  useEffect(() => {
    if (autoLoad) {
      listServers();
      loadPlatformHints();
    }
  }, [autoLoad, listServers, loadPlatformHints]);

  return {
    // State
    servers,
    loading,
    error,
    platformHints: _platformHints,

    // Methods
    listServers,
    addServer,
    removeServer,
    testConnection,
    testAllConnections,
    validateConfig,
    getServerTools,
  };
}
