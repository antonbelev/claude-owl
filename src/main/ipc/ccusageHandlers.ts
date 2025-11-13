import { ipcMain } from 'electron';
import type {
  CheckCCUsageInstalledResponse,
  GetCCUsageVersionResponse,
  GetUsageReportResponse,
} from '@/shared/types';
import { CCUsageService } from '../services/CCUsageService';

const ccusageService = new CCUsageService();

// Define channel strings directly to avoid tree-shaking issues with IPC_CHANNELS object
const CHANNELS = {
  CHECK_CCUSAGE_INSTALLED: 'ccusage:check-installed',
  GET_CCUSAGE_VERSION: 'ccusage:get-version',
  GET_USAGE_REPORT: 'ccusage:get-report',
} as const;

/**
 * Register IPC handlers for ccusage operations
 */
export function registerCCUsageHandlers() {
  process.stdout.write('[CCUsage] Registering IPC handlers\n');
  process.stdout.write(
    `[CCUsage] CHECK_CCUSAGE_INSTALLED channel: ${CHANNELS.CHECK_CCUSAGE_INSTALLED}\n`
  );

  // Check if ccusage is installed
  ipcMain.handle(
    CHANNELS.CHECK_CCUSAGE_INSTALLED,
    async (): Promise<CheckCCUsageInstalledResponse> => {
      try {
        process.stdout.write('[CCUsage IPC] Handler called for CHECK_CCUSAGE_INSTALLED\n');
        const installed = await ccusageService.isInstalled();
        process.stdout.write(`[CCUsage IPC] Installation check result: ${installed}\n`);
        return {
          success: true,
          installed,
        };
      } catch (error) {
        process.stderr.write(
          `[CCUsage IPC] Error in check handler: ${error instanceof Error ? error.message : error}\n`
        );
        return {
          success: false,
          installed: false,
          error: error instanceof Error ? error.message : 'Failed to check ccusage installation',
        };
      }
    }
  );

  // Get ccusage version
  ipcMain.handle(CHANNELS.GET_CCUSAGE_VERSION, async (): Promise<GetCCUsageVersionResponse> => {
    try {
      const version = await ccusageService.getVersion();
      return {
        success: true,
        version,
      };
    } catch (error) {
      return {
        success: false,
        version: null,
        error: error instanceof Error ? error.message : 'Failed to get ccusage version',
      };
    }
  });

  // Get usage report
  ipcMain.handle(CHANNELS.GET_USAGE_REPORT, async (): Promise<GetUsageReportResponse> => {
    try {
      process.stdout.write('[CCUsage IPC] Handler called for GET_USAGE_REPORT\n');
      const report = await ccusageService.getUsageReport();
      process.stdout.write(`[CCUsage IPC] Got report with ${report.days.length} days\n`);
      return {
        success: true,
        data: report,
      };
    } catch (error) {
      process.stderr.write(
        `[CCUsage IPC] Error getting usage report: ${error instanceof Error ? error.message : error}\n`
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get usage report',
      };
    }
  });

  // Get raw ccusage output
  ipcMain.handle(
    'ccusage:get-raw-output',
    async (): Promise<{ success: boolean; data?: string; error?: string }> => {
      try {
        process.stdout.write('[CCUsage IPC] Handler called for GET_RAW_OUTPUT\n');
        const output = await ccusageService.getRawOutput();
        return {
          success: true,
          data: output,
        };
      } catch (error) {
        process.stderr.write(
          `[CCUsage IPC] Error getting raw output: ${error instanceof Error ? error.message : error}\n`
        );
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get ccusage output',
        };
      }
    }
  );
}
