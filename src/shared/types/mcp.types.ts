/**
 * MCP (Model Context Protocol) Types and Interfaces
 *
 * Defines all types related to MCP server configuration, management, and testing
 */

/**
 * MCP Server Configuration
 * Supports stdio, HTTP, and SSE transports
 */
export interface MCPServerConfig {
  name: string;
  transport: 'stdio' | 'http' | 'sse';
  scope: 'user' | 'project' | 'local';

  // Stdio-specific fields
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  workingDirectory?: string;

  // HTTP-specific fields
  url?: string;
  headers?: Record<string, string>;

  // Common fields
  description?: string;
  tags?: string[];
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
  lastError?: string;
  latency?: number;
  tools?: MCPTool[];
  resources?: MCPResource[];
  prompts?: MCPPrompt[];
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
  error?: string;
  tools?: MCPTool[];
  latency?: number;
  logs?: string[];
}

export interface MCPConnectionTestStep {
  name: string;
  status: 'success' | 'error' | 'pending';
  message?: string;
  details?: string;
}

/**
 * Environment variable for MCP servers
 */
export interface MCPEnvironmentVariable {
  name: string;
  value: string;
  scope: 'user' | 'project';
  isSecret?: boolean;
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
