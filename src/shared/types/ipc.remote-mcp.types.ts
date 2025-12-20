/**
 * IPC type definitions for Remote MCP Server Discovery
 *
 * @see ADR-010: Remote MCP Servers Discovery & Connection Verification
 */

import type {
  RemoteMCPServer,
  RemoteMCPCategory,
  RemoteMCPAuthType,
  ConnectionTestResult,
  SecurityContext,
  RemoteServerFilters,
  DirectoryCacheStatus,
} from './remote-mcp.types';

/**
 * IPC channels for remote MCP operations
 */
export const REMOTE_MCP_CHANNELS = {
  /** Fetch the server directory */
  FETCH_DIRECTORY: 'remote-mcp:fetch-directory',
  /** Search/filter servers */
  SEARCH_SERVERS: 'remote-mcp:search',
  /** Get details for a specific server */
  GET_SERVER_DETAILS: 'remote-mcp:get-details',

  /** Test connection to a remote server */
  TEST_CONNECTION: 'remote-mcp:test-connection',
  /** Test connections to multiple servers */
  TEST_ALL_CONNECTIONS: 'remote-mcp:test-all',

  /** Add a remote server to Claude Code */
  ADD_REMOTE_SERVER: 'remote-mcp:add',

  /** Force refresh the directory cache */
  REFRESH_DIRECTORY: 'remote-mcp:refresh',
  /** Get cache status */
  GET_CACHE_STATUS: 'remote-mcp:cache-status',
} as const;

// ============================================================================
// Request Types
// ============================================================================

/**
 * Request to fetch the server directory
 */
export interface FetchDirectoryRequest {
  /** Optional filters to apply */
  filters?: RemoteServerFilters;
  /** Force refresh from source (ignore cache) */
  forceRefresh?: boolean;
}

/**
 * Request to search servers
 */
export interface SearchServersRequest {
  /** Search query */
  query: string;
  /** Optional category filter */
  category?: RemoteMCPCategory | 'all';
  /** Optional auth type filter */
  authType?: RemoteMCPAuthType | 'all';
  /** Maximum results to return */
  limit?: number;
}

/**
 * Request to get server details
 */
export interface GetServerDetailsRequest {
  /** Server ID */
  serverId: string;
}

/**
 * Request to test a remote server connection
 */
export interface TestConnectionRequest {
  /** Server URL to test */
  url: string;
  /** Transport type */
  transport: 'http' | 'sse';
  /** Optional timeout in milliseconds (default: 10000) */
  timeout?: number;
}

/**
 * Request to test multiple server connections
 */
export interface TestAllConnectionsRequest {
  /** List of server IDs to test */
  serverIds: string[];
  /** Maximum concurrent tests */
  concurrency?: number;
}

/**
 * Request to add a remote server to Claude Code
 */
export interface AddRemoteServerRequest {
  /** The server to add */
  server: RemoteMCPServer;
  /** Scope for the server */
  scope: 'user' | 'project';
  /** Project path (required if scope is 'project') */
  projectPath?: string;
  /** Custom name override */
  customName?: string;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Response from fetching the server directory
 */
export interface FetchDirectoryResponse {
  /** Whether the operation succeeded */
  success: boolean;
  /** List of servers */
  servers: RemoteMCPServer[];
  /** Whether data came from cache or live fetch */
  source: 'live' | 'cache';
  /** ISO date when data was last updated */
  lastUpdated: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Response from searching servers
 */
export interface SearchServersResponse {
  /** Whether the operation succeeded */
  success: boolean;
  /** Matching servers */
  servers: RemoteMCPServer[];
  /** Total count (may be more than returned if limit applied) */
  totalCount: number;
  /** Error message if failed */
  error?: string;
}

/**
 * Response from getting server details
 */
export interface GetServerDetailsResponse {
  /** Whether the operation succeeded */
  success: boolean;
  /** Server details */
  server?: RemoteMCPServer;
  /** Security context for the server */
  securityContext?: SecurityContext;
  /** Error message if failed */
  error?: string;
}

/**
 * Response from testing a connection
 */
export interface TestConnectionResponse {
  /** Whether the operation succeeded */
  success: boolean;
  /** Connection test result */
  result: ConnectionTestResult;
  /** Security context based on test */
  securityContext?: SecurityContext;
  /** Error message if operation failed */
  error?: string;
}

/**
 * Progress update for batch connection tests
 */
export interface TestAllConnectionsProgress {
  /** Server ID being tested */
  serverId: string;
  /** Current progress (0-100) */
  progress: number;
  /** Number of servers completed */
  completed: number;
  /** Total number of servers */
  total: number;
}

/**
 * Result for a single server in batch test
 */
export interface BatchTestResult {
  /** Server ID */
  serverId: string;
  /** Connection test result */
  result: ConnectionTestResult;
}

/**
 * Response from testing all connections
 */
export interface TestAllConnectionsResponse {
  /** Whether the operation succeeded */
  success: boolean;
  /** Results for each server */
  results: BatchTestResult[];
  /** Number of successful tests */
  successCount: number;
  /** Number of failed tests */
  failedCount: number;
  /** Total time taken in milliseconds */
  totalTimeMs: number;
  /** Error message if operation failed */
  error?: string;
}

/**
 * Response from adding a remote server
 */
export interface AddRemoteServerResponse {
  /** Whether the operation succeeded */
  success: boolean;
  /** Success message */
  message?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Response from refreshing the directory
 */
export interface RefreshDirectoryResponse {
  /** Whether the operation succeeded */
  success: boolean;
  /** Number of servers in refreshed directory */
  serverCount: number;
  /** ISO date of refresh */
  refreshedAt: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Response from getting cache status
 */
export interface GetCacheStatusResponse {
  /** Whether the operation succeeded */
  success: boolean;
  /** Cache status */
  cacheStatus: DirectoryCacheStatus;
  /** Error message if failed */
  error?: string;
}

// Re-export types for convenience
export type {
  RemoteMCPServer,
  RemoteMCPCategory,
  RemoteMCPAuthType,
  ConnectionTestResult,
  SecurityContext,
  RemoteServerFilters,
  DirectoryCacheStatus,
} from './remote-mcp.types';
