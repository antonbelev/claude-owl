/**
 * IPC handlers for Remote MCP Server Discovery
 *
 * @see ADR-010: Remote MCP Servers Discovery & Connection Verification
 */

import { ipcMain } from 'electron';
import {
  REMOTE_MCP_CHANNELS,
  type FetchDirectoryRequest,
  type FetchDirectoryResponse,
  type SearchServersRequest,
  type SearchServersResponse,
  type GetServerDetailsRequest,
  type GetServerDetailsResponse,
  type TestConnectionRequest,
  type TestConnectionResponse,
  type TestAllConnectionsRequest,
  type TestAllConnectionsResponse,
  type AddRemoteServerRequest,
  type AddRemoteServerResponse,
  type RefreshDirectoryResponse,
  type GetCacheStatusResponse,
  type BatchTestResult,
  type CheckAuthStatusRequest,
  type CheckAuthStatusResponse,
  type LaunchOAuthFlowRequest,
  type LaunchOAuthFlowResponse,
  type ConfigureApiKeyRequest,
  type ConfigureApiKeyResponse,
  type DiscoverAuthRequest,
  type DiscoverAuthResponse,
} from '@/shared/types';
import { RemoteMCPRegistryService } from '../services/RemoteMCPRegistryService';
import { SecurityAssessmentService } from '../services/SecurityAssessmentService';
import { ClaudeService } from '../services/ClaudeService';
import { AuthDiscoveryService } from '../services/AuthDiscoveryService';

const registryService = new RemoteMCPRegistryService();
const securityService = new SecurityAssessmentService();
const claudeService = new ClaudeService();
const authDiscoveryService = new AuthDiscoveryService();

/**
 * Register all Remote MCP IPC handlers
 */
