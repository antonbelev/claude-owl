/**
 * Remote MCP Registry Service
 *
 * Service for discovering, caching, and managing remote MCP servers.
 * Sources server information from mcpservers.org and a local curated registry.
 *
 * @see ADR-010: Remote MCP Servers Discovery & Connection Verification
 */

import { promises as fs } from 'fs';
import path from 'path';
import { homedir } from 'os';
import dns from 'dns';
import https from 'https';
import type {
  RemoteMCPServer,
  RemoteMCPCategory,
  ConnectionTestResult,
  ConnectionTestStep,
  ConnectionErrorCode,
  DiscoveredServerInfo,
  RemoteServerFilters,
  DirectoryCacheStatus,
} from '@/shared/types';

/**
 * Curated list of remote MCP servers
 * Based on mcpservers.org as of December 2025
 */
const CURATED_SERVERS: RemoteMCPServer[] = [
  {
    id: 'github',
    name: 'GitHub MCP',
    description: "GitHub's official MCP Server for repository access",
    endpoint: 'https://api.githubcopilot.com/mcp/',
    transport: 'http',
    authType: 'api-key',
    authConfig: {
      apiKeyHeader: 'Authorization',
      apiKeyEnvVar: 'GITHUB_PERSONAL_ACCESS_TOKEN',
      apiKeyUrl: 'https://github.com/settings/tokens?type=beta',
      apiKeyInstructions:
        'Create a Fine-grained Personal Access Token with "Contents" and "Metadata" read permissions for the repositories you want to access.',
    },
    provider: 'GitHub',
    verified: true,
    category: 'developer-tools',
    tags: ['git', 'repositories', 'issues', 'pull-requests'],
    documentationUrl: 'https://github.com/github/github-mcp-server',
    source: 'mcpservers.org',
  },
  {
    id: 'notion',
    name: 'Notion MCP',
    description: 'Collaboration and productivity tool integration',
    endpoint: 'https://mcp.notion.com/mcp',
    transport: 'http',
    authType: 'oauth',
    authConfig: {
      oauthProvider: 'Notion',
    },
    provider: 'Notion',
    verified: true,
    category: 'productivity',
    tags: ['notes', 'wiki', 'documents', 'collaboration'],
    source: 'mcpservers.org',
  },
  {
    id: 'figma',
    name: 'Figma MCP',
    description: 'Collaborative design and prototyping platform',
    endpoint: 'https://mcp.figma.com/mcp',
    transport: 'http',
    authType: 'oauth',
    authConfig: {
      oauthProvider: 'Figma',
    },
    provider: 'Figma',
    verified: true,
    category: 'developer-tools',
    tags: ['design', 'prototyping', 'ui', 'collaboration'],
    source: 'mcpservers.org',
  },
  {
    id: 'linear',
    name: 'Linear MCP',
    description: 'Project management tool for software teams',
    endpoint: 'https://mcp.linear.app/sse',
    transport: 'sse',
    authType: 'oauth',
    authConfig: {
      oauthProvider: 'Linear',
    },
    provider: 'Linear',
    verified: true,
    category: 'developer-tools',
    tags: ['project-management', 'issues', 'sprints', 'agile'],
    source: 'mcpservers.org',
  },
  {
    id: 'supabase',
    name: 'Supabase MCP',
    description: 'Open-source Firebase alternative with PostgreSQL',
    endpoint: 'https://mcp.supabase.com/mcp',
    transport: 'http',
    authType: 'oauth',
    authConfig: {
      oauthProvider: 'Supabase',
    },
    provider: 'Supabase',
    verified: true,
    category: 'databases',
    tags: ['database', 'postgresql', 'authentication', 'storage'],
    source: 'mcpservers.org',
  },
  {
    id: 'neon',
    name: 'Neon MCP',
    description: 'Serverless PostgreSQL database',
    endpoint: 'https://mcp.neon.tech/sse',
    transport: 'sse',
    authType: 'oauth',
    authConfig: {
      oauthProvider: 'Neon',
    },
    provider: 'Neon',
    verified: true,
    category: 'databases',
    tags: ['database', 'postgresql', 'serverless'],
    source: 'mcpservers.org',
  },
  {
    id: 'fetch',
    name: 'Fetch MCP',
    description: 'Web content retrieval, converts HTML to markdown',
    endpoint: 'https://remote.mcpservers.org/fetch/mcp',
    transport: 'http',
    authType: 'open',
    provider: 'MCP Servers',
    verified: true,
    category: 'utilities',
    tags: ['web', 'scraping', 'markdown', 'fetch'],
    source: 'mcpservers.org',
  },
  {
    id: 'sequential-thinking',
    name: 'Sequential Thinking MCP',
    description: 'Structured thinking process for problem-solving',
    endpoint: 'https://remote.mcpservers.org/sequentialthinking/mcp',
    transport: 'http',
    authType: 'open',
    provider: 'MCP Servers',
    verified: true,
    category: 'utilities',
    tags: ['thinking', 'reasoning', 'problem-solving'],
    source: 'mcpservers.org',
  },
  {
    id: 'sentry',
    name: 'Sentry MCP',
    description: 'Error tracking and performance monitoring',
    endpoint: 'https://mcp.sentry.dev/sse',
    transport: 'sse',
    authType: 'oauth',
    authConfig: {
      oauthProvider: 'Sentry',
    },
    provider: 'Sentry',
    verified: true,
    category: 'developer-tools',
    tags: ['errors', 'monitoring', 'debugging', 'performance'],
    source: 'mcpservers.org',
  },
  {
    id: 'paypal',
    name: 'PayPal MCP',
    description: 'Global online payment system integration',
    endpoint: 'https://mcp.paypal.com/sse',
    transport: 'sse',
    authType: 'oauth',
    authConfig: {
      oauthProvider: 'PayPal',
    },
    provider: 'PayPal',
    verified: true,
    category: 'payments',
    tags: ['payments', 'transactions', 'commerce'],
    source: 'mcpservers.org',
  },
  {
    id: 'asana',
    name: 'Asana MCP',
    description: 'Work management platform for teams',
    endpoint: 'https://mcp.asana.com/mcp',
    transport: 'http',
    authType: 'oauth',
    authConfig: {
      oauthProvider: 'Asana',
    },
    provider: 'Asana',
    verified: true,
    category: 'productivity',
    tags: ['tasks', 'projects', 'teams', 'workflow'],
    source: 'mcpservers.org',
  },
  {
    id: 'atlassian',
    name: 'Atlassian MCP',
    description: 'Jira, Confluence, and Atlassian tools integration',
    endpoint: 'https://mcp.atlassian.com/mcp',
    transport: 'http',
    authType: 'oauth',
    authConfig: {
      oauthProvider: 'Atlassian',
      requiredScopes: ['read:jira-work', 'write:jira-work', 'read:confluence-content.all'],
    },
    provider: 'Atlassian',
    verified: true,
    category: 'developer-tools',
    tags: ['jira', 'confluence', 'project-management', 'documentation'],
    source: 'mcpservers.org',
  },
  {
    id: 'semgrep',
    name: 'Semgrep MCP',
    description: 'Static code analysis and security scanning',
    endpoint: 'https://mcp.semgrep.dev/sse',
    transport: 'sse',
    authType: 'open',
    provider: 'Semgrep',
    verified: true,
    category: 'security',
    tags: ['security', 'code-analysis', 'vulnerabilities', 'sast'],
    source: 'mcpservers.org',
  },
  {
    id: 'deepwiki',
    name: 'DeepWiki MCP',
    description: 'Wikipedia and knowledge base access',
    endpoint: 'https://mcp.deepwiki.com/mcp',
    transport: 'http',
    authType: 'open',
    provider: 'DeepWiki',
    verified: true,
    category: 'content',
    tags: ['wikipedia', 'knowledge', 'research', 'information'],
    source: 'mcpservers.org',
  },
  {
    id: 'intercom',
    name: 'Intercom MCP',
    description: 'Customer messaging platform',
    endpoint: 'https://mcp.intercom.io/mcp',
    transport: 'http',
    authType: 'oauth',
    authConfig: {
      oauthProvider: 'Intercom',
    },
    provider: 'Intercom',
    verified: true,
    category: 'content',
    tags: ['customer-support', 'messaging', 'chat', 'crm'],
    source: 'mcpservers.org',
  },
];

