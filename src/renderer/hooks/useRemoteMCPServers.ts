/**
 * React hook for Remote MCP Server Discovery
 *
 * @see ADR-010: Remote MCP Servers Discovery & Connection Verification
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  RemoteMCPServer,
  RemoteMCPCategory,
  ConnectionTestResult,
  SecurityContext,
  RemoteServerFilters,
  DirectoryCacheStatus,
  FetchDirectoryResponse,
  SearchServersResponse,
  GetServerDetailsResponse,
  TestConnectionResponse,
  TestAllConnectionsResponse,
  AddRemoteServerResponse,
  GetCacheStatusResponse,
} from '@/shared/types';

export interface UseRemoteMCPServersResult {
  /** List of remote servers */
  servers: RemoteMCPServer[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Data source (live or cache) */
  source: 'live' | 'cache';
  /** When data was last updated */
  lastUpdated: string | null;
  /** Cache status */
  cacheStatus: DirectoryCacheStatus | null;

  /** Active filters */
  filters: RemoteServerFilters;
  /** Update filters */
  setFilters: (filters: RemoteServerFilters) => void;

  /** Refresh the server list */
  refresh: (forceRefresh?: boolean) => Promise<void>;
  /** Search servers with query */
  search: (query: string) => Promise<RemoteMCPServer[]>;
  /** Get details for a specific server */
  getServerDetails: (
    serverId: string
  ) => Promise<{ server: RemoteMCPServer; securityContext: SecurityContext } | null>;
  /** Test connection to a server */
  testConnection: (
    url: string,
    transport: 'http' | 'sse',
    timeout?: number
  ) => Promise<ConnectionTestResult>;
  /** Test connections to multiple servers */
  testAllConnections: (
    serverIds: string[]
  ) => Promise<{ results: { serverId: string; result: ConnectionTestResult }[] }>;
  /** Add a remote server to Claude Code */
  addServer: (
    server: RemoteMCPServer,
    scope: 'user' | 'project',
    projectPath?: string,
    customName?: string
  ) => Promise<AddRemoteServerResponse>;

  /** Filtered servers by category */
  serversByCategory: Record<RemoteMCPCategory, RemoteMCPServer[]>;
  /** Available categories */
  categories: RemoteMCPCategory[];
}

/**
 * Hook to manage remote MCP server discovery and connection testing
 */
