import { ipcMain } from 'electron';
import type {
  GetProjectsRequest,
  GetProjectsResponse,
  GetProjectInfoRequest,
  GetProjectInfoResponse,
  GetProjectMCPServersRequest,
  GetProjectMCPServersResponse,
  CheckClaudeConfigRequest,
  CheckClaudeConfigResponse,
  ReadClaudeConfigRequest,
  ReadClaudeConfigResponse,
} from '@/shared/types/ipc.projects.types';
import { ProjectDiscoveryService } from '../services/ProjectDiscoveryService';

const projectDiscoveryService = new ProjectDiscoveryService();

// Define channel strings directly to avoid tree-shaking issues
const CHANNELS = {
  GET_PROJECTS: 'projects:get-all',
  GET_PROJECT_INFO: 'projects:get-info',
  GET_PROJECT_MCP_SERVERS: 'projects:get-mcp-servers',
  CHECK_CLAUDE_CONFIG: 'projects:check-config',
  READ_CLAUDE_CONFIG: 'projects:read-config',
} as const;

export function registerProjectsHandlers() {
  console.log('[ProjectsHandlers] Registering IPC handlers');

  // Get all projects from .claude.json
  ipcMain.handle(
    CHANNELS.GET_PROJECTS,
    async (_event, _request: GetProjectsRequest): Promise<GetProjectsResponse> => {
      console.log('[ProjectsHandlers] Get projects request received');

      try {
        const projects = await projectDiscoveryService.getProjects();

        console.log('[ProjectsHandlers] Projects retrieved:', {
          count: projects.length,
        });

        return {
          success: true,
          data: { projects },
        };
      } catch (error) {
        console.error('[ProjectsHandlers] Failed to get projects:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get projects',
        };
      }
    }
  );

  // Get detailed info about a specific project
  ipcMain.handle(
    CHANNELS.GET_PROJECT_INFO,
    async (_event, request: GetProjectInfoRequest): Promise<GetProjectInfoResponse> => {
      console.log('[ProjectsHandlers] Get project info request:', {
        projectPath: request.projectPath,
      });

      try {
        const result = await projectDiscoveryService.getProjectInfo(request.projectPath);

        console.log('[ProjectsHandlers] Project info retrieved:', {
          name: result.projectInfo.name,
        });

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error('[ProjectsHandlers] Failed to get project info:', {
          projectPath: request.projectPath,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get project info',
        };
      }
    }
  );

  // Get MCP servers for a project
  ipcMain.handle(
    CHANNELS.GET_PROJECT_MCP_SERVERS,
    async (_event, request: GetProjectMCPServersRequest): Promise<GetProjectMCPServersResponse> => {
      console.log('[ProjectsHandlers] Get project MCP servers request:', {
        projectPath: request.projectPath,
      });

      try {
        const servers = await projectDiscoveryService.getProjectMCPServers(request.projectPath);

        console.log('[ProjectsHandlers] MCP servers retrieved:', {
          count: servers.length,
        });

        return {
          success: true,
          data: { servers },
        };
      } catch (error) {
        console.error('[ProjectsHandlers] Failed to get MCP servers:', {
          projectPath: request.projectPath,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get MCP servers',
        };
      }
    }
  );

  // Check if .claude.json exists and is readable
  ipcMain.handle(
    CHANNELS.CHECK_CLAUDE_CONFIG,
    async (_event, _request: CheckClaudeConfigRequest): Promise<CheckClaudeConfigResponse> => {
      console.log('[ProjectsHandlers] Check Claude config request');

      try {
        const result = await projectDiscoveryService.checkClaudeConfig();

        console.log('[ProjectsHandlers] Claude config checked:', result);

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error('[ProjectsHandlers] Failed to check config:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to check config',
        };
      }
    }
  );

  // Read raw .claude.json content
  ipcMain.handle(
    CHANNELS.READ_CLAUDE_CONFIG,
    async (_event, _request: ReadClaudeConfigRequest): Promise<ReadClaudeConfigResponse> => {
      console.log('[ProjectsHandlers] Read Claude config request');

      try {
        const config = await projectDiscoveryService.readClaudeConfig();
        const path = projectDiscoveryService.getClaudeConfigPath();

        console.log('[ProjectsHandlers] Config read successfully');

        return {
          success: true,
          data: { config, path },
        };
      } catch (error) {
        console.error('[ProjectsHandlers] Failed to read config:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to read config',
        };
      }
    }
  );

  console.log('[ProjectsHandlers] All handlers registered successfully');
}

// Export channel names for use in preload
export const PROJECTS_CHANNELS = CHANNELS;