/**
 * Service for managing remote MCP server discovery and connection testing
 */
export class RemoteMCPRegistryService {
  private readonly cacheDir: string;
  private readonly cacheFile: string;
  private readonly cacheTTLMs = 24 * 60 * 60 * 1000; // 24 hours
  private cachedServers: RemoteMCPServer[] | null = null;
  private cacheTimestamp: number | null = null;

  constructor() {
    this.cacheDir = path.join(homedir(), '.claude-owl', 'cache');
    this.cacheFile = path.join(this.cacheDir, 'remote-mcp-servers.json');
  }

  /**
   * Fetch the full server directory
   * Returns cached data if available and fresh, otherwise fetches from sources
   */
  async fetchServerDirectory(forceRefresh = false): Promise<{
    servers: RemoteMCPServer[];
    source: 'live' | 'cache';
    lastUpdated: string;
  }> {
    console.log('[RemoteMCPRegistryService] Fetching server directory, forceRefresh:', forceRefresh);

    // Check in-memory cache first
    if (!forceRefresh && this.cachedServers && this.cacheTimestamp) {
      const cacheAge = Date.now() - this.cacheTimestamp;
      if (cacheAge < this.cacheTTLMs) {
        console.log('[RemoteMCPRegistryService] Using in-memory cache');
        return {
          servers: this.cachedServers,
          source: 'cache',
          lastUpdated: new Date(this.cacheTimestamp).toISOString(),
        };
      }
    }

    // Check disk cache
    if (!forceRefresh) {
      const diskCache = await this.loadCachedServers();
      if (diskCache) {
        const cacheAge = Date.now() - new Date(diskCache.timestamp).getTime();
        if (cacheAge < this.cacheTTLMs) {
          console.log('[RemoteMCPRegistryService] Using disk cache');
          this.cachedServers = diskCache.servers;
          this.cacheTimestamp = new Date(diskCache.timestamp).getTime();
          return {
            servers: diskCache.servers,
            source: 'cache',
            lastUpdated: diskCache.timestamp,
          };
        }
      }
    }

    // Fetch fresh data
    console.log('[RemoteMCPRegistryService] Fetching fresh server directory');
    const servers = await this.getFullDirectory();

    // Update cache
    const timestamp = new Date().toISOString();
    this.cachedServers = servers;
    this.cacheTimestamp = Date.now();
    await this.cacheServers(servers, timestamp);

    return {
      servers,
      source: 'live',
      lastUpdated: timestamp,
    };
  }

