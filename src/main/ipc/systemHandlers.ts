import { ipcMain } from 'electron';
import { IPC_CHANNELS, CheckClaudeInstalledResponse } from '@/shared/types';
import { ClaudeService } from '../services/ClaudeService';
import { app } from 'electron';

const claudeService = new ClaudeService();

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
  ipcMain.handle(IPC_CHANNELS.CHECK_CLAUDE_INSTALLED, async (): Promise<CheckClaudeInstalledResponse> => {
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
  });
}
