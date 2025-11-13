/**
 * IPC (Inter-Process Communication) types for MCP operations
 */

import type { MCPServer, MCPConnectionTestResult, MCPServerTemplate } from './mcp.types';
import type { IPCResponse } from './ipc.common.types';

/**
 * List all MCP servers
 */
export interface ListMCPServersResponse extends IPCResponse<MCPServer[]> {}

/**
 * Get a specific MCP server
 */
export interface GetMCPServerRequest {
  name: string;
}

export interface GetMCPServerResponse extends IPCResponse<MCPServer> {}

/**
 * Add a new MCP server
 */
export interface AddMCPServerRequest {
  name: string;
  transport: 'stdio' | 'http' | 'sse';
  scope: 'user' | 'project' | 'local';

  // Stdio config
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  workingDirectory?: string;

  // HTTP config
  url?: string;
  headers?: Record<string, string>;
}

export interface AddMCPServerResponse extends IPCResponse<MCPServer> {}

/**
 * Update an existing MCP server
 */
export interface UpdateMCPServerRequest extends AddMCPServerRequest {
  oldName?: string; // If renaming the server
}

export interface UpdateMCPServerResponse extends IPCResponse<MCPServer> {}

/**
 * Remove an MCP server
 */
export interface RemoveMCPServerRequest {
  name: string;
  scope: 'user' | 'project' | 'local';
}

export interface RemoveMCPServerResponse extends IPCResponse<{ removed: boolean }> {}

/**
 * Test MCP server connection
 */
export interface TestMCPServerRequest {
  name: string;
  timeout?: number; // ms, default 10000
}

export interface TestMCPServerResponse extends IPCResponse<MCPConnectionTestResult> {}

/**
 * Get available tools from a server
 */
export interface GetMCPServerToolsRequest {
  name: string;
}

export interface GetMCPServerToolsResponse
  extends IPCResponse<{
    tools: Array<{ name: string; description: string }>;
    resources?: Array<{ uri: string; name: string }>;
    prompts?: Array<{ name: string; description?: string }>;
  }> {}

/**
 * Get MCP server templates for marketplace
 */
export interface GetMCPTemplatesResponse extends IPCResponse<MCPServerTemplate[]> {}

/**
 * Search MCP templates
 */
export interface SearchMCPTemplatesRequest {
  query?: string;
  category?: string;
}

export interface SearchMCPTemplatesResponse extends IPCResponse<MCPServerTemplate[]> {}

/**
 * Install server from template
 */
export interface InstallMCPFromTemplateRequest {
  templateId: string;
  name?: string; // Override template name if desired
  scope?: 'user' | 'project';
  envVars?: Record<string, string>;
}

export interface InstallMCPFromTemplateResponse extends IPCResponse<MCPServer> {}

/**
 * Validate MCP server configuration
 */
export interface ValidateMCPConfigRequest {
  name: string;
  config: Omit<AddMCPServerRequest, 'scope'>;
}

export interface ValidateMCPConfigResponse
  extends IPCResponse<{
    valid: boolean;
    errors?: Array<{ field: string; message: string; suggestion?: string }>;
    warnings?: Array<{ field: string; message: string }>;
  }> {}

/**
 * Get environment variables used by MCP servers
 */
export interface GetMCPEnvironmentVariablesResponse
  extends IPCResponse<
    Array<{
      name: string;
      scope: 'user' | 'project';
      isSecret: boolean;
      usedBy: string[]; // server names that use this var
    }>
  > {}

/**
 * Set environment variable for MCP
 */
export interface SetMCPEnvironmentVariableRequest {
  name: string;
  value: string;
  scope: 'user' | 'project';
  isSecret?: boolean;
}

export interface SetMCPEnvironmentVariableResponse extends IPCResponse<{ set: boolean }> {}

/**
 * Delete environment variable
 */
export interface DeleteMCPEnvironmentVariableRequest {
  name: string;
  scope: 'user' | 'project';
}

export interface DeleteMCPEnvironmentVariableResponse extends IPCResponse<{ deleted: boolean }> {}

/**
 * Test all MCP server connections
 */
export interface TestAllMCPServersRequest {
  timeout?: number;
}

export interface TestAllMCPServersResponse
  extends IPCResponse<{
    results: Record<string, MCPConnectionTestResult>;
    summary: {
      total: number;
      connected: number;
      failed: number;
    };
  }> {}

/**
 * Get platform hints for MCP setup
 */
export interface GetMCPPlatformHintsResponse
  extends IPCResponse<{
    isWindows: boolean;
    hasNpx: boolean;
    nodeVersion?: string;
  }> {}

/**
 * Enable/disable MCP server
 */
export interface ToggleMCPServerRequest {
  name: string;
  enabled: boolean;
}

export interface ToggleMCPServerResponse extends IPCResponse<MCPServer> {}
