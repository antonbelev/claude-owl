import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@/shared/types';
import type {
  ListMCPServersResponse,
  GetMCPServerRequest,
  GetMCPServerResponse,
  AddMCPServerRequest,
  AddMCPServerResponse,
  RemoveMCPServerRequest,
  RemoveMCPServerResponse,
  TestMCPServerRequest,
  TestMCPServerResponse,
  ValidateMCPConfigRequest,
  ValidateMCPConfigResponse,
  TestAllMCPServersRequest,
  TestAllMCPServersResponse,
  GetMCPPlatformHintsResponse,
  MCPServerConfig,
} from '@/shared/types';
import { MCPService } from '../services/MCPService';

const mcpService = new MCPService();

/**
 * Register IPC handlers for MCP operations
 */
export function registerMCPHandlers() {
  console.log('[MCPHandlers] Registering MCP IPC handlers');

  /**
   * List all MCP servers
   */
  ipcMain.handle(IPC_CHANNELS.LIST_MCP_SERVERS, async (): Promise<ListMCPServersResponse> => {
    try {
      console.log('[MCPHandler] LIST_MCP_SERVERS request');
      const servers = await mcpService.listServers();
      return {
        success: true,
        data: servers,
      };
    } catch (error) {
      console.error('[MCPHandler] LIST_MCP_SERVERS failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list MCP servers',
      };
    }
  });

  /**
   * Get a specific MCP server
   */
  ipcMain.handle(
    IPC_CHANNELS.GET_MCP_SERVER,
    async (_event, request: GetMCPServerRequest): Promise<GetMCPServerResponse> => {
      try {
        console.log('[MCPHandler] GET_MCP_SERVER request:', request.name);
        const server = await mcpService.getServer(request.name);
        return {
          success: true,
          data: server,
        };
      } catch (error) {
        console.error('[MCPHandler] GET_MCP_SERVER failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get MCP server',
        };
      }
    }
  );

  /**
   * Add a new MCP server
   */
  ipcMain.handle(
    IPC_CHANNELS.ADD_MCP_SERVER,
    async (_event, request: AddMCPServerRequest): Promise<AddMCPServerResponse> => {
      try {
        console.log('[MCPHandler] ADD_MCP_SERVER request:', {
          name: request.name,
          transport: request.transport,
        });

        const config: MCPServerConfig = {
          name: request.name,
          transport: request.transport,
          scope: 'user',
        };

        // Only add defined optional properties
        if (request.command !== undefined) config.command = request.command;
        if (request.args !== undefined) config.args = request.args;
        if (request.env !== undefined) config.env = request.env;
        if (request.workingDirectory !== undefined) config.workingDirectory = request.workingDirectory;
        if (request.url !== undefined) config.url = request.url;
        if (request.headers !== undefined) config.headers = request.headers;

        const server = await mcpService.addServer(config);

        return {
          success: true,
          data: server,
        };
      } catch (error) {
        console.error('[MCPHandler] ADD_MCP_SERVER failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to add MCP server',
        };
      }
    }
  );

  /**
   * Remove an MCP server
   */
  ipcMain.handle(
    IPC_CHANNELS.REMOVE_MCP_SERVER,
    async (_event, request: RemoveMCPServerRequest): Promise<RemoveMCPServerResponse> => {
      try {
        console.log('[MCPHandler] REMOVE_MCP_SERVER request:', request.name);
        await mcpService.removeServer(request.name, 'user');
        return {
          success: true,
          data: { removed: true },
        };
      } catch (error) {
        console.error('[MCPHandler] REMOVE_MCP_SERVER failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to remove MCP server',
        };
      }
    }
  );

  /**
   * Test MCP server connection
   */
  ipcMain.handle(
    IPC_CHANNELS.TEST_MCP_SERVER,
    async (_event, request: TestMCPServerRequest): Promise<TestMCPServerResponse> => {
      try {
        console.log('[MCPHandler] TEST_MCP_SERVER request:', request.name);
        const result = await mcpService.testConnection(request.name, request.timeout);
        return {
          success: result.success,
          data: result,
        };
      } catch (error) {
        console.error('[MCPHandler] TEST_MCP_SERVER failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to test MCP server connection',
        };
      }
    }
  );

  /**
   * Validate MCP server configuration
   */
  ipcMain.handle(
    IPC_CHANNELS.VALIDATE_MCP_CONFIG,
    async (_event, request: ValidateMCPConfigRequest): Promise<ValidateMCPConfigResponse> => {
      try {
        console.log('[MCPHandler] VALIDATE_MCP_CONFIG request:', request.name);
        // Cast the request config to the expected type (includes name)
        const validation = await mcpService.validateConfig(request.config as Omit<MCPServerConfig, 'scope'>);
        return {
          success: true,
          data: validation,
        };
      } catch (error) {
        console.error('[MCPHandler] VALIDATE_MCP_CONFIG failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to validate MCP config',
        };
      }
    }
  );

  /**
   * Test all MCP server connections
   */
  ipcMain.handle(
    IPC_CHANNELS.TEST_ALL_MCP_SERVERS,
    async (_event, request: TestAllMCPServersRequest): Promise<TestAllMCPServersResponse> => {
      try {
        console.log('[MCPHandler] TEST_ALL_MCP_SERVERS request');
        const servers = await mcpService.listServers();
        const results: Record<string, any> = {};
        let connected = 0;
        let failed = 0;

        for (const server of servers) {
          const result = await mcpService.testConnection(server.name, request.timeout || 10000);
          results[server.name] = result;
          if (result.success) {
            connected++;
          } else {
            failed++;
          }
        }

        return {
          success: true,
          data: {
            results,
            summary: {
              total: servers.length,
              connected,
              failed,
            },
          },
        };
      } catch (error) {
        console.error('[MCPHandler] TEST_ALL_MCP_SERVERS failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to test all MCP servers',
        };
      }
    }
  );

  /**
   * Get MCP platform hints
   */
  ipcMain.handle(
    IPC_CHANNELS.GET_MCP_PLATFORM_HINTS,
    async (): Promise<GetMCPPlatformHintsResponse> => {
      try {
        console.log('[MCPHandler] GET_MCP_PLATFORM_HINTS request');
        const hints = mcpService.getPlatformHints();
        return {
          success: true,
          data: hints,
        };
      } catch (error) {
        console.error('[MCPHandler] GET_MCP_PLATFORM_HINTS failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get platform hints',
        };
      }
    }
  );

  console.log('[MCPHandlers] MCP IPC handlers registered successfully');
}

/**
 * Cleanup MCP service on shutdown
 */
export function cleanupMCPService() {
  console.log('[MCPHandlers] Cleaning up MCP service');
  mcpService.cleanup();
}
