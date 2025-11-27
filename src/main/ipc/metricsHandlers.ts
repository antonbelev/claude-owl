import { ipcMain } from 'electron';
import type { ComputeMetricsRequest, ComputeMetricsResponse } from '@/shared/types';
import { IPC_CHANNELS } from '@/shared/types';
import { MetricsService } from '../services/MetricsService';

const metricsService = new MetricsService();

/**
 * Register IPC handlers for metrics operations
 */
export function registerMetricsHandlers() {
  console.log('[MetricsHandlers] Registering IPC handlers');

  // Compute metrics from JSONL files
  ipcMain.handle(
    IPC_CHANNELS.COMPUTE_METRICS,
    async (_, request?: ComputeMetricsRequest): Promise<ComputeMetricsResponse> => {
      console.log('[MetricsHandlers] Compute metrics request:', {
        filter: request?.filter,
      });

      try {
        const data = await metricsService.computeMetricsFromJSONL(request?.filter);

        console.log('[MetricsHandlers] Metrics computation completed:', {
          sessionCount: data.sessions.length,
          dailyDataPoints: data.daily.length,
          modelCount: data.byModel.length,
          projectCount: data.byProject.length,
          totalCost: data.summary.totalCost,
        });

        return {
          success: true,
          data,
        };
      } catch (error) {
        console.error('[MetricsHandlers] Error computing metrics:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to compute metrics',
        };
      }
    }
  );
}
