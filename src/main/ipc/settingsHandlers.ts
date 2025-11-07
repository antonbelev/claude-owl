import { ipcMain } from 'electron';
import type {
  GetSettingsRequest,
  GetSettingsResponse,
  SaveSettingsRequest,
  SaveSettingsResponse,
  ValidateSettingsRequest,
  ValidateSettingsResponse,
  GetEffectiveSettingsResponse,
  SettingsFileExistsRequest,
  SettingsFileExistsResponse,
  EnsureSettingsFileRequest,
  EnsureSettingsFileResponse,
  DeleteSettingsRequest,
  DeleteSettingsResponse,
} from '@/shared/types';
import { SettingsService } from '../services/SettingsService';

const settingsService = new SettingsService();

// Define channel strings directly to avoid tree-shaking issues with IPC_CHANNELS object
const CHANNELS = {
  GET_SETTINGS: 'settings:get',
  SAVE_SETTINGS: 'settings:save',
  VALIDATE_SETTINGS: 'settings:validate',
  GET_EFFECTIVE_SETTINGS: 'settings:get-effective',
  SETTINGS_FILE_EXISTS: 'settings:file-exists',
  ENSURE_SETTINGS_FILE: 'settings:ensure-file',
  DELETE_SETTINGS: 'settings:delete',
} as const;

export function registerSettingsHandlers() {
  // Get settings from a specific level
  ipcMain.handle(
    CHANNELS.GET_SETTINGS,
    async (_event, request: GetSettingsRequest): Promise<GetSettingsResponse> => {
      try {
        const configSource = await settingsService.readSettings(request.level);

        return {
          success: true,
          data: configSource,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Save settings to a specific level
  ipcMain.handle(
    CHANNELS.SAVE_SETTINGS,
    async (_event, request: SaveSettingsRequest): Promise<SaveSettingsResponse> => {
      try {
        await settingsService.writeSettings(request.level, request.settings);

        return {
          success: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Validate settings
  ipcMain.handle(
    CHANNELS.VALIDATE_SETTINGS,
    async (_event, request: ValidateSettingsRequest): Promise<ValidateSettingsResponse> => {
      try {
        const validationResult = settingsService.validateSettings(request.settings);

        return {
          success: true,
          data: validationResult,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get effective (merged) settings
  ipcMain.handle(
    CHANNELS.GET_EFFECTIVE_SETTINGS,
    async (): Promise<GetEffectiveSettingsResponse> => {
      try {
        const effectiveConfig = await settingsService.getEffectiveConfig();

        return {
          success: true,
          data: effectiveConfig,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Check if settings file exists
  ipcMain.handle(
    CHANNELS.SETTINGS_FILE_EXISTS,
    async (_event, request: SettingsFileExistsRequest): Promise<SettingsFileExistsResponse> => {
      try {
        const exists = await settingsService.settingsFileExists(request.level);

        return {
          success: true,
          data: { exists },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Ensure settings file exists
  ipcMain.handle(
    CHANNELS.ENSURE_SETTINGS_FILE,
    async (_event, request: EnsureSettingsFileRequest): Promise<EnsureSettingsFileResponse> => {
      try {
        await settingsService.ensureSettingsFile(request.level);

        return {
          success: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Delete settings file
  ipcMain.handle(
    CHANNELS.DELETE_SETTINGS,
    async (_event, request: DeleteSettingsRequest): Promise<DeleteSettingsResponse> => {
      try {
        await settingsService.deleteSettings(request.level);

        return {
          success: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
}
