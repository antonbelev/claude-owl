/**
 * IPC handlers for MCP server management
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/types/ipc.common.types';
import type {
  AddMCPServerRequest,
  AddMCPServerResponse,
  RemoveMCPServerRequest,
  RemoveMCPServerResponse,
  ListMCPServersRequest,
  ListMCPServersResponse,
  GetMCPServerRequest,
  GetMCPServerResponse,
} from '../../shared/types/ipc.mcp.types';
import { ClaudeService } from '../services/ClaudeService';

const claudeService = new ClaudeService();

/**
 * Register all MCP-related IPC handlers
 */
export function registerMCPHandlers(): void {
  console.log('[MCPHandlers] Registering MCP IPC handlers');

  // Add MCP server
  ipcMain.handle(
    IPC_CHANNELS.ADD_MCP_SERVER,
    async (_, request: AddMCPServerRequest): Promise<AddMCPServerResponse> => {
      console.log('[MCPHandlers] Add MCP server request:', {
        name: request.name,
        transport: request.transport,
        scope: request.scope,
        projectPath: request.projectPath,
      });

      try {
        const result = await claudeService.addMCPServer(request);

        console.log('[MCPHandlers] Add MCP server result:', {
          success: result.success,
          message: result.message,
        });

        const response: AddMCPServerResponse = {
          success: result.success,
        };
        if (result.message) response.message = result.message;
        if (result.error) response.error = result.error;
        return response;
      } catch (error) {
        console.error('[MCPHandlers] Add MCP server error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to add MCP server',
        };
      }
    }
  );

  // Remove MCP server
  ipcMain.handle(
    IPC_CHANNELS.REMOVE_MCP_SERVER,
    async (_, request: RemoveMCPServerRequest): Promise<RemoveMCPServerResponse> => {
      console.log('[MCPHandlers] Remove MCP server request:', {
        name: request.name,
        scope: request.scope,
        projectPath: request.projectPath,
      });

      try {
        const result = await claudeService.removeMCPServer(request.name, request.scope, request.projectPath);

        console.log('[MCPHandlers] Remove MCP server result:', {
          success: result.success,
          message: result.message,
        });

        const response: RemoveMCPServerResponse = {
          success: result.success,
        };
        if (result.message) response.message = result.message;
        if (result.error) response.error = result.error;
        return response;
      } catch (error) {
        console.error('[MCPHandlers] Remove MCP server error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to remove MCP server',
        };
      }
    }
  );

  // List MCP servers
  ipcMain.handle(
    IPC_CHANNELS.LIST_MCP_SERVERS,
    async (_, request?: ListMCPServersRequest): Promise<ListMCPServersResponse> => {
      console.log('[MCPHandlers] List MCP servers request, scope:', request?.scope || 'all');

      try {
        const servers = await claudeService.listMCPServers(request?.scope);

        console.log('[MCPHandlers] List MCP servers result:', {
          count: servers.length,
        });

        return {
          success: true,
          servers,
        };
      } catch (error) {
        console.error('[MCPHandlers] List MCP servers error:', error);
        return {
          success: false,
          servers: [],
          error: error instanceof Error ? error.message : 'Failed to list MCP servers',
        };
      }
    }
  );

  // Get MCP server
  ipcMain.handle(
    IPC_CHANNELS.GET_MCP_SERVER,
    async (_, request: GetMCPServerRequest): Promise<GetMCPServerResponse> => {
      console.log('[MCPHandlers] Get MCP server request:', request.name);

      try {
        const server = await claudeService.getMCPServer(request.name);

        if (server) {
          console.log('[MCPHandlers] Get MCP server result: found');
          return {
            success: true,
            server,
          };
        } else {
          console.log('[MCPHandlers] Get MCP server result: not found');
          return {
            success: false,
            error: `MCP server not found: ${request.name}`,
          };
        }
      } catch (error) {
        console.error('[MCPHandlers] Get MCP server error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get MCP server',
        };
      }
    }
  );

  console.log('[MCPHandlers] MCP IPC handlers registered successfully');
}