export function registerRemoteMCPHandlers(): void {
  console.log('[RemoteMCPHandlers] Registering Remote MCP IPC handlers');

  // Fetch directory
  ipcMain.handle(
    REMOTE_MCP_CHANNELS.FETCH_DIRECTORY,
    async (_, request?: FetchDirectoryRequest): Promise<FetchDirectoryResponse> => {
      console.log('[RemoteMCPHandlers] Fetch directory request:', request);

      try {
        const result = await registryService.fetchServerDirectory(request?.forceRefresh);

        // Apply filters if provided
        let servers = result.servers;
        if (request?.filters) {
          servers = await registryService.searchServers(request.filters);
        }

        console.log('[RemoteMCPHandlers] Fetch directory result:', {
          serverCount: servers.length,
          source: result.source,
        });

        return {
          success: true,
          servers,
          source: result.source,
          lastUpdated: result.lastUpdated,
        };
      } catch (error) {
        console.error('[RemoteMCPHandlers] Fetch directory error:', error);
        return {
          success: false,
          servers: [],
          source: 'cache',
          lastUpdated: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Failed to fetch directory',
        };
      }
    }
  );

  // Search servers
  ipcMain.handle(
    REMOTE_MCP_CHANNELS.SEARCH_SERVERS,
    async (_, request: SearchServersRequest): Promise<SearchServersResponse> => {
      console.log('[RemoteMCPHandlers] Search servers request:', request);

      try {
        const filters: import('@/shared/types').RemoteServerFilters = {
          search: request.query,
        };
        if (request.category) {
          filters.category = request.category;
        }
        if (request.authType) {
          filters.authType = request.authType;
        }
        const servers = await registryService.searchServers(filters);

        // Apply limit if specified
        const limitedServers = request.limit ? servers.slice(0, request.limit) : servers;

        console.log('[RemoteMCPHandlers] Search servers result:', {
          totalCount: servers.length,
          returnedCount: limitedServers.length,
        });

        return {
          success: true,
          servers: limitedServers,
          totalCount: servers.length,
        };
      } catch (error) {
        console.error('[RemoteMCPHandlers] Search servers error:', error);
        return {
          success: false,
          servers: [],
          totalCount: 0,
          error: error instanceof Error ? error.message : 'Failed to search servers',
        };
      }
    }
  );

  // Get server details
  ipcMain.handle(
    REMOTE_MCP_CHANNELS.GET_SERVER_DETAILS,
    async (_, request: GetServerDetailsRequest): Promise<GetServerDetailsResponse> => {
      console.log('[RemoteMCPHandlers] Get server details request:', request.serverId);

      try {
        const server = await registryService.getServerDetails(request.serverId);

        if (!server) {
          return {
            success: false,
            error: `Server not found: ${request.serverId}`,
          };
        }

        const securityContext = securityService.assessRemoteServer(server);

        console.log('[RemoteMCPHandlers] Get server details result:', {
          serverId: server.id,
          riskLevel: securityContext.riskLevel,
        });

        return {
          success: true,
          server,
          securityContext,
        };
      } catch (error) {
        console.error('[RemoteMCPHandlers] Get server details error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get server details',
        };
      }
    }
  );

  // Test connection
  ipcMain.handle(
    REMOTE_MCP_CHANNELS.TEST_CONNECTION,
    async (_, request: TestConnectionRequest): Promise<TestConnectionResponse> => {
      console.log('[RemoteMCPHandlers] Test connection request:', {
        url: request.url,
        transport: request.transport,
      });

      try {
        const result = await registryService.testRemoteConnection(
          request.url,
          request.transport,
          request.timeout
        );

        console.log('[RemoteMCPHandlers] Test connection result:', {
          success: result.success,
          latencyMs: result.latencyMs,
        });

        return {
          success: true,
          result,
        };
      } catch (error) {
        console.error('[RemoteMCPHandlers] Test connection error:', error);
        return {
          success: false,
          result: {
            success: false,
            error: error instanceof Error ? error.message : 'Connection test failed',
            errorCode: 'NETWORK_ERROR',
          },
          error: error instanceof Error ? error.message : 'Connection test failed',
        };
      }
    }
  );

  // Test all connections
  ipcMain.handle(
    REMOTE_MCP_CHANNELS.TEST_ALL_CONNECTIONS,
    async (_, request: TestAllConnectionsRequest): Promise<TestAllConnectionsResponse> => {
      console.log('[RemoteMCPHandlers] Test all connections request:', {
        serverCount: request.serverIds.length,
      });

      const startTime = Date.now();
      const results: BatchTestResult[] = [];
      let successCount = 0;
      let failedCount = 0;

      try {
        // Limit concurrency
        const concurrency = request.concurrency || 5;
        const serverIds = request.serverIds;

        // Process in batches
        for (let i = 0; i < serverIds.length; i += concurrency) {
          const batch = serverIds.slice(i, i + concurrency);

          const batchPromises = batch.map(async serverId => {
            const server = await registryService.getServerDetails(serverId);
            if (!server) {
              return {
                serverId,
                result: {
                  success: false,
                  error: 'Server not found',
                  errorCode: 'NOT_MCP_SERVER' as const,
                },
              };
            }

            const result = await registryService.testRemoteConnection(
              server.endpoint,
              server.transport
            );

            return { serverId, result };
          });

          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults);

          batchResults.forEach(r => {
            if (r.result.success) {
              successCount++;
            } else {
              failedCount++;
            }
          });
        }

        const totalTimeMs = Date.now() - startTime;

        console.log('[RemoteMCPHandlers] Test all connections result:', {
          total: results.length,
          successCount,
          failedCount,
          totalTimeMs,
        });

        return {
          success: true,
          results,
          successCount,
          failedCount,
          totalTimeMs,
        };
      } catch (error) {
        console.error('[RemoteMCPHandlers] Test all connections error:', error);
        return {
          success: false,
          results,
          successCount,
          failedCount,
          totalTimeMs: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Batch test failed',
        };
      }
    }
  );

  // Add remote server
  ipcMain.handle(
    REMOTE_MCP_CHANNELS.ADD_REMOTE_SERVER,
    async (_, request: AddRemoteServerRequest): Promise<AddRemoteServerResponse> => {
      console.log('[RemoteMCPHandlers] Add remote server request:', {
        serverId: request.server.id,
        scope: request.scope,
        projectPath: request.projectPath,
      });

      try {
        // Use ClaudeService to add the server via CLI
        const serverName = request.customName || request.server.id;

        const addOptions: import('@/shared/types').MCPAddOptions = {
          name: serverName,
          transport: request.server.transport,
          scope: request.scope,
          url: request.server.endpoint,
        };

        // Only include projectPath if it's defined
        if (request.projectPath) {
          addOptions.projectPath = request.projectPath;
        }

        const result = await claudeService.addMCPServer(addOptions);

        console.log('[RemoteMCPHandlers] Add remote server result:', {
          success: result.success,
          message: result.message,
        });

        const response: AddRemoteServerResponse = {
          success: result.success,
          message: result.message || `Successfully added ${request.server.name}`,
        };
        if (result.error) {
          response.error = result.error;
        }
        return response;
      } catch (error) {
        console.error('[RemoteMCPHandlers] Add remote server error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to add remote server',
        };
      }
    }
  );

  // Refresh directory
  ipcMain.handle(
    REMOTE_MCP_CHANNELS.REFRESH_DIRECTORY,
    async (): Promise<RefreshDirectoryResponse> => {
      console.log('[RemoteMCPHandlers] Refresh directory request');

      try {
        const result = await registryService.fetchServerDirectory(true);

        console.log('[RemoteMCPHandlers] Refresh directory result:', {
          serverCount: result.servers.length,
        });

        return {
          success: true,
          serverCount: result.servers.length,
          refreshedAt: result.lastUpdated,
        };
      } catch (error) {
        console.error('[RemoteMCPHandlers] Refresh directory error:', error);
        return {
          success: false,
          serverCount: 0,
          refreshedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Failed to refresh directory',
        };
      }
    }
  );

  // Get cache status
  ipcMain.handle(
    REMOTE_MCP_CHANNELS.GET_CACHE_STATUS,
    async (): Promise<GetCacheStatusResponse> => {
      console.log('[RemoteMCPHandlers] Get cache status request');

      try {
        const cacheStatus = await registryService.getCacheStatus();

        console.log('[RemoteMCPHandlers] Get cache status result:', cacheStatus);

        return {
          success: true,
          cacheStatus,
        };
      } catch (error) {
        console.error('[RemoteMCPHandlers] Get cache status error:', error);
        return {
          success: false,
          cacheStatus: {
            isCached: false,
            isStale: true,
            serverCount: 0,
          },
          error: error instanceof Error ? error.message : 'Failed to get cache status',
        };
      }
    }
  );

  // ============================================================================
  // Authentication Handlers
  // ============================================================================

  // Check authentication status
  ipcMain.handle(
    REMOTE_MCP_CHANNELS.CHECK_AUTH_STATUS,
    async (_, request: CheckAuthStatusRequest): Promise<CheckAuthStatusResponse> => {
      console.log('[RemoteMCPHandlers] Check auth status request:', request.serverName);

      try {
        const result = await claudeService.checkMCPAuthStatus(request.serverName);

        console.log('[RemoteMCPHandlers] Check auth status result:', result);

        const response: CheckAuthStatusResponse = {
          success: true,
          authStatus: result.authStatus,
          isInstalled: result.isInstalled,
        };
        if (result.configLocation) {
          response.configLocation = result.configLocation;
        }
        return response;
      } catch (error) {
        console.error('[RemoteMCPHandlers] Check auth status error:', error);
        return {
          success: false,
          authStatus: 'unknown',
          isInstalled: false,
          error: error instanceof Error ? error.message : 'Failed to check auth status',
        };
      }
    }
  );

  // Launch OAuth flow (adds server and triggers OAuth)
  ipcMain.handle(
    REMOTE_MCP_CHANNELS.LAUNCH_OAUTH_FLOW,
    async (_, request: LaunchOAuthFlowRequest): Promise<LaunchOAuthFlowResponse> => {
      console.log('[RemoteMCPHandlers] Launch OAuth flow request:', {
        serverName: request.serverName,
        serverUrl: request.serverUrl,
        transport: request.transport,
        projectPath: request.projectPath,
      });

      try {
        const result = await claudeService.launchOAuthFlow(
          request.serverName,
          request.projectPath,
          request.serverUrl,
          request.transport
        );

        console.log('[RemoteMCPHandlers] Launch OAuth flow result:', result);

        return result;
      } catch (error) {
        console.error('[RemoteMCPHandlers] Launch OAuth flow error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to launch OAuth flow',
        };
      }
    }
  );

  // Configure API key authentication
  ipcMain.handle(
    REMOTE_MCP_CHANNELS.CONFIGURE_API_KEY,
    async (_, request: ConfigureApiKeyRequest): Promise<ConfigureApiKeyResponse> => {
      console.log('[RemoteMCPHandlers] Configure API key request:', {
        serverName: request.server.name,
        scope: request.scope,
        projectPath: request.projectPath,
      });

      try {
        // Validate credentials
        if (!request.credentials.envVarName || !request.credentials.apiKeyValue) {
          return {
            success: false,
            error: 'Environment variable name and API key value are required',
          };
        }

        // Add the server with API key authentication
        const addOptions: {
          name: string;
          url: string;
          transport: 'http' | 'sse';
          scope: 'user' | 'project';
          projectPath?: string;
          envVarName: string;
          apiKeyValue: string;
          headerName?: string;
        } = {
          name: request.server.id,
          url: request.server.endpoint,
          transport: request.server.transport,
          scope: request.scope,
          envVarName: request.credentials.envVarName,
          apiKeyValue: request.credentials.apiKeyValue,
        };

        if (request.projectPath) {
          addOptions.projectPath = request.projectPath;
        }
        if (request.server.authConfig?.apiKeyHeader) {
          addOptions.headerName = request.server.authConfig.apiKeyHeader;
        }

        const result = await claudeService.addMCPServerWithApiKey(addOptions);

        console.log('[RemoteMCPHandlers] Configure API key result:', result);

        const response: ConfigureApiKeyResponse = {
          success: result.success,
        };
        if (result.message) {
          response.message = result.message;
        }
        if (result.error) {
          response.error = result.error;
        }
        return response;
      } catch (error) {
        console.error('[RemoteMCPHandlers] Configure API key error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to configure API key',
        };
      }
    }
  );

  // ============================================================================
  // Auth Discovery Handler
  // ============================================================================

  // Discover authentication requirements for a server
  ipcMain.handle(
    REMOTE_MCP_CHANNELS.DISCOVER_AUTH,
    async (_, request: DiscoverAuthRequest): Promise<DiscoverAuthResponse> => {
      console.log('[RemoteMCPHandlers] Discover auth request:', request.endpoint);

      try {
        const result = await authDiscoveryService.discoverAuth(request.endpoint);

        console.log('[RemoteMCPHandlers] Discover auth result:', {
          endpoint: result.endpoint,
          requiresAuth: result.requiresAuth,
          authType: result.authType,
          supportsDCR: result.supportsDCR,
        });

        return result;
      } catch (error) {
        console.error('[RemoteMCPHandlers] Discover auth error:', error);
        return {
          success: false,
          endpoint: request.endpoint,
          requiresAuth: false,
          authType: 'unknown',
          supportsDCR: false,
          error: error instanceof Error ? error.message : 'Failed to discover auth requirements',
        };
      }
    }
  );

  console.log('[RemoteMCPHandlers] Remote MCP IPC handlers registered successfully');
}
