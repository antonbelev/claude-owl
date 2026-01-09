import { useState, useEffect } from 'react';
import type { CheckVersionResponse, VersionInfo } from '@/shared/types';

export interface VersionCheckStatus {
  loading: boolean;
  versionInfo: VersionInfo | null;
  error: string | null;
}

export function useVersionCheck() {
  const [status, setStatus] = useState<VersionCheckStatus>({
    loading: true,
    versionInfo: null,
    error: null,
  });

  const checkVersion = async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }));

    // Check if running in Electron
    if (!window.electronAPI) {
      setStatus({
        loading: false,
        versionInfo: null,
        error: 'Not running in Electron. Use npm run dev:electron to run the app.',
      });
      return;
    }

    try {
      const response = (await window.electronAPI.checkVersion()) as CheckVersionResponse;

      if (response.success && response.data) {
        setStatus({
          loading: false,
          versionInfo: response.data,
          error: null,
        });
      } else {
        setStatus({
          loading: false,
          versionInfo: null,
          error: response.error ?? 'Failed to check version',
        });
      }
    } catch (error) {
      setStatus({
        loading: false,
        versionInfo: null,
        error: error instanceof Error ? error.message : 'Failed to check version',
      });
    }
  };

  useEffect(() => {
    checkVersion();
  }, []);

  return {
    ...status,
    refetch: checkVersion,
  };
}
