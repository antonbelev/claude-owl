import { ipcMain } from 'electron';
import { GetServiceStatusResponse } from '@/shared/types';
import { StatusService } from '../services/StatusService';

const statusService = new StatusService();

// Define channel directly to avoid bundler issues
const STATUS_CHANNEL = 'status:get-service-status';

export function registerStatusHandlers() {
  console.log('[StatusHandlers] Registering status IPC handlers');
  console.log('[StatusHandlers] Channel name:', STATUS_CHANNEL);

  try {
    // Get service status
    ipcMain.handle(STATUS_CHANNEL, async (): Promise<GetServiceStatusResponse> => {
      console.log('[StatusHandlers] GET_SERVICE_STATUS request received');

      try {
        const status = await statusService.getServiceStatus();

        console.log('[StatusHandlers] Service status retrieved successfully:', {
          level: status.level,
          incidentCount: status.recentIncidents.length,
        });

        return {
          success: true,
          data: status,
        };
      } catch (error) {
        console.error('[StatusHandlers] Failed to get service status:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch service status',
        };
      }
    });

    console.log('[StatusHandlers] Status IPC handlers registered successfully');
  } catch (error) {
    console.error('[StatusHandlers] Failed to register handlers:', error);
    throw error;
  }
}
