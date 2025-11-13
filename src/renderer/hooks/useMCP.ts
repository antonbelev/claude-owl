import { useState, useCallback, useEffect } from 'react';
import type {
  MCPServer,
  MCPConnectionTestResult,
  AddMCPServerRequest,
  RemoveMCPServerRequest,
  ListMCPServersResponse,
  AddMCPServerResponse,
  RemoveMCPServerResponse,
  TestMCPServerResponse,
  GetMCPPlatformHintsResponse,
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
  const [platformHints, setPlatformHints] = useState<any>(null);

  /**
   * Load all MCP servers
   */
  const listServers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[useMCP] Loading MCP servers');

      const response: ListMCPServersResponse = await window.electronAPI.listMCPServers();

      if (!response.success) {
        throw new Error(response.error || 'Failed to load servers');
      }

      setServers(response.data || []);
      console.log('[useMCP] Loaded servers:', response.data);
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
   */
  const loadPlatformHints = useCallback(async () => {
    try {
      console.log('[useMCP] Loading platform hints');
      const response: GetMCPPlatformHintsResponse = await window.electronAPI.getMCPPlatformHints();

      if (response.success) {
        setPlatformHints(response.data);
      }
    } catch (err) {
      console.warn('[useMCP] Failed to load platform hints:', err);
    }
  }, []);

  /**
   * Add a new MCP server
   */
  const addServer = useCallback(async (config: AddMCPServerRequest) => {
    try {
      setError(null);
      console.log('[useMCP] Adding server:', config.name);

      const response: AddMCPServerResponse = await window.electronAPI.addMCPServer(config);

      if (!response.success) {
        throw new Error(response.error || 'Failed to add server');
      }

      // Refresh servers list
      await listServers();
      console.log('[useMCP] Server added:', config.name);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useMCP] Failed to add server:', message);
      setError(message);
      throw err;
    }
  }, [listServers]);

  /**
   * Remove an MCP server
   */
  const removeServer = useCallback(async (request: RemoveMCPServerRequest) => {
    try {
      setError(null);
      console.log('[useMCP] Removing server:', request.name);

      const response: RemoveMCPServerResponse = await window.electronAPI.removeMCPServer(request);

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
  }, [listServers]);

  /**
   * Test MCP server connection
   */
  const testConnection = useCallback(async (name: string, timeout?: number) => {
    try {
      setError(null);
      console.log('[useMCP] Testing connection for:', name);

      const response: TestMCPServerResponse = await window.electronAPI.testMCPServer({ name, timeout: timeout ?? 10000 });

      if (!response.success) {
        throw new Error(response.error || 'Failed to test connection');
      }

      console.log('[useMCP] Test result:', response.data);
      return response.data as MCPConnectionTestResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useMCP] Connection test failed:', message);
      setError(message);
      throw err;
    }
  }, []);

  /**
   * Test all MCP server connections
   */
  const testAllConnections = useCallback(async (timeout?: number) => {
    try {
      setError(null);
      console.log('[useMCP] Testing all connections');

      const response = (await window.electronAPI.testAllMCPServers({ timeout })) as any;

      if (!response.success) {
        throw new Error(response.error || 'Failed to test connections');
      }

      console.log('[useMCP] All tests completed:', response.data);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useMCP] Failed to test connections:', message);
      setError(message);
      throw err;
    }
  }, []);

  /**
   * Validate MCP config
   */
  const validateConfig = useCallback(async (name: string, config: any) => {
    try {
      console.log('[useMCP] Validating config:', name);

      const response = (await window.electronAPI.validateMCPConfig({ name, config })) as any;

      if (!response.success) {
        throw new Error(response.error || 'Failed to validate config');
      }

      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useMCP] Validation failed:', message);
      throw err;
    }
  }, []);

  /**
   * Get server tools
   */
  const getServerTools = useCallback(async (name: string) => {
    try {
      console.log('[useMCP] Getting tools for:', name);

      const response = (await window.electronAPI.getMCPServerTools({ name })) as any;

      if (!response.success) {
        throw new Error(response.error || 'Failed to get tools');
      }

      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useMCP] Failed to get tools:', message);
      throw err;
    }
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
    platformHints,

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
