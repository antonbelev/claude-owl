import { useState, useEffect, useCallback } from 'react';
import type { GetServiceStatusResponse, ServiceStatus } from '@/shared/types';

export interface ServiceStatusHookResult {
  loading: boolean;
  status: ServiceStatus | null;
  error: string | null;
  refetch: () => Promise<void>;
}

const DEFAULT_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useServiceStatus(options?: { refreshInterval?: number }): ServiceStatusHookResult {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    console.log('[useServiceStatus] Fetching service status');
    setLoading(true);
    setError(null);

    // Check if running in Electron
    if (!window.electronAPI) {
      console.warn('[useServiceStatus] Not running in Electron environment');
      setLoading(false);
      setError('Not running in Electron. Use npm run dev:electron to run the app.');
      return;
    }

    try {
      const response = (await window.electronAPI.getServiceStatus()) as GetServiceStatusResponse;

      console.log('[useServiceStatus] Response received:', {
        success: response.success,
        level: response.data?.level,
      });

      if (response.success && response.data) {
        setStatus(response.data);
        setError(null);
      } else {
        setError(response.error ?? 'Failed to fetch service status');
        setStatus(null);
      }
    } catch (err) {
      console.error('[useServiceStatus] Error fetching status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch service status');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('[useServiceStatus] Initial fetch on mount');
    fetchStatus();

    // Set up automatic refresh interval
    const refreshInterval = options?.refreshInterval ?? DEFAULT_REFRESH_INTERVAL;
    console.log('[useServiceStatus] Setting up refresh interval:', refreshInterval, 'ms');

    const intervalId = setInterval(() => {
      console.log('[useServiceStatus] Auto-refresh triggered');
      fetchStatus();
    }, refreshInterval);

    return () => {
      console.log('[useServiceStatus] Cleaning up refresh interval');
      clearInterval(intervalId);
    };
  }, [fetchStatus, options?.refreshInterval]);

  return {
    loading,
    status,
    error,
    refetch: fetchStatus,
  };
}
