import { useState, useEffect } from 'react';
import type { CheckClaudeInstalledResponse } from '@/shared/types';

export interface ClaudeInstallationStatus {
  loading: boolean;
  installed: boolean;
  version: string | null;
  path: string | null;
  error: string | null;
}

export function useClaudeInstallation() {
  const [status, setStatus] = useState<ClaudeInstallationStatus>({
    loading: true,
    installed: false,
    version: null,
    path: null,
    error: null,
  });

  const checkInstallation = async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }));

    // Check if running in Electron
    if (!window.electronAPI) {
      setStatus({
        loading: false,
        installed: false,
        version: null,
        path: null,
        error: 'Not running in Electron. Use npm run dev:electron to run the app.',
      });
      return;
    }

    try {
      const response =
        (await window.electronAPI.checkClaudeInstalled()) as CheckClaudeInstalledResponse;

      if (response.success) {
        setStatus({
          loading: false,
          installed: response.installed ?? false,
          version: response.version ?? null,
          path: response.path ?? null,
          error: null,
        });
      } else {
        setStatus({
          loading: false,
          installed: false,
          version: null,
          path: null,
          error: response.error ?? 'Unknown error occurred',
        });
      }
    } catch (error) {
      setStatus({
        loading: false,
        installed: false,
        version: null,
        path: null,
        error: error instanceof Error ? error.message : 'Failed to check installation',
      });
    }
  };

  useEffect(() => {
    checkInstallation();
  }, []);

  return {
    ...status,
    refetch: checkInstallation,
  };
}
