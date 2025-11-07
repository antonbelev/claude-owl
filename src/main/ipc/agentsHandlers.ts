import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@/shared/types';
import type {
  ListAgentsResponse,
  GetAgentRequest,
  GetAgentResponse,
  SaveAgentRequest,
  SaveAgentResponse,
  DeleteAgentRequest,
  DeleteAgentResponse,
} from '@/shared/types';
import { AgentsService } from '../services/AgentsService';

const agentsService = new AgentsService();

/**
 * Register IPC handlers for agents operations
 */
export function registerAgentsHandlers() {
  // List all agents
  ipcMain.handle(IPC_CHANNELS.LIST_AGENTS, async (): Promise<ListAgentsResponse> => {
    try {
      const agents = await agentsService.listAllAgents();
      return {
        success: true,
        data: agents,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list agents',
      };
    }
  });

  // Get a specific agent
  ipcMain.handle(
    IPC_CHANNELS.GET_AGENT,
    async (_event, request: GetAgentRequest): Promise<GetAgentResponse> => {
      try {
        const agent = await agentsService.getAgent(request.filePath);
        return {
          success: true,
          data: agent,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get agent',
        };
      }
    }
  );

  // Save an agent (create or update)
  ipcMain.handle(
    IPC_CHANNELS.SAVE_AGENT,
    async (_event, request: SaveAgentRequest): Promise<SaveAgentResponse> => {
      try {
        await agentsService.saveAgent(request.agent);
        return {
          success: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to save agent',
        };
      }
    }
  );

  // Delete an agent
  ipcMain.handle(
    IPC_CHANNELS.DELETE_AGENT,
    async (_event, request: DeleteAgentRequest): Promise<DeleteAgentResponse> => {
      try {
        await agentsService.deleteAgent(request.filePath);
        return {
          success: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete agent',
        };
      }
    }
  );
}
