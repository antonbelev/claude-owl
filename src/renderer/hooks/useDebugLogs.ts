import { useState, useEffect, useCallback } from 'react';
import type {
  DebugLog,
  ListDebugLogsResponse,
  GetDebugLogResponse,
  DeleteDebugLogResponse,
  SearchDebugLogsResponse,
} from '@/shared/types';

export interface UseDebugLogsResult {
  logs: DebugLog[];
  loading: boolean;
  error: string | null;
  selectedLog: DebugLog | null;
  searchQuery: string;
  refetch: () => Promise<void>;
  getLog: (filename: string) => Promise<DebugLog | null>;
  deleteLog: (filename: string) => Promise<boolean>;
  search: (query: string) => Promise<void>;
  clearSearch: () => Promise<void>;
  setSelectedLog: (log: DebugLog | null) => void;
}

/**
 * React hook for managing Claude debug logs
 */
export function useDebugLogs(): UseDebugLogsResult {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<DebugLog | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!window.electronAPI) {
      setError('Not running in Electron. Use npm run dev:electron to run the app.');
      setLoading(false);
      return;
    }

    try {
      const response = (await window.electronAPI.listDebugLogs()) as ListDebugLogsResponse;

      if (response.success) {
        setLogs(response.data ?? []);
        console.log('[useDebugLogs] Fetched', response.data?.length ?? 0, 'debug logs');
      } else {
        setError(response.error ?? 'Failed to fetch debug logs');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch debug logs';
      setError(errorMessage);
      console.error('[useDebugLogs] Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getLog = useCallback(async (filename: string): Promise<DebugLog | null> => {
    if (!window.electronAPI) {
      setError('Not running in Electron');
      return null;
    }

    try {
      const response = (await window.electronAPI.getDebugLog({
        filename,
      })) as GetDebugLogResponse;

      if (response.success && response.data) {
        console.log('[useDebugLogs] Successfully loaded log:', filename);
        return response.data;
      } else {
        setError(response.error ?? 'Failed to load debug log');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load debug log';
      setError(errorMessage);
      console.error('[useDebugLogs] Error loading log:', err);
      return null;
    }
  }, []);

  const deleteLog = useCallback(
    async (filename: string): Promise<boolean> => {
      if (!window.electronAPI) {
        setError('Not running in Electron');
        return false;
      }

      try {
        const response = (await window.electronAPI.deleteDebugLog({
          filename,
        })) as DeleteDebugLogResponse;

        if (response.success) {
          console.log('[useDebugLogs] Successfully deleted log:', filename);
          // Refresh the list after deletion
          await fetchLogs();
          if (selectedLog?.filename === filename) {
            setSelectedLog(null);
          }
          return true;
        } else {
          setError(response.error ?? 'Failed to delete debug log');
          return false;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete debug log';
        setError(errorMessage);
        console.error('[useDebugLogs] Error deleting log:', err);
        return false;
      }
    },
    [fetchLogs, selectedLog]
  );

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchQuery('');
        await fetchLogs();
        return;
      }

      if (!window.electronAPI) {
        setError('Not running in Electron');
        return;
      }

      setLoading(true);
      setError(null);
      setSearchQuery(query);

      try {
        const response = (await window.electronAPI.searchDebugLogs({
          query,
        })) as SearchDebugLogsResponse;

        if (response.success) {
          setLogs(response.data ?? []);
          console.log('[useDebugLogs] Search returned', response.data?.length ?? 0, 'results');
        } else {
          setError(response.error ?? 'Failed to search debug logs');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to search debug logs';
        setError(errorMessage);
        console.error('[useDebugLogs] Error searching logs:', err);
      } finally {
        setLoading(false);
      }
    },
    [fetchLogs]
  );

  const clearSearch = useCallback(async () => {
    setSearchQuery('');
    await fetchLogs();
  }, [fetchLogs]);

  // Load logs on mount
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    selectedLog,
    searchQuery,
    refetch: fetchLogs,
    getLog,
    deleteLog,
    search,
    clearSearch,
    setSelectedLog,
  };
}
