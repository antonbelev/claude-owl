import { useState, useEffect, useCallback } from 'react';
import type {
  GetActiveStatusLineResponse,
  ListTemplatesResponse,
  SetTemplateResponse,
  SetCustomScriptResponse,
  PreviewStatusLineResponse,
  DisableStatusLineResponse,
  ScanScriptResponse,
  ExportScriptResponse,
} from '@/shared/types';
import type {
  StatusLineConfig,
  StatusLineTemplate,
  StatusLinePreviewResult,
  SecurityScanResult,
} from '@/shared/types/statusline.types';

export interface UseStatusLineResult {
  /** Active status line configuration */
  activeConfig: StatusLineConfig | null;

  /** Available templates */
  templates: StatusLineTemplate[];

  /** Loading state */
  loading: boolean;

  /** Error message */
  error: string | null;

  /** Refetch active config and templates */
  refetch: () => Promise<void>;

  /** Set status line from a template */
  setTemplate: (templateId: string) => Promise<boolean>;

  /** Set custom status line script */
  setCustomScript: (
    scriptContent: string,
    language?: 'bash' | 'python' | 'node'
  ) => Promise<boolean>;

  /** Preview a status line */
  preview: (templateId?: string, scriptContent?: string) => Promise<StatusLinePreviewResult | null>;

  /** Disable status line */
  disable: () => Promise<boolean>;

  /** Scan script for security issues */
  scanScript: (scriptContent: string) => Promise<SecurityScanResult | null>;

  /** Export template to standalone script */
  exportScript: (templateId: string, targetPath?: string) => Promise<string | null>;
}

/**
 * React hook for managing Claude Code status lines
 */
