import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@/shared/types';
import type {
  GetActiveStatusLineResponse,
  ListTemplatesResponse,
  SetTemplateRequest,
  SetTemplateResponse,
  SetCustomScriptRequest,
  SetCustomScriptResponse,
  PreviewStatusLineRequest,
  PreviewStatusLineResponse,
  DisableStatusLineResponse,
  ScanScriptRequest,
  ScanScriptResponse,
  ExportScriptRequest,
  ExportScriptResponse,
} from '@/shared/types';
import { StatusLineService } from '../services/StatusLineService';

const statusLineService = new StatusLineService();

/**
 * Register IPC handlers for status line operations
 */
export function registerStatusLineHandlers() {
  console.log('[StatusLineHandlers] Registering IPC handlers');

  // Get active status line configuration
  ipcMain.handle(
    IPC_CHANNELS.GET_ACTIVE_STATUSLINE,
    async (): Promise<GetActiveStatusLineResponse> => {
      console.log('[StatusLineHandlers] Get active status line request');

      try {
        const config = await statusLineService.getActiveConfig();
        return {
          success: true,
          data: config,
        };
      } catch (error) {
        console.error('[StatusLineHandlers] Failed to get active status line:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get active status line',
        };
      }
    }
  );

  // List all available templates
  ipcMain.handle(
    IPC_CHANNELS.LIST_STATUSLINE_TEMPLATES,
    async (): Promise<ListTemplatesResponse> => {
      console.log('[StatusLineHandlers] List templates request');

      try {
        const templates = await statusLineService.listTemplates();
        return {
          success: true,
          data: templates,
        };
      } catch (error) {
        console.error('[StatusLineHandlers] Failed to list templates:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to list templates',
        };
      }
    }
  );

  // Set status line from template
  ipcMain.handle(
    IPC_CHANNELS.SET_STATUSLINE_TEMPLATE,
    async (_event, request: SetTemplateRequest): Promise<SetTemplateResponse> => {
      console.log('[StatusLineHandlers] Set template request:', { templateId: request.templateId });

      try {
        const result = await statusLineService.setTemplate(request.templateId);
        return {
          success: true,
          scriptPath: result.scriptPath,
        };
      } catch (error) {
        console.error('[StatusLineHandlers] Failed to set template:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to set template',
        };
      }
    }
  );

  // Set custom status line script
  ipcMain.handle(
    IPC_CHANNELS.SET_CUSTOM_STATUSLINE,
    async (_event, request: SetCustomScriptRequest): Promise<SetCustomScriptResponse> => {
      console.log('[StatusLineHandlers] Set custom script request:', {
        language: request.language,
        scriptLength: request.scriptContent.length,
      });

      try {
        const result = await statusLineService.setCustomScript(
          request.scriptContent,
          request.language
        );
        return {
          success: true,
          scriptPath: result.scriptPath,
        };
      } catch (error) {
        console.error('[StatusLineHandlers] Failed to set custom script:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to set custom script',
        };
      }
    }
  );

  // Preview status line
  ipcMain.handle(
    IPC_CHANNELS.PREVIEW_STATUSLINE,
    async (_event, request: PreviewStatusLineRequest): Promise<PreviewStatusLineResponse> => {
      console.log('[StatusLineHandlers] Preview request:', {
        templateId: request.templateId,
        hasCustomScript: !!request.scriptContent,
      });

      try {
        const result = await statusLineService.previewStatusLine(
          request.templateId,
          request.scriptContent
        );
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error('[StatusLineHandlers] Failed to preview:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to preview status line',
        };
      }
    }
  );

  // Disable status line
  ipcMain.handle(IPC_CHANNELS.DISABLE_STATUSLINE, async (): Promise<DisableStatusLineResponse> => {
    console.log('[StatusLineHandlers] Disable request');

    try {
      await statusLineService.disable();
      return {
        success: true,
      };
    } catch (error) {
      console.error('[StatusLineHandlers] Failed to disable:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disable status line',
      };
    }
  });

  // Scan script for security issues
  ipcMain.handle(
    IPC_CHANNELS.SCAN_STATUSLINE_SCRIPT,
    async (_event, request: ScanScriptRequest): Promise<ScanScriptResponse> => {
      console.log('[StatusLineHandlers] Scan script request');

      try {
        const result = await statusLineService.scanScript(request.scriptContent);
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error('[StatusLineHandlers] Failed to scan script:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to scan script',
        };
      }
    }
  );

  // Export template to standalone script
  ipcMain.handle(
    IPC_CHANNELS.EXPORT_STATUSLINE_SCRIPT,
    async (_event, request: ExportScriptRequest): Promise<ExportScriptResponse> => {
      console.log('[StatusLineHandlers] Export script request:', {
        templateId: request.templateId,
        targetPath: request.targetPath,
      });

      try {
        const result = await statusLineService.exportScript(request.templateId, request.targetPath);
        return {
          success: true,
          exportPath: result.exportPath,
        };
      } catch (error) {
        console.error('[StatusLineHandlers] Failed to export script:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to export script',
        };
      }
    }
  );

  console.log('[StatusLineHandlers] All handlers registered successfully');
}