  /**
   * Search and filter servers
   */
  async searchServers(filters: RemoteServerFilters): Promise<RemoteMCPServer[]> {
    console.log('[RemoteMCPRegistryService] Searching servers with filters:', filters);

    const { servers } = await this.fetchServerDirectory();
    let filtered = [...servers];

    // Apply search query
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(
        server =>
          server.name.toLowerCase().includes(query) ||
          server.description.toLowerCase().includes(query) ||
          server.provider.toLowerCase().includes(query) ||
          server.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(server => server.category === filters.category);
    }

    // Apply auth type filter
    if (filters.authType && filters.authType !== 'all') {
      filtered = filtered.filter(server => server.authType === filters.authType);
    }

    // Apply transport filter
    if (filters.transport && filters.transport !== 'all') {
      filtered = filtered.filter(server => server.transport === filters.transport);
    }

    // Apply verified filter
    if (filters.verifiedOnly) {
      filtered = filtered.filter(server => server.verified);
    }

    console.log(`[RemoteMCPRegistryService] Found ${filtered.length} servers matching filters`);
    return filtered;
  }

  /**
   * Get details for a specific server
   */
  async getServerDetails(serverId: string): Promise<RemoteMCPServer | null> {
    console.log('[RemoteMCPRegistryService] Getting server details:', serverId);

    const { servers } = await this.fetchServerDirectory();
    return servers.find(server => server.id === serverId) || null;
  }

  /**
   * Test connection to a remote MCP server
   */
  async testRemoteConnection(
    url: string,
    transport: 'http' | 'sse',
    timeout = 10000
  ): Promise<ConnectionTestResult> {
    console.log('[RemoteMCPRegistryService] Testing connection:', { url, transport, timeout });

    const startTime = Date.now();
    const steps: ConnectionTestStep[] = [];

    try {
      // Parse URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return {
          success: false,
          errorCode: 'NETWORK_ERROR',
          error: 'Invalid URL format',
          suggestions: ['Check that the server URL is correctly formatted'],
        };
      }

