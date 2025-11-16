import { useState, useEffect, useCallback } from 'react';
import type {
  ClaudeSettings,
  ConfigLevel,
  ConfigSource,
  EffectiveConfig,
  SettingsValidationResult,
  GetSettingsResponse,
  SaveSettingsResponse,
  ValidateSettingsResponse,
  GetEffectiveSettingsResponse,
} from '@/shared/types';

export interface SettingsState {
  loading: boolean;
  saving: boolean;
  error: string | null;
  effectiveConfig: EffectiveConfig | null;
  sources: ConfigSource[];
}

/**
 * Hook for managing Claude Code settings
 * Provides methods for reading, writing, and validating settings at all levels
 */
export function useSettings() {
  const [state, setState] = useState<SettingsState>({
    loading: true,
    saving: false,
    error: null,
    effectiveConfig: null,
    sources: [],
  });

  /**
   * Load effective (merged) settings from all sources
   */
  const loadEffectiveSettings = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    if (!window.electronAPI) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Not running in Electron',
      }));
      return;
    }

    try {
      const response =
        (await window.electronAPI.getEffectiveSettings()) as GetEffectiveSettingsResponse;

      if (response.success && response.data) {
        setState({
          loading: false,
          saving: false,
          error: null,
          effectiveConfig: response.data,
          sources: response.data.sources,
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error ?? 'Failed to load settings',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load settings',
      }));
    }
  }, []);

  /**
   * Load settings from a specific level
   */
  const loadSettings = useCallback(async (level: ConfigLevel): Promise<ConfigSource | null> => {
    if (!window.electronAPI) {
      return null;
    }

    try {
      const response = (await window.electronAPI.getSettings({ level })) as GetSettingsResponse;

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error(`Failed to load ${level} settings:`, error);
      return null;
    }
  }, []);

  /**
   * Save settings to a specific level
   */
  const saveSettings = useCallback(
    async (level: Exclude<ConfigLevel, 'managed'>, settings: ClaudeSettings): Promise<boolean> => {
      setState(prev => ({ ...prev, saving: true, error: null }));

      if (!window.electronAPI) {
        setState(prev => ({
          ...prev,
          saving: false,
          error: 'Not running in Electron',
        }));
        return false;
      }

      try {
        const response = (await window.electronAPI.saveSettings({
          level,
          settings,
        })) as SaveSettingsResponse;

        if (response.success) {
          setState(prev => ({ ...prev, saving: false }));
          // Reload effective settings after save
          await loadEffectiveSettings();
          return true;
        } else {
          setState(prev => ({
            ...prev,
            saving: false,
            error: response.error ?? 'Failed to save settings',
          }));
          return false;
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          saving: false,
          error: error instanceof Error ? error.message : 'Failed to save settings',
        }));
        return false;
      }
    },
    [loadEffectiveSettings]
  );

  /**
   * Validate settings
   */
  const validateSettings = useCallback(
    async (settings: ClaudeSettings): Promise<SettingsValidationResult | null> => {
      if (!window.electronAPI) {
        return null;
      }

      try {
        const response = (await window.electronAPI.validateSettings({
          settings,
        })) as ValidateSettingsResponse;

        if (response.success && response.data) {
          return response.data;
        }

        return null;
      } catch (error) {
        console.error('Failed to validate settings:', error);
        return null;
      }
    },
    []
  );

  /**
   * Check if a settings file exists
   */
  const settingsFileExists = useCallback(async (level: ConfigLevel): Promise<boolean> => {
    if (!window.electronAPI) {
      return false;
    }

    try {
      const response = (await window.electronAPI.settingsFileExists({ level })) as {
        success: boolean;
        data?: { exists: boolean };
      };
      return response.success && response.data?.exists === true;
    } catch (error) {
      console.error(`Failed to check if ${level} settings exists:`, error);
      return false;
    }
  }, []);

  /**
   * Ensure a settings file exists (creates if it doesn't)
   */
  const ensureSettingsFile = useCallback(
    async (level: Exclude<ConfigLevel, 'managed'>): Promise<boolean> => {
      if (!window.electronAPI) {
        return false;
      }

      try {
        const response = (await window.electronAPI.ensureSettingsFile({ level })) as {
          success: boolean;
        };
        return response.success;
      } catch (error) {
        console.error(`Failed to ensure ${level} settings file:`, error);
        return false;
      }
    },
    []
  );

  /**
   * Delete a settings file
   */
  const deleteSettings = useCallback(
    async (level: Exclude<ConfigLevel, 'managed'>): Promise<boolean> => {
      if (!window.electronAPI) {
        return false;
      }

      try {
        const response = (await window.electronAPI.deleteSettings({ level })) as {
          success: boolean;
        };

        if (response.success) {
          // Reload effective settings after delete
          await loadEffectiveSettings();
          return true;
        }

        return false;
      } catch (error) {
        console.error(`Failed to delete ${level} settings:`, error);
        return false;
      }
    },
    [loadEffectiveSettings]
  );

  /**
   * Create a backup of settings file
   */
  const createBackup = useCallback(async (level: ConfigLevel): Promise<string | null> => {
    if (!window.electronAPI) {
      return null;
    }

    try {
      const response = (await window.electronAPI.createBackup({ level })) as {
        success: boolean;
        data?: { backupPath: string };
      };

      if (response.success && response.data) {
        return response.data.backupPath;
      }

      return null;
    } catch (error) {
      console.error(`Failed to create backup for ${level} settings:`, error);
      return null;
    }
  }, []);

  /**
   * Restore settings from a backup file
   */
  const restoreBackup = useCallback(
    async (backupPath: string, level: Exclude<ConfigLevel, 'managed'>): Promise<boolean> => {
      if (!window.electronAPI) {
        return false;
      }

      try {
        const response = (await window.electronAPI.restoreBackup({
          backupPath,
          level,
        })) as { success: boolean };

        if (response.success) {
          // Reload effective settings after restore
          await loadEffectiveSettings();
          return true;
        }

        return false;
      } catch (error) {
        console.error(`Failed to restore backup:`, error);
        return false;
      }
    },
    [loadEffectiveSettings]
  );

  // Load settings on mount
  useEffect(() => {
    loadEffectiveSettings();
  }, [loadEffectiveSettings]);

  return {
    ...state,
    loadSettings,
    saveSettings,
    validateSettings,
    settingsFileExists,
    ensureSettingsFile,
    deleteSettings,
    createBackup,
    restoreBackup,
    refetch: loadEffectiveSettings,
  };
}

