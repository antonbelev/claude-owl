import { useState, useEffect, useCallback } from 'react';
import type {
  UsageReport,
  CheckCCUsageInstalledResponse,
  GetCCUsageVersionResponse,
  GetUsageReportResponse,
} from '@/shared/types';

export interface UsageState {
  installed: boolean;
  version: string | null;
  report: UsageReport | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing ccusage data
 * Checks if ccusage is installed and provides usage report data
 */
export function useUsage() {
  const [state, setState] = useState<UsageState>({
    installed: false,
    version: null,
    report: null,
    loading: true,
    error: null,
  });

  /**
   * Check if ccusage is installed
   */
  const checkInstallation = useCallback(async () => {
    console.log('[useUsage] checkInstallation called');
    if (!window.electronAPI) {
      console.error('[useUsage] electronAPI not available');
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Not running in Electron',
      }));
      return false;
    }

    try {
      console.log('[useUsage] Calling window.electronAPI.checkCCUsageInstalled()');
      const response = (await window.electronAPI.checkCCUsageInstalled()) as CheckCCUsageInstalledResponse;
      console.log('[useUsage] Response:', response);

      if (response.success) {
        setState(prev => ({
          ...prev,
          installed: response.installed ?? false,
        }));
        return response.installed ?? false;
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error ?? 'Failed to check ccusage installation',
        }));
        return false;
      }
    } catch (error) {
      console.error('[useUsage] Error checking installation:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to check ccusage installation',
      }));
      return false;
    }
  }, []);

  /**
   * Get ccusage version
   */
  const getVersion = useCallback(async () => {
    if (!window.electronAPI) {
      return null;
    }

    try {
      const response = (await window.electronAPI.getCCUsageVersion()) as GetCCUsageVersionResponse;

      if (response.success) {
        setState(prev => ({
          ...prev,
          version: response.version ?? null,
        }));
        return response.version ?? null;
      }

      return null;
    } catch (error) {
      console.error('Failed to get ccusage version:', error);
      return null;
    }
  }, []);

  /**
   * Load usage report
   */
  const loadReport = useCallback(async () => {
    console.log('[useUsage] loadReport called');
    setState(prev => ({ ...prev, loading: true, error: null }));

    if (!window.electronAPI) {
      console.error('[useUsage] electronAPI not available for loadReport');
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Not running in Electron',
      }));
      return;
    }

    try {
      console.log('[useUsage] Calling window.electronAPI.getUsageReport()');
      const response = (await window.electronAPI.getUsageReport()) as GetUsageReportResponse;
      console.log('[useUsage] getUsageReport response:', response);

      if (response.success && response.data) {
        console.log('[useUsage] Usage report data:', response.data);
        setState(prev => ({
          ...prev,
          report: response.data || null,
          loading: false,
          error: null,
        }));
      } else {
        console.error('[useUsage] Failed to load report:', response.error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error ?? 'Failed to load usage report',
        }));
      }
    } catch (error) {
      console.error('[useUsage] Error loading report:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load usage report',
      }));
    }
  }, []);

  /**
   * Initialize: check installation and load data if available
   */
  const initialize = useCallback(async () => {
    const isInstalled = await checkInstallation();

    if (isInstalled) {
      await getVersion();
      await loadReport();
    } else {
      setState(prev => ({
        ...prev,
        loading: false,
      }));
    }
  }, [checkInstallation, getVersion, loadReport]);

  // Load on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    ...state,
    refresh: loadReport,
    checkInstallation,
  };
}
