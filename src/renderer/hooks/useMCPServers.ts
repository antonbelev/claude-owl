/**
 * React hook for managing MCP servers
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  MCPServer,
  MCPScope,
  AddMCPServerRequest,
  AddMCPServerResponse,
  RemoveMCPServerRequest,
  RemoveMCPServerResponse,
  ListMCPServersResponse,
} from '@/shared/types/ipc.types';

export interface UseMCPServersResult {
  servers: MCPServer[];
  loading: boolean;
  error: string | null;
  addServer: (request: AddMCPServerRequest) => Promise<AddMCPServerResponse>;
  removeServer: (request: RemoveMCPServerRequest) => Promise<RemoveMCPServerResponse>;
  refresh: () => Promise<void>;
}

/**
 * Hook to manage MCP servers
 * @param scope Optional scope filter (user, project, local)
 */
export function useMCPServers(scope?: MCPScope): UseMCPServersResult {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    console.log('[useMCPServers] Refreshing server list, scope:', scope || 'all');
    setLoading(true);
    setError(null);

    try {
      const response = (await window.electronAPI.listMCPServers(
        scope ? { scope } : undefined
      )) as ListMCPServersResponse;

      if (response.success) {
        setServers(response.servers || []);
        console.log('[useMCPServers] Loaded servers:', response.servers?.length || 0);
      } else {
        const errorMsg = response.error || 'Failed to load MCP servers';
        setError(errorMsg);
        console.error('[useMCPServers] Error loading servers:', errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error loading MCP servers';
      setError(errorMsg);
      console.error('[useMCPServers] Exception loading servers:', err);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  // Load servers on mount and when scope changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  const addServer = useCallback(
    async (request: AddMCPServerRequest): Promise<AddMCPServerResponse> => {
      console.log('[useMCPServers] Adding server:', request.name);
      setLoading(true);
      setError(null);

      try {
        const response = (await window.electronAPI.addMCPServer(request)) as AddMCPServerResponse;

        if (response.success) {
          console.log('[useMCPServers] Server added successfully');
          // Refresh the server list
          await refresh();
        } else {
          const errorMsg = response.error || 'Failed to add MCP server';
          setError(errorMsg);
          console.error('[useMCPServers] Error adding server:', errorMsg);
        }

        return response;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error adding MCP server';
        setError(errorMsg);
        console.error('[useMCPServers] Exception adding server:', err);
        return {
          success: false,
          error: errorMsg,
        };
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  const removeServer = useCallback(
    async (request: RemoveMCPServerRequest): Promise<RemoveMCPServerResponse> => {
      console.log('[useMCPServers] Removing server:', request.name);
      setLoading(true);
      setError(null);

      try {
        const response = (await window.electronAPI.removeMCPServer(
          request
        )) as RemoveMCPServerResponse;

        if (response.success) {
          console.log('[useMCPServers] Server removed successfully');
          // Refresh the server list
          await refresh();
        } else {
          const errorMsg = response.error || 'Failed to remove MCP server';
          setError(errorMsg);
          console.error('[useMCPServers] Error removing server:', errorMsg);
        }

        return response;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error removing MCP server';
        setError(errorMsg);
        console.error('[useMCPServers] Exception removing server:', err);
        return {
          success: false,
          error: errorMsg,
        };
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  return {
    servers,
    loading,
    error,
    addServer,
    removeServer,
    refresh,
  };
}