export function useRemoteMCPServers(initialFilters?: RemoteServerFilters): UseRemoteMCPServersResult {
  const [servers, setServers] = useState<RemoteMCPServer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'live' | 'cache'>('cache');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<DirectoryCacheStatus | null>(null);
  const [filters, setFilters] = useState<RemoteServerFilters>(initialFilters || {});

  // Refresh server list
  const refresh = useCallback(async (forceRefresh = false) => {
    console.log('[useRemoteMCPServers] Refreshing server list, forceRefresh:', forceRefresh);
    setLoading(true);
    setError(null);

    try {
      const response = (await window.electronAPI.fetchRemoteMCPDirectory({
        forceRefresh,
        filters,
      })) as FetchDirectoryResponse;

      if (response.success) {
        setServers(response.servers);
        setSource(response.source);
        setLastUpdated(response.lastUpdated);
        console.log('[useRemoteMCPServers] Loaded servers:', response.servers.length);
      } else {
        const errorMsg = response.error || 'Failed to load remote servers';
        setError(errorMsg);
        console.error('[useRemoteMCPServers] Error loading servers:', errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error loading remote servers';
      setError(errorMsg);
      console.error('[useRemoteMCPServers] Exception loading servers:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load servers on mount and when filters change
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Load cache status
  useEffect(() => {
    const loadCacheStatus = async () => {
      try {
        const response = (await window.electronAPI.getRemoteMCPCacheStatus()) as GetCacheStatusResponse;
        if (response.success) {
          setCacheStatus(response.cacheStatus);
        }
      } catch (err) {
        console.warn('[useRemoteMCPServers] Failed to load cache status:', err);
      }
    };
    loadCacheStatus();
  }, [lastUpdated]);

  // Search servers
  const search = useCallback(async (query: string): Promise<RemoteMCPServer[]> => {
    console.log('[useRemoteMCPServers] Searching servers:', query);

    try {
      const response = (await window.electronAPI.searchRemoteMCPServers({
        query,
        category: filters.category,
        authType: filters.authType,
      })) as SearchServersResponse;

      if (response.success) {
        return response.servers;
      } else {
        console.error('[useRemoteMCPServers] Search error:', response.error);
        return [];
      }
    } catch (err) {
      console.error('[useRemoteMCPServers] Search exception:', err);
      return [];
    }
  }, [filters.category, filters.authType]);

  // Get server details
  const getServerDetails = useCallback(
    async (
      serverId: string
    ): Promise<{ server: RemoteMCPServer; securityContext: SecurityContext } | null> => {
      console.log('[useRemoteMCPServers] Getting server details:', serverId);

      try {
        const response = (await window.electronAPI.getRemoteMCPServerDetails({
          serverId,
        })) as GetServerDetailsResponse;

        if (response.success && response.server && response.securityContext) {
          return {
            server: response.server,
            securityContext: response.securityContext,
          };
        } else {
          console.error('[useRemoteMCPServers] Get details error:', response.error);
          return null;
        }
      } catch (err) {
        console.error('[useRemoteMCPServers] Get details exception:', err);
        return null;
      }
    },
    []
  );

  // Test connection
  const testConnection = useCallback(
    async (
      url: string,
      transport: 'http' | 'sse',
      timeout?: number
    ): Promise<ConnectionTestResult> => {
      console.log('[useRemoteMCPServers] Testing connection:', { url, transport });

      try {
        const response = (await window.electronAPI.testRemoteMCPConnection({
          url,
          transport,
          timeout,
        })) as TestConnectionResponse;

        if (response.success) {
          return response.result;
        } else {
          return {
            success: false,
            error: response.error || 'Connection test failed',
            errorCode: 'NETWORK_ERROR',
          };
        }
      } catch (err) {
        console.error('[useRemoteMCPServers] Test connection exception:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Connection test failed',
          errorCode: 'NETWORK_ERROR',
        };
      }
    },
    []
  );

  // Test all connections
  const testAllConnections = useCallback(
    async (
      serverIds: string[]
    ): Promise<{ results: { serverId: string; result: ConnectionTestResult }[] }> => {
      console.log('[useRemoteMCPServers] Testing all connections:', serverIds.length);

      try {
        const response = (await window.electronAPI.testAllRemoteMCPConnections({
          serverIds,
        })) as TestAllConnectionsResponse;

        return { results: response.results };
      } catch (err) {
        console.error('[useRemoteMCPServers] Test all connections exception:', err);
        return { results: [] };
      }
    },
    []
  );

  // Add server
  const addServer = useCallback(
    async (
      server: RemoteMCPServer,
      scope: 'user' | 'project',
      projectPath?: string,
      customName?: string
    ): Promise<AddRemoteServerResponse> => {
      console.log('[useRemoteMCPServers] Adding server:', {
        serverId: server.id,
        scope,
        projectPath,
      });
      setLoading(true);
      setError(null);

      try {
        const response = (await window.electronAPI.addRemoteMCPServer({
          server,
          scope,
          projectPath,
          customName,
        })) as AddRemoteServerResponse;

        if (!response.success) {
          setError(response.error || 'Failed to add server');
        }

        return response;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to add server';
        setError(errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Group servers by category
  const serversByCategory = useMemo(() => {
    const grouped: Record<RemoteMCPCategory, RemoteMCPServer[]> = {
      'developer-tools': [],
      databases: [],
      productivity: [],
      payments: [],
      content: [],
      utilities: [],
      security: [],
      analytics: [],
    };

    servers.forEach(server => {
      if (grouped[server.category]) {
        grouped[server.category].push(server);
      }
    });

    return grouped;
  }, [servers]);

  // Get unique categories that have servers
  const categories = useMemo(() => {
    const uniqueCategories = new Set<RemoteMCPCategory>();
    servers.forEach(server => uniqueCategories.add(server.category));
    return Array.from(uniqueCategories).sort();
  }, [servers]);

  return {
    servers,
    loading,
    error,
    source,
    lastUpdated,
    cacheStatus,
    filters,
    setFilters,
    refresh,
    search,
    getServerDetails,
    testConnection,
    testAllConnections,
    addServer,
    serversByCategory,
    categories,
  };
}

/**
 * Hook for connection testing state management
 */
export function useConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionTestResult | null>(null);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    currentServer?: string;
  } | null>(null);

  const testSingle = useCallback(
    async (
      url: string,
      transport: 'http' | 'sse',
      timeout?: number
    ): Promise<ConnectionTestResult> => {
      setTesting(true);
      setResult(null);
      setProgress(null);

      try {
        const response = (await window.electronAPI.testRemoteMCPConnection({
          url,
          transport,
          timeout,
        })) as TestConnectionResponse;

        setResult(response.result);
        return response.result;
      } finally {
        setTesting(false);
      }
    },
    []
  );

  const testMultiple = useCallback(
    async (
      servers: Array<{ id: string; endpoint: string; transport: 'http' | 'sse' }>
    ): Promise<Map<string, ConnectionTestResult>> => {
      setTesting(true);
      setResult(null);
      setProgress({ current: 0, total: servers.length });

      const results = new Map<string, ConnectionTestResult>();

      try {
        for (let i = 0; i < servers.length; i++) {
          const server = servers[i];
          if (!server) continue;

          setProgress({
            current: i + 1,
            total: servers.length,
            currentServer: server.id,
          });

          const response = (await window.electronAPI.testRemoteMCPConnection({
            url: server.endpoint,
            transport: server.transport,
          })) as TestConnectionResponse;

          results.set(server.id, response.result);
        }

        return results;
      } finally {
        setTesting(false);
        setProgress(null);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setTesting(false);
    setResult(null);
    setProgress(null);
  }, []);

  return {
    testing,
    result,
    progress,
    testSingle,
    testMultiple,
    reset,
  };
}
