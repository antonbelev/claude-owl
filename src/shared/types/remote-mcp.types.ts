/**
 * Remote MCP Server Discovery Types
 *
 * Type definitions for remote MCP server discovery, connection verification,
 * and security assessment.
 *
 * @see ADR-010: Remote MCP Servers Discovery & Connection Verification
 */

/**
 * Categories for remote MCP servers
 */
export type RemoteMCPCategory =
  | 'developer-tools'
  | 'databases'
  | 'productivity'
  | 'payments'
  | 'content'
  | 'utilities'
  | 'security'
  | 'analytics';

/**
 * Authentication types supported by remote MCP servers
 */
export type RemoteMCPAuthType = 'oauth' | 'api-key' | 'header' | 'open';

/**
 * Health status of a remote MCP server
 */
export type RemoteMCPHealthStatus = 'healthy' | 'degraded' | 'offline' | 'unknown';

/**
 * Source of server information
 */
export type RemoteMCPSource = 'mcpservers.org' | 'claude-owl' | 'community';

/**
 * Authentication configuration for remote servers
 */
export interface RemoteMCPAuthConfig {
  /** OAuth provider name */
  oauthProvider?: string;
  /** OAuth authorization URL */
  oauthUrl?: string;
  /** Header name for API key authentication */
  apiKeyHeader?: string;
  /** Suggested environment variable name for storing API key */
  apiKeyEnvVar?: string;
  /** OAuth scopes needed */
  requiredScopes?: string[];
}

/**
 * Remote MCP Server definition
 */
export interface RemoteMCPServer {
  /** Unique identifier (e.g., "github", "notion") */
  id: string;
  /** Display name (e.g., "GitHub MCP") */
  name: string;
  /** Short description of the server */
  description: string;

  /** Server URL endpoint */
  endpoint: string;
  /** Transport type (no stdio for remote servers) */
  transport: 'http' | 'sse';

  /** Authentication type required */
  authType: RemoteMCPAuthType;
  /** Authentication configuration details */
  authConfig?: RemoteMCPAuthConfig;

  /** Company/organization name providing the server */
  provider: string;
  /** Whether this is an officially verified server */
  verified: boolean;
  /** Server category */
  category: RemoteMCPCategory;
  /** Tags for search/filtering */
  tags: string[];

  /** Documentation URL */
  documentationUrl?: string;
  /** Logo image URL */
  logoUrl?: string;

  /** Source of server information */
  source: RemoteMCPSource;
  /** ISO date of last health check */
  lastVerified?: string;
  /** Current health status */
  healthStatus?: RemoteMCPHealthStatus;
}

/**
 * Error codes for connection test failures
 */
export type ConnectionErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'SSL_ERROR'
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID'
  | 'NOT_MCP_SERVER'
  | 'SERVER_ERROR'
  | 'RATE_LIMITED';

/**
 * A step in the connection test process
 */
export interface ConnectionTestStep {
  /** Step name */
  name: string;
  /** Step status */
  status: 'success' | 'warning' | 'error' | 'pending';
  /** Step result details */
  details?: string;
}

/**
 * Server information discovered during connection test
 */
export interface DiscoveredServerInfo {
  /** MCP protocol version */
  protocolVersion?: string;
  /** Server capabilities */
  capabilities?: string[];
  /** Number of tools exposed */
  toolCount?: number;
  /** Whether authentication is required */
  requiresAuth?: boolean;
}

/**
 * Result from testing a remote MCP server connection
 */
export interface ConnectionTestResult {
  /** Whether the connection test was successful */
  success: boolean;
  /** Response latency in milliseconds */
  latencyMs?: number;
  /** HTTP status code from the server */
  httpStatus?: number;
  /** Error message if test failed */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: ConnectionErrorCode;
  /** Steps performed during the test */
  steps?: ConnectionTestStep[];
  /** Information discovered about the server */
  serverInfo?: DiscoveredServerInfo;
  /** Suggestions for resolving issues */
  suggestions?: string[];
}

/**
 * Security risk level assessment
 */
export type SecurityRiskLevel = 'low' | 'medium' | 'high' | 'unknown';

/**
 * TLS certificate information
 */
export interface TLSCertificateInfo {
  /** Certificate issuer */
  issuer: string;
  /** Certificate validity start date (ISO string) */
  validFrom: string;
  /** Certificate validity end date (ISO string) */
  validTo: string;
  /** Certificate fingerprint */
  fingerprint: string;
}

/**
 * Security context for a remote MCP server
 */
export interface SecurityContext {
  /** Whether the provider is verified */
  isVerifiedProvider: boolean;
  /** Whether the server is from an official source (e.g., mcpservers.org) */
  isOfficialServer: boolean;
  /** Whether the server has valid TLS */
  hasValidTLS: boolean;
  /** TLS certificate details */
  tlsCertificateInfo?: TLSCertificateInfo;

  /** Overall risk level */
  riskLevel: SecurityRiskLevel;
  /** List of risk factors identified */
  riskFactors: string[];

  /** OAuth scopes being requested */
  requestedScopes?: string[];
  /** Human-readable description of data access */
  dataAccessDescription?: string;
}

/**
 * Security warning to display to user
 */
export interface SecurityWarning {
  /** Severity of the warning */
  severity: 'info' | 'warning' | 'critical';
  /** Short title */
  title: string;
  /** Detailed description */
  description: string;
  /** Recommended action */
  recommendation: string;
}

/**
 * Filter options for browsing remote servers
 */
export interface RemoteServerFilters {
  /** Search query */
  search?: string;
  /** Category filter */
  category?: RemoteMCPCategory | 'all';
  /** Authentication type filter */
  authType?: RemoteMCPAuthType | 'all';
  /** Transport type filter */
  transport?: 'http' | 'sse' | 'all';
  /** Show only verified servers */
  verifiedOnly?: boolean;
}

/**
 * Cache status for the server directory
 */
export interface DirectoryCacheStatus {
  /** Whether cache exists and is valid */
  isCached: boolean;
  /** ISO date when cache was last updated */
  lastUpdated?: string;
  /** Whether cache is stale (older than TTL) */
  isStale: boolean;
  /** Number of servers in cache */
  serverCount: number;
}
