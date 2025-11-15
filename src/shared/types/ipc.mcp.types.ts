/**
 * IPC type definitions for MCP (Model Context Protocol) server management
 */

import type {
  MCPServer,
  MCPScope,
  MCPTransport,
  MCPServerConfig,
  MCPConnectionTestResult,
  MCPConnectionTestStep,
  AddMCPServerRequest,
  AddMCPServerResponse,
  RemoveMCPServerRequest,
  RemoveMCPServerResponse,
  ListMCPServersRequest,
  ListMCPServersResponse,
  GetMCPServerRequest,
  GetMCPServerResponse,
} from './mcp.types';

// Re-export MCP types for IPC usage
export type {
  MCPServer,
  MCPScope,
  MCPTransport,
  MCPServerConfig,
  MCPConnectionTestResult,
  MCPConnectionTestStep,
  AddMCPServerRequest,
  AddMCPServerResponse,
  RemoveMCPServerRequest,
  RemoveMCPServerResponse,
  ListMCPServersRequest,
  ListMCPServersResponse,
  GetMCPServerRequest,
  GetMCPServerResponse,
};
