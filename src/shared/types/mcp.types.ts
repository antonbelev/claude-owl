/**
 * MCP (Model Context Protocol) Types
 *
 * Type definitions for MCP server management via `claude mcp` CLI commands.
 */

/**
 * MCP transport types supported by Claude Code
 */
export type MCPTransport = 'stdio' | 'http' | 'sse';

/**
 * MCP configuration scopes
 * - user: Global user-level config (~/.claude.json)
 * - project: Project-level config (.claude/settings.json)
 * - local: Local overrides (.claude/settings.local.json)
 */
export type MCPScope = 'user' | 'project' | 'local';

/**
 * Options for adding a new MCP server
 */
export interface MCPAddOptions {
  name: string;
  transport: MCPTransport;
  scope: MCPScope;
  // For stdio transport
  command?: string;
  args?: string[];
  // For HTTP/SSE transports
  url?: string;
  // Optional for all transports
  env?: Record<string, string>;
  headers?: Record<string, string>;
}

/**
 * MCP Server configuration (alias for MCPAddOptions)
 */
export type MCPServerConfig = MCPAddOptions;

/**
 * Step in an MCP connection test
 */
export interface MCPConnectionTestStep {
  name: string;
  status: 'success' | 'error' | 'pending';
  message?: string;
  details?: string;
}

/**
 * Result from testing an MCP server connection
 */
export interface MCPConnectionTestResult {
  success: boolean;
  steps: MCPConnectionTestStep[];
  error?: string;
  latency?: number;
  tools?: unknown[];
  logs?: string[];
}

/**
 * MCP Server configuration returned by `claude mcp list`
 */
export interface MCPServer {
  name: string;
  transport: MCPTransport;
  scope?: MCPScope;
  // For stdio transport
  command?: string;
  args?: string[];
  // For HTTP/SSE transports
  url?: string;
  // Optional metadata
  env?: Record<string, string>;
  headers?: Record<string, string>;
  // Status information (if available from CLI)
  status?: 'connected' | 'error' | 'unknown' | 'testing' | 'disabled' | 'auth-required';
  // Project path (only for project-scoped servers)
  projectPath?: string;
  // Additional optional properties
  description?: string;
  tools?: unknown[];
  lastError?: string;
  latency?: number;
}

/**
 * Result from MCP CLI command execution
 */
export interface MCPCommandResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
}

/**
 * Request to add an MCP server
 */
export interface AddMCPServerRequest {
  name: string;
  transport: MCPTransport;
  scope: MCPScope;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  headers?: Record<string, string>;
}

/**
 * Response from adding an MCP server
 */
export interface AddMCPServerResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Request to remove an MCP server
 */
export interface RemoveMCPServerRequest {
  name: string;
  scope: MCPScope;
}

/**
 * Response from removing an MCP server
 */
export interface RemoveMCPServerResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Request to list MCP servers
 */
export interface ListMCPServersRequest {
  scope?: MCPScope;
}

/**
 * Response from listing MCP servers
 */
export interface ListMCPServersResponse {
  success: boolean;
  servers?: MCPServer[];
  error?: string;
}

/**
 * Request to get a specific MCP server
 */
export interface GetMCPServerRequest {
  name: string;
}

/**
 * Response from getting a specific MCP server
 */
export interface GetMCPServerResponse {
  success: boolean;
  server?: MCPServer;
  error?: string;
}