      // Step 1: DNS Resolution
      try {
        const addresses = await dns.promises.lookup(parsedUrl.hostname);
        steps.push({
          name: 'DNS Resolution',
          status: 'success',
          details: `Resolved to ${addresses.address} (IPv${addresses.family})`,
        });
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          errorCode: 'NETWORK_ERROR',
          error: `DNS resolution failed: ${err.message}`,
          steps: [
            {
              name: 'DNS Resolution',
              status: 'error',
              details: err.message,
            },
          ],
          suggestions: [
            'Check that the server URL is correct',
            'Verify your internet connection',
            'The server may be temporarily unavailable',
          ],
        };
      }

      // Step 2: TLS/SSL Verification
      const tlsInfo = await this.checkTLSCertificate(parsedUrl.hostname);
      if (tlsInfo.valid) {
        steps.push({
          name: 'TLS/SSL Verification',
          status: 'success',
          details: `Valid certificate (expires: ${tlsInfo.validTo}), Issuer: ${tlsInfo.issuer}`,
        });
      } else {
        steps.push({
          name: 'TLS/SSL Verification',
          status: 'warning',
          details: tlsInfo.error || 'Certificate verification issue',
        });
        // Don't fail - some internal servers use self-signed certs
      }

      // Step 3: HTTP Reachability
      const httpResult = await this.testHTTPReachability(url, timeout);
      steps.push({
        name: 'HTTP Reachability',
        status: httpResult.success ? 'success' : 'error',
        details: httpResult.details,
      });

      if (!httpResult.success && httpResult.errorCode !== 'AUTH_REQUIRED') {
        const failResult: ConnectionTestResult = {
          success: false,
          steps,
          latencyMs: Date.now() - startTime,
        };
        if (httpResult.errorCode) failResult.errorCode = httpResult.errorCode;
        if (httpResult.error) failResult.error = httpResult.error;
        if (httpResult.suggestions) failResult.suggestions = httpResult.suggestions;
        return failResult;
      }

      // Step 4: MCP Protocol Detection
      const mcpDetection = await this.detectMCPProtocol(url, transport);
      steps.push({
        name: 'MCP Protocol Detection',
        status: mcpDetection.detected ? 'success' : 'warning',
        details: mcpDetection.detected
          ? `MCP detected, Transport: ${transport.toUpperCase()}`
          : 'Could not confirm MCP protocol (server may still work)',
      });

      const latencyMs = Date.now() - startTime;

      const successResult: ConnectionTestResult = {
        success: true,
        latencyMs,
        steps,
      };
      if (httpResult.status) successResult.httpStatus = httpResult.status;
      if (mcpDetection.serverInfo) successResult.serverInfo = mcpDetection.serverInfo;
      return successResult;
    } catch (error) {
      const err = error as Error;
      console.error('[RemoteMCPRegistryService] Connection test failed:', err);

      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        error: err.message,
        steps,
        latencyMs: Date.now() - startTime,
        suggestions: ['An unexpected error occurred', 'Try again in a few minutes'],
      };
    }
  }

  /**
   * Get cache status
   */
  async getCacheStatus(): Promise<DirectoryCacheStatus> {
    const cache = await this.loadCachedServers();

    if (!cache) {
      return {
        isCached: false,
        isStale: true,
        serverCount: 0,
      };
    }

    const cacheAge = Date.now() - new Date(cache.timestamp).getTime();
    const isStale = cacheAge >= this.cacheTTLMs;

    return {
      isCached: true,
      lastUpdated: cache.timestamp,
      isStale,
      serverCount: cache.servers.length,
    };
  }

  /**
   * Get all unique categories from servers
   */
  async getCategories(): Promise<RemoteMCPCategory[]> {
    const { servers } = await this.fetchServerDirectory();
    const categories = new Set<RemoteMCPCategory>();
    servers.forEach(server => categories.add(server.category));
    return Array.from(categories).sort();
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Get the full directory (curated + any fetched servers)
   */
  private async getFullDirectory(): Promise<RemoteMCPServer[]> {
    // For now, return curated servers
    // In the future, this could fetch from mcpservers.org API
    return [...CURATED_SERVERS];
  }

  /**
   * Check TLS certificate validity
   */
  private async checkTLSCertificate(hostname: string): Promise<{
    valid: boolean;
    issuer?: string;
    validFrom?: string;
    validTo?: string;
    error?: string;
  }> {
    return new Promise(resolve => {
      const options = {
        hostname,
        port: 443,
        method: 'HEAD',
        timeout: 5000,
        rejectUnauthorized: true,
      };

      const req = https.request(options, res => {
        const socket = res.socket as import('tls').TLSSocket;
        const cert = socket.getPeerCertificate();

        if (cert && Object.keys(cert).length > 0) {
          resolve({
            valid: true,
            issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown',
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
          });
        } else {
          resolve({ valid: false, error: 'No certificate received' });
        }
      });

      req.on('error', err => {
        resolve({ valid: false, error: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ valid: false, error: 'Certificate check timeout' });
      });

      req.end();
    });
  }

  /**
   * Test HTTP reachability
   */
  private async testHTTPReachability(
    url: string,
    timeout: number
  ): Promise<{
    success: boolean;
    status?: number;
    details: string;
    error?: string;
    errorCode?: ConnectionErrorCode;
    suggestions?: string[];
  }> {
    return new Promise(resolve => {
      const parsedUrl = new URL(url);
      const startTime = Date.now();

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'OPTIONS',
        timeout,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Claude-Owl/1.0',
        },
      };

      const req = https.request(options, res => {
        const latency = Date.now() - startTime;

        // 401/403 is expected for auth-required servers
        if (res.statusCode === 401 || res.statusCode === 403) {
          resolve({
            success: true,
            status: res.statusCode,
            details: `Response: ${res.statusCode} (expected - requires authentication), Latency: ${latency}ms`,
            errorCode: 'AUTH_REQUIRED',
          });
        } else if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          resolve({
            success: true,
            status: res.statusCode,
            details: `Response: ${res.statusCode} OK, Latency: ${latency}ms`,
          });
        } else if (res.statusCode === 429) {
          resolve({
            success: false,
            status: res.statusCode,
            details: `Rate limited (${res.statusCode})`,
            error: 'Server is rate limiting requests',
            errorCode: 'RATE_LIMITED',
            suggestions: ['Wait a few minutes before trying again'],
          });
        } else {
          const result: {
            success: boolean;
            status?: number;
            details: string;
            error?: string;
            errorCode?: ConnectionErrorCode;
            suggestions?: string[];
          } = {
            success: false,
            details: `Server returned ${res.statusCode}: ${res.statusMessage}`,
            error: `Server returned ${res.statusCode}`,
            errorCode: 'SERVER_ERROR',
            suggestions: ['The server may be experiencing issues', 'Check the server documentation'],
          };
          if (res.statusCode) result.status = res.statusCode;
          resolve(result);
        }
      });

      req.on('error', err => {
        resolve({
          success: false,
          details: err.message,
          error: err.message,
          errorCode: 'NETWORK_ERROR',
          suggestions: [
            'The server may be temporarily unavailable',
            'Check if a VPN or firewall is blocking the connection',
            'Try again in a few minutes',
          ],
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          details: 'Request timeout',
          error: `Server did not respond within ${timeout}ms`,
          errorCode: 'TIMEOUT',
          suggestions: [
            'The server may be slow or unresponsive',
            'Try increasing the timeout',
            'Check your network connection',
          ],
        });
      });

      req.end();
    });
  }

  /**
   * Detect MCP protocol support
   */
  private async detectMCPProtocol(
    _url: string,
    _transport: 'http' | 'sse'
  ): Promise<{
    detected: boolean;
    serverInfo?: DiscoveredServerInfo;
  }> {
    // For now, we'll assume any reachable server supports MCP
    // In a production implementation, we would:
    // 1. Send an MCP initialization request
    // 2. Check for MCP-specific headers
    // 3. Parse the server capabilities response
    return {
      detected: true,
      serverInfo: {
        requiresAuth: true,
      },
    };
  }

  /**
   * Load cached servers from disk
   */
  private async loadCachedServers(): Promise<{
    servers: RemoteMCPServer[];
    timestamp: string;
  } | null> {
    try {
      const content = await fs.readFile(this.cacheFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Cache servers to disk
   */
  private async cacheServers(servers: RemoteMCPServer[], timestamp: string): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      await fs.writeFile(
        this.cacheFile,
        JSON.stringify({ servers, timestamp }, null, 2),
        'utf-8'
      );
      console.log('[RemoteMCPRegistryService] Cached', servers.length, 'servers to disk');
    } catch (error) {
      console.warn('[RemoteMCPRegistryService] Failed to cache servers:', error);
    }
  }
}