export function useStatusLine(): UseStatusLineResult {
  const [activeConfig, setActiveConfig] = useState<StatusLineConfig | null>(null);
  const [templates, setTemplates] = useState<StatusLineTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveConfig = useCallback(async () => {
    if (!window.electronAPI) {
      return;
    }

    try {
      const response =
        (await window.electronAPI.getActiveStatusLine()) as GetActiveStatusLineResponse;

      if (response.success) {
        setActiveConfig(response.data ?? null);
      } else {
        console.error('Failed to fetch active status line:', response.error);
      }
    } catch (err) {
      console.error('Failed to fetch active status line:', err);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    if (!window.electronAPI) {
      return;
    }

    try {
      const response =
        (await window.electronAPI.listStatusLineTemplates()) as ListTemplatesResponse;

      if (response.success) {
        setTemplates(response.data ?? []);
      } else {
        console.error('Failed to fetch templates:', response.error);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!window.electronAPI) {
      setError('Not running in Electron. Use npm run dev:electron to run the app.');
      setLoading(false);
      return;
    }

    try {
      await Promise.all([fetchActiveConfig(), fetchTemplates()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status line data');
    } finally {
      setLoading(false);
    }
  }, [fetchActiveConfig, fetchTemplates]);

  const setTemplate = useCallback(
    async (templateId: string): Promise<boolean> => {
      if (!window.electronAPI) {
        setError('Not running in Electron');
        return false;
      }

      console.log('[useStatusLine] Setting template:', templateId);

      try {
        const response = (await window.electronAPI.setStatusLineTemplate({
          templateId,
        })) as SetTemplateResponse;

        if (response.success) {
          console.log('[useStatusLine] Template set successfully');
          // Refresh active config
          await fetchActiveConfig();
          return true;
        } else {
          const errorMsg = response.error ?? 'Failed to set template';
          console.error('[useStatusLine] Failed to set template:', errorMsg);
          setError(errorMsg);
          return false;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to set template';
        console.error('[useStatusLine] Error setting template:', errorMsg);
        setError(errorMsg);
        return false;
      }
    },
    [fetchActiveConfig]
  );

  const setCustomScript = useCallback(
    async (scriptContent: string, language?: 'bash' | 'python' | 'node'): Promise<boolean> => {
      if (!window.electronAPI) {
        setError('Not running in Electron');
        return false;
      }

      console.log('[useStatusLine] Setting custom script:', { language });

      try {
        const response = (await window.electronAPI.setCustomStatusLine({
          scriptContent,
          language,
        })) as SetCustomScriptResponse;

        if (response.success) {
          console.log('[useStatusLine] Custom script set successfully');
          // Refresh active config
          await fetchActiveConfig();
          return true;
        } else {
          const errorMsg = response.error ?? 'Failed to set custom script';
          console.error('[useStatusLine] Failed to set custom script:', errorMsg);
          setError(errorMsg);
          return false;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to set custom script';
        console.error('[useStatusLine] Error setting custom script:', errorMsg);
        setError(errorMsg);
        return false;
      }
    },
    [fetchActiveConfig]
  );

  const preview = useCallback(
    async (
      templateId?: string,
      scriptContent?: string
    ): Promise<StatusLinePreviewResult | null> => {
      if (!window.electronAPI) {
        setError('Not running in Electron');
        return null;
      }

      console.log('[useStatusLine] Previewing status line:', {
        templateId,
        hasScript: !!scriptContent,
      });

      try {
        const response = (await window.electronAPI.previewStatusLine({
          templateId,
          scriptContent,
        })) as PreviewStatusLineResponse;

        if (response.success && response.data) {
          return response.data;
        } else {
          const errorMsg = response.error ?? 'Failed to preview status line';
          console.error('[useStatusLine] Failed to preview:', errorMsg);
          setError(errorMsg);
          return null;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to preview status line';
        console.error('[useStatusLine] Error previewing:', errorMsg);
        setError(errorMsg);
        return null;
      }
    },
    []
  );

  const disable = useCallback(async (): Promise<boolean> => {
    if (!window.electronAPI) {
      setError('Not running in Electron');
      return false;
    }

    console.log('[useStatusLine] Disabling status line');

    try {
      const response = (await window.electronAPI.disableStatusLine()) as DisableStatusLineResponse;

      if (response.success) {
        console.log('[useStatusLine] Status line disabled successfully');
        // Refresh active config
        await fetchActiveConfig();
        return true;
      } else {
        const errorMsg = response.error ?? 'Failed to disable status line';
        console.error('[useStatusLine] Failed to disable:', errorMsg);
        setError(errorMsg);
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to disable status line';
      console.error('[useStatusLine] Error disabling:', errorMsg);
      setError(errorMsg);
      return false;
    }
  }, [fetchActiveConfig]);

  const scanScript = useCallback(
    async (scriptContent: string): Promise<SecurityScanResult | null> => {
      if (!window.electronAPI) {
        setError('Not running in Electron');
        return null;
      }

      console.log('[useStatusLine] Scanning script for security issues');

      try {
        const response = (await window.electronAPI.scanStatusLineScript({
          scriptContent,
        })) as ScanScriptResponse;

        if (response.success && response.data) {
          return response.data;
        } else {
          const errorMsg = response.error ?? 'Failed to scan script';
          console.error('[useStatusLine] Failed to scan:', errorMsg);
          setError(errorMsg);
          return null;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to scan script';
        console.error('[useStatusLine] Error scanning:', errorMsg);
        setError(errorMsg);
        return null;
      }
    },
    []
  );

  const exportScript = useCallback(
    async (templateId: string, targetPath?: string): Promise<string | null> => {
      if (!window.electronAPI) {
        setError('Not running in Electron');
        return null;
      }

      console.log('[useStatusLine] Exporting script:', { templateId, targetPath });

      try {
        const response = (await window.electronAPI.exportStatusLineScript({
          templateId,
          targetPath,
        })) as ExportScriptResponse;

        if (response.success && response.exportPath) {
          console.log('[useStatusLine] Script exported to:', response.exportPath);
          return response.exportPath;
        } else {
          const errorMsg = response.error ?? 'Failed to export script';
          console.error('[useStatusLine] Failed to export:', errorMsg);
          setError(errorMsg);
          return null;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to export script';
        console.error('[useStatusLine] Error exporting:', errorMsg);
        setError(errorMsg);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    activeConfig,
    templates,
    loading,
    error,
    refetch,
    setTemplate,
    setCustomScript,
    preview,
    disable,
    scanScript,
    exportScript,
  };
}
