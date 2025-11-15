/**
 * Project Discovery IPC type definitions
 */

import type { IPCResponse } from './ipc.common.types';
import type { ProjectInfo, ClaudeConfig, ClaudeProjectData } from './project.types';
import type { MCPServerConfig } from './mcp.types';

/**
 * Get list of all projects from .claude.json
 */
export interface GetProjectsRequest {
  // No parameters needed - always reads from ~/.claude.json
}

export interface GetProjectsResponse
  extends IPCResponse<{
    projects: ProjectInfo[];
  }> {}

/**
 * Get detailed information about a specific project
 */
export interface GetProjectInfoRequest {
  projectPath: string;
}

export interface GetProjectInfoResponse
  extends IPCResponse<{
    projectInfo: ProjectInfo;
    projectData: ClaudeProjectData;
  }> {}

/**
 * Get MCP servers for a specific project (from .claude.json)
 */
export interface GetProjectMCPServersRequest {
  projectPath: string;
}

export interface GetProjectMCPServersResponse
  extends IPCResponse<{
    servers: Array<{
      name: string;
      config: MCPServerConfig;
      source: 'claude-json' | 'mcp-json';
    }>;
  }> {}

/**
 * Check if .claude.json exists and is readable
 */
export interface CheckClaudeConfigRequest {
  // No parameters needed
}

export interface CheckClaudeConfigResponse
  extends IPCResponse<{
    exists: boolean;
    path: string;
    readable: boolean;
    projectCount: number;
  }> {}

/**
 * Read raw .claude.json content (for debugging/advanced users)
 */
export interface ReadClaudeConfigRequest {
  // No parameters needed
}

export interface ReadClaudeConfigResponse
  extends IPCResponse<{
    config: ClaudeConfig;
    path: string;
  }> {}
