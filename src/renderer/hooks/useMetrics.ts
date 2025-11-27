import { useState, useEffect, useCallback } from 'react';
import type {
  MetricsData,
  MetricsFilter,
  ComputeMetricsResponse,
} from '@/shared/types';

export interface MetricsState {
  data: MetricsData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing metrics data
 * Computes and provides usage metrics from Claude Code JSONL files
 */
export function useMetrics(filter?: MetricsFilter) {
  const [state, setState] = useState<MetricsState>({
    data: null,
    loading: true,
    error: null,
  });

  /**
   * Load metrics data
   */
  const loadMetrics = useCallback(async (currentFilter?: MetricsFilter) => {
    console.log('[useMetrics] Loading metrics with filter:', currentFilter);
    setState(prev => ({ ...prev, loading: true, error: null }));

    if (!window.electronAPI) {
      console.error('[useMetrics] electronAPI not available');
      setState({
        data: null,
        loading: false,
        error: 'Not running in Electron',
      });
      return;
    }

    try {
      const response = (await window.electronAPI.computeMetrics(
        currentFilter ? { filter: currentFilter } : undefined
      )) as ComputeMetricsResponse;

      console.log('[useMetrics] Response received:', {
        success: response.success,
        sessionCount: response.data?.sessions.length,
        error: response.error,
      });

      if (response.success && response.data) {
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error ?? 'Failed to compute metrics',
        });
      }
    } catch (error) {
      console.error('[useMetrics] Error computing metrics:', error);
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to compute metrics',
      });
    }
  }, []);

  // Load metrics on mount and when filter changes
  useEffect(() => {
    loadMetrics(filter);
  }, [filter, loadMetrics]);

  return {
    ...state,
    refresh: () => loadMetrics(filter),
  };
}
