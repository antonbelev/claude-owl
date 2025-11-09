import { ipcMain } from 'electron';
import { debugLogsService } from '../services/DebugLogsService';
import {
  ListDebugLogsResponse,
  GetDebugLogRequest,
  GetDebugLogResponse,
  DeleteDebugLogRequest,
  DeleteDebugLogResponse,
  SearchDebugLogsRequest,
  SearchDebugLogsResponse,
} from '../../shared/types/ipc.types';

/**
 * Register IPC handlers for debug logs functionality
 */
export function registerDebugLogsHandlers() {
  console.log('[DebugLogsHandler] Registering debug logs IPC handlers');

  /**
   * List all debug logs
   */
  ipcMain.handle('logs:list', async (): Promise<ListDebugLogsResponse> => {
    console.log('[DebugLogsHandler] LIST_DEBUG_LOGS request received');

    try {
      const logs = await debugLogsService.listDebugLogs();
      return {
        success: true,
        data: logs,
      };
    } catch (error) {
      console.error('[DebugLogsHandler] LIST_DEBUG_LOGS failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list debug logs',
      };
    }
  });

  /**
   * Get a specific debug log with content
   */
  ipcMain.handle(
    'logs:get',
    async (_, request: GetDebugLogRequest): Promise<GetDebugLogResponse> => {
      console.log('[DebugLogsHandler] GET_DEBUG_LOG request:', request.filename);

      try {
        const log = await debugLogsService.getDebugLog(request.filename);
        return {
          success: true,
          data: log,
        };
      } catch (error) {
        console.error('[DebugLogsHandler] GET_DEBUG_LOG failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get debug log',
        };
      }
    }
  );

  /**
   * Delete a debug log
   */
  ipcMain.handle(
    'logs:delete',
    async (_, request: DeleteDebugLogRequest): Promise<DeleteDebugLogResponse> => {
      console.log('[DebugLogsHandler] DELETE_DEBUG_LOG request:', request.filename);

      try {
        await debugLogsService.deleteDebugLog(request.filename);
        return {
          success: true,
        };
      } catch (error) {
        console.error('[DebugLogsHandler] DELETE_DEBUG_LOG failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete debug log',
        };
      }
    }
  );

  /**
   * Search debug logs
   */
  ipcMain.handle(
    'logs:search',
    async (_, request: SearchDebugLogsRequest): Promise<SearchDebugLogsResponse> => {
      console.log('[DebugLogsHandler] SEARCH_DEBUG_LOGS request:', request.query);

      try {
        const results = await debugLogsService.searchDebugLogs(request.query);
        return {
          success: true,
          data: results,
        };
      } catch (error) {
        console.error('[DebugLogsHandler] SEARCH_DEBUG_LOGS failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to search debug logs',
        };
      }
    }
  );
}
