/**
 * IPC Handlers for Hooks operations
 *
 * Handles communication between renderer and main process for hooks management
 */

import { ipcMain, shell } from 'electron';
import type {
  GetAllHooksRequest,
  GetAllHooksResponse,
  GetTemplatesResponse,
  GetSettingsPathRequest,
  GetSettingsPathResponse,
  OpenSettingsFileRequest,
  OpenSettingsFileResponse,
} from '../../shared/types/ipc.types';
import { HooksService } from '../services/HooksService';

// Define channels directly to prevent tree-shaking in build
// These MUST match the strings in IPC_CHANNELS (src/shared/types/ipc.types.ts)
const HOOKS_CHANNELS = {
  GET_ALL_HOOKS: 'hooks:get-all',
  GET_TEMPLATES: 'hooks:get-templates',
  GET_SETTINGS_PATH: 'hooks:get-settings-path',
  OPEN_SETTINGS_FILE: 'hooks:open-settings',
} as const;

const hooksService = new HooksService();

/**
 * Register all hooks-related IPC handlers
 */
export function registerHooksHandlers(): void {
  console.log('[HooksHandlers] Registering hooks IPC handlers');

  /**
   * Get all hooks with metadata and validation
   */
  ipcMain.handle(
    HOOKS_CHANNELS.GET_ALL_HOOKS,
    async (_, request: GetAllHooksRequest): Promise<GetAllHooksResponse> => {
      console.log('[HooksHandlers] Get all hooks request:', request);

      try {
        const hooks = await hooksService.getAllHooksWithMetadata(request.projectPath);

        console.log('[HooksHandlers] Hooks retrieved successfully:', {
          eventCount: hooks.length,
          totalHooks: hooks.reduce((sum, h) => sum + h.count, 0),
        });

        return {
          success: true,
          data: hooks,
        };
      } catch (error) {
        console.error('[HooksHandlers] Failed to get hooks:', error);

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get hooks',
        };
      }
    },
  );

  /**
   * Get hook templates
   */
  ipcMain.handle(HOOKS_CHANNELS.GET_TEMPLATES, async (): Promise<GetTemplatesResponse> => {
    console.log('[HooksHandlers] Get templates request');

    try {
      const templates = hooksService.getTemplates();

      console.log('[HooksHandlers] Templates retrieved:', {
        count: templates.length,
      });

      return {
        success: true,
        data: templates,
      };
    } catch (error) {
      console.error('[HooksHandlers] Failed to get templates:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get templates',
      };
    }
  });

  /**
   * Get settings file path
   */
  ipcMain.handle(
    HOOKS_CHANNELS.GET_SETTINGS_PATH,
    async (_, request: GetSettingsPathRequest): Promise<GetSettingsPathResponse> => {
      console.log('[HooksHandlers] Get settings path request:', request);

      try {
        const path = hooksService.getSettingsPath(request.location, request.projectPath);
        const exists = await hooksService.checkSettingsExists(
          request.location,
          request.projectPath,
        );

        console.log('[HooksHandlers] Settings path retrieved:', { path, exists });

        return {
          success: true,
          data: { path, exists },
        };
      } catch (error) {
        console.error('[HooksHandlers] Failed to get settings path:', error);

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get settings path',
        };
      }
    },
  );

  /**
   * Open settings file in external editor
   */
  ipcMain.handle(
    HOOKS_CHANNELS.OPEN_SETTINGS_FILE,
    async (_, request: OpenSettingsFileRequest): Promise<OpenSettingsFileResponse> => {
      console.log('[HooksHandlers] Open settings file request:', request);

      try {
        const path = hooksService.getSettingsPath(request.location, request.projectPath);

        console.log('[HooksHandlers] Opening settings file:', path);

        // Open the file in default editor
        await shell.openPath(path);

        return {
          success: true,
        };
      } catch (error) {
        console.error('[HooksHandlers] Failed to open settings file:', error);

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to open settings file',
        };
      }
    },
  );

  console.log('[HooksHandlers] Hooks IPC handlers registered successfully');
}