/**
 * Hook for managing settings at a specific level
 * Useful for editing settings at a specific level (user, project, or local)
 */
export function useLevelSettings(level: ConfigLevel, projectPath?: string) {
  const [settings, setSettings] = useState<ClaudeSettings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<ClaudeSettings>({});

  /**
   * Load settings for this specific level
   */
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!window.electronAPI) {
      setError('Not running in Electron');
      setLoading(false);
      return;
    }

    try {
      const response = (await window.electronAPI.getSettings({
        level,
        projectPath,
      })) as GetSettingsResponse;

      if (response.success && response.data) {
        const loadedSettings = response.data.content;
        setSettings(loadedSettings);
        setOriginalSettings(loadedSettings);
        setHasChanges(false);
      } else {
        setError(response.error ?? 'Failed to load settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [level, projectPath]);

  /**
   * Update settings (in memory only)
   */
  const updateSettings = useCallback(
    (newSettings: Partial<ClaudeSettings>) => {
      setSettings(prev => {
        const updated = { ...prev, ...newSettings };
        setHasChanges(JSON.stringify(updated) !== JSON.stringify(originalSettings));
        return updated;
      });
    },
    [originalSettings]
  );

  /**
   * Save settings to file
   */
  const save = useCallback(async (): Promise<boolean> => {
    if (level === 'managed') {
      setError('Cannot save managed settings');
      return false;
    }

    if (!window.electronAPI) {
      setError('Not running in Electron');
      return false;
    }

    try {
      const response = (await window.electronAPI.saveSettings({
        level,
        settings,
        projectPath,
      })) as SaveSettingsResponse;

      if (response.success) {
        setOriginalSettings(settings);
        setHasChanges(false);
        return true;
      } else {
        setError(response.error ?? 'Failed to save settings');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      return false;
    }
  }, [level, settings, projectPath]);

  /**
   * Discard changes and revert to original settings
   */
  const discard = useCallback(() => {
    setSettings(originalSettings);
    setHasChanges(false);
  }, [originalSettings]);

  /**
   * Validate current settings
   */
  const validate = useCallback(async (): Promise<SettingsValidationResult | null> => {
    if (!window.electronAPI) {
      return null;
    }

    try {
      const response = (await window.electronAPI.validateSettings({
        settings,
      })) as ValidateSettingsResponse;

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (err) {
      console.error('Failed to validate settings:', err);
      return null;
    }
  }, [settings]);

  // Load settings on mount
  useEffect(() => {
    load();
  }, [load]);

  return {
    settings,
    loading,
    error,
    hasChanges,
    updateSettings,
    save,
    discard,
    validate,
    reload: load,
  };
}
