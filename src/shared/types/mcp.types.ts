/**
 * MCP (Model Context Protocol) Types and Interfaces
 *
 * Defines all types related to MCP server configuration, management, and testing
 */

/**
 * MCP Server Configuration
 * Supports stdio, HTTP, and SSE transports
 *
 * NOTE: Claude Owl is a standalone desktop app with no project context.
 * Only 'user' scope is supported for global MCP servers available to all projects.
 */
export interface MCPServerConfig {
  name: string;
  transport: 'stdio' | 'http' | 'sse';
  scope: 'user';

  // Stdio-specific fields
  command?: string | undefined;
  args?: string[] | undefined;
  env?: Record<string, string> | undefined;
  workingDirectory?: string | undefined;

  // HTTP-specific fields
  url?: string | undefined;
  headers?: Record<string, string> | undefined;

  // Common fields
  description?: string | undefined;
  tags?: string[] | undefined;
}

/**
 * MCP Server Status
 */
export type MCPServerStatus = 'connected' | 'error' | 'auth-required' | 'disabled' | 'testing';

/**
 * MCP Server with metadata
 */
export interface MCPServer extends MCPServerConfig {
  filePath: string;
  status: MCPServerStatus;
  lastError?: string | undefined;
  latency?: number | undefined;
  tools?: MCPTool[] | undefined;
  resources?: MCPResource[] | undefined;
  prompts?: MCPPrompt[] | undefined;
}

/**
 * MCP Tool definition
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * MCP Resource
 */
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/**
 * MCP Prompt
 */
export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

/**
 * Connection test result
 */
export interface MCPConnectionTestResult {
  success: boolean;
  steps: MCPConnectionTestStep[];
  error?: string | undefined;
  tools?: MCPTool[] | undefined;
  latency?: number | undefined;
  logs?: string[] | undefined;
}

export interface MCPConnectionTestStep {
  name: string;
  status: 'success' | 'error' | 'pending';
  message?: string | undefined;
  details?: string | undefined;
}

/**
 * Environment variable for MCP servers
 */
export interface MCPEnvironmentVariable {
  name: string;
  value: string;
  scope: 'user' | 'project';
  isSecret?: boolean | undefined;
}

/**
 * MCP Server template for marketplace
 */
export interface MCPServerTemplate {
  id: string;
  name: string;
  description: string;
  author: string;
  category: 'essential' | 'web' | 'automation' | 'data' | 'ai' | 'file-systems' | 'apis';
  transport: 'stdio' | 'http' | 'sse';

  // Pre-configured settings
  command?: string;
  args?: string[];
  url?: string;

  // Requirements
  requirements?: {
    nodeVersion?: string;
    apiKey?: boolean;
    apiKeyName?: string;
    apiKeyUrl?: string;
  };

  // Metadata
  verified: boolean;
  installs?: number;
  rating?: number;
  tags?: string[];
  documentation?: string;
}

/**
 * Server marketplace
 */
export interface MCPMarketplace {
  name: string;
  url: string;
  type: 'official' | 'community' | 'custom';
}

/**
 * Validation error for MCP configuration
 */
export interface MCPValidationError {
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Platform-specific configuration hints
 */
export interface MCPPlatformHints {
  isWindows: boolean;
  hasNpx: boolean;
  nodeVersion?: string;
}
