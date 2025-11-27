import { ipcMain, shell } from 'electron';
import { IPC_CHANNELS, CheckClaudeInstalledResponse } from '@/shared/types';
import { ClaudeService } from '../services/ClaudeService';
import { app } from 'electron';

const claudeService = new ClaudeService();

/**
 * Validate URL to prevent opening dangerous protocols
 * Only allow http:// and https:// schemes
 */
function isValidExternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    // Invalid URL
    console.warn('[SystemHandlers] Invalid URL format:', url);
    return false;
  }
}

export function registerSystemHandlers() {
  // Get app version
  ipcMain.handle(IPC_CHANNELS.GET_APP_VERSION, async () => {
    return app.getVersion();
  });

  // Get Claude version
  ipcMain.handle(IPC_CHANNELS.GET_CLAUDE_VERSION, async () => {
    return await claudeService.getVersion();
  });

  // Check if Claude is installed
  ipcMain.handle(
    IPC_CHANNELS.CHECK_CLAUDE_INSTALLED,
    async (): Promise<CheckClaudeInstalledResponse> => {
      try {
        const info = await claudeService.checkInstallation();

        return {
          success: true,
          installed: info.installed,
          ...(info.version && { version: info.version }),
          ...(info.path && { path: info.path }),
        };
      } catch (error) {
        return {
          success: false,
          installed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Open external URL in default browser
  ipcMain.handle('system:open-external', async (_event, url: string) => {
    try {
      // Validate URL to prevent opening dangerous protocols (file://, data:, etc.)
      if (!isValidExternalUrl(url)) {
        console.error('[SystemHandlers] Attempted to open invalid URL:', url);
        return {
          success: false,
          error: 'Invalid URL: only http:// and https:// URLs are allowed',
        };
      }

      await shell.openExternal(url);
      console.log('[SystemHandlers] Successfully opened external URL');
      return { success: true };
    } catch (error) {
      console.error('[SystemHandlers] Failed to open external URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}
