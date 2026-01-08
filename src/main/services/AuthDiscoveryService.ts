/**
 * Authentication Discovery Service
 *
 * Probes remote MCP servers to discover their authentication requirements
 * following the MCP OAuth 2.1 specification (RFC 9728, RFC 8414).
 *
 * Discovery flow:
 * 1. Hit MCP endpoint → get 401 with WWW-Authenticate header
 * 2. Parse resource_metadata URL from header (or try /.well-known/oauth-protected-resource)
 * 3. Fetch protected resource metadata → get authorization_servers
 * 4. Fetch /.well-known/oauth-authorization-server from auth server
 * 5. Check if registration_endpoint exists → DCR supported
 *
 * @see https://modelcontextprotocol.info/specification/draft/basic/authorization/
 * @see ADR-010: Remote MCP Servers Discovery & Connection Verification
 */

export interface ProtectedResourceMetadata {
  /** Resource identifier */
  resource: string;
  /** Human-readable name */
  resource_name?: string;
  /** Documentation URL */
  resource_documentation?: string;
  /** List of authorization server URLs */
  authorization_servers?: string[];
  /** Supported bearer token methods */
  bearer_methods_supported?: string[];
  /** Supported scopes */
  scopes_supported?: string[];
}

export interface AuthorizationServerMetadata {
  /** Issuer identifier */
  issuer: string;
  /** Authorization endpoint */
  authorization_endpoint?: string;
  /** Token endpoint */
  token_endpoint?: string;
  /** Dynamic client registration endpoint (if supported) */
  registration_endpoint?: string;
  /** Revocation endpoint */
  revocation_endpoint?: string;
  /** Supported response types */
  response_types_supported?: string[];
  /** Supported grant types */
  grant_types_supported?: string[];
  /** Supported code challenge methods (PKCE) */
  code_challenge_methods_supported?: string[];
  /** Supported token endpoint auth methods */
  token_endpoint_auth_methods_supported?: string[];
  /** Supported scopes */
  scopes_supported?: string[];
}

export interface AuthDiscoveryResult {
  /** Whether discovery was successful */
  success: boolean;
  /** The endpoint that was probed */
  endpoint: string;
  /** Whether the server requires authentication */
  requiresAuth: boolean;
  /** Discovered authentication type */
  authType: 'oauth-dcr' | 'oauth-static' | 'api-key' | 'open' | 'unknown';
  /** Whether Dynamic Client Registration is supported */
  supportsDCR: boolean;
  /** Protected resource metadata (if available) */
  protectedResource?: ProtectedResourceMetadata;
  /** Authorization server metadata (if available) */
  authorizationServer?: AuthorizationServerMetadata;
  /** Supported scopes */
  scopes?: string[];
  /** Error message if discovery failed */
  error?: string;
  /** Detailed discovery steps for debugging */
  discoverySteps?: string[];
}

export class AuthDiscoveryService {
  private readonly timeout = 10000; // 10 second timeout

  /**
   * Discover authentication requirements for an MCP server
   */
  async discoverAuth(endpoint: string): Promise<AuthDiscoveryResult> {
    const steps: string[] = [];
    const result: AuthDiscoveryResult = {
      success: false,
      endpoint,
      requiresAuth: false,
      authType: 'unknown',
      supportsDCR: false,
      discoverySteps: steps,
    };

    try {
      // Step 1: Probe the MCP endpoint
      steps.push(`Probing MCP endpoint: ${endpoint}`);
      const probeResponse = await this.fetchWithTimeout(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      // If we get 200, the server is open (no auth required)
      if (probeResponse.ok) {
        steps.push('Server returned 200 OK - no authentication required');
        result.success = true;
        result.requiresAuth = false;
        result.authType = 'open';
        return result;
      }

      // If we get 401/403, authentication is required
      if (probeResponse.status === 401 || probeResponse.status === 403) {
        steps.push(`Server returned ${probeResponse.status} - authentication required`);
        result.requiresAuth = true;

        // Step 2: Parse WWW-Authenticate header for resource_metadata URL
        const wwwAuth = probeResponse.headers.get('www-authenticate');
        let resourceMetadataUrl: string | null = null;

        if (wwwAuth) {
          steps.push(`WWW-Authenticate header: ${wwwAuth.substring(0, 200)}...`);
          const resourceMetadataMatch = wwwAuth.match(/resource_metadata="([^"]+)"/);
          if (resourceMetadataMatch && resourceMetadataMatch[1]) {
            resourceMetadataUrl = resourceMetadataMatch[1];
            steps.push(`Found resource_metadata URL: ${resourceMetadataUrl}`);
          }
        }

        // Step 3: Fetch protected resource metadata
        const protectedResource = await this.fetchProtectedResourceMetadata(
          endpoint,
          resourceMetadataUrl,
          steps
        );

        if (protectedResource) {
          result.protectedResource = protectedResource;
          if (protectedResource.scopes_supported) {
            result.scopes = protectedResource.scopes_supported;
          }

          // Step 4: Fetch authorization server metadata
          const authServers = protectedResource.authorization_servers;
          const firstAuthServer = authServers?.[0];
          if (firstAuthServer) {
            steps.push(`Checking authorization server: ${firstAuthServer}`);

            const authServer = await this.fetchAuthorizationServerMetadata(firstAuthServer, steps);

            if (authServer) {
              result.authorizationServer = authServer;

              // Step 5: Check for DCR support
              if (authServer.registration_endpoint) {
                steps.push(`DCR supported: registration_endpoint found at ${authServer.registration_endpoint}`);
                result.supportsDCR = true;
                result.authType = 'oauth-dcr';
              } else {
                steps.push('No registration_endpoint found - DCR not supported');
                result.supportsDCR = false;
                result.authType = 'oauth-static';
              }

              // Merge scopes from auth server if available
              if (authServer.scopes_supported && !result.scopes?.length) {
                result.scopes = authServer.scopes_supported;
              }
            } else {
              // Auth server metadata not available - likely needs static OAuth or API key
              steps.push('Authorization server metadata not available');
              result.authType = 'oauth-static';
            }
          } else {
            steps.push('No authorization_servers in protected resource metadata');
            result.authType = 'api-key';
          }
        } else {
          // No protected resource metadata - likely simple API key auth
          steps.push('No protected resource metadata found - assuming API key auth');
          result.authType = 'api-key';
        }

        result.success = true;
        return result;
      }

      // Other status codes
      steps.push(`Unexpected status code: ${probeResponse.status}`);
      result.error = `Unexpected response: ${probeResponse.status}`;
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      steps.push(`Discovery failed: ${errorMessage}`);
      result.error = errorMessage;
      return result;
    }
  }

  /**
   * Fetch protected resource metadata
   */
  private async fetchProtectedResourceMetadata(
    endpoint: string,
    resourceMetadataUrl: string | null,
    steps: string[]
  ): Promise<ProtectedResourceMetadata | null> {
    // Try explicit URL first, then well-known paths
    const urlsToTry: string[] = [];

    if (resourceMetadataUrl) {
      urlsToTry.push(resourceMetadataUrl);
    }

    // Build well-known URLs from endpoint
    const url = new URL(endpoint);
    const basePath = url.pathname.replace(/\/$/, '');

    if (basePath && basePath !== '/') {
      // With path: https://api.example.com/mcp → /.well-known/oauth-protected-resource/mcp
      urlsToTry.push(`${url.origin}/.well-known/oauth-protected-resource${basePath}`);
    }
    // Without path or as fallback
    urlsToTry.push(`${url.origin}/.well-known/oauth-protected-resource`);

    for (const metadataUrl of urlsToTry) {
      try {
        steps.push(`Fetching protected resource metadata: ${metadataUrl}`);
        const response = await this.fetchWithTimeout(metadataUrl, {
          headers: { Accept: 'application/json' },
        });

        if (response.ok) {
          const metadata = (await response.json()) as ProtectedResourceMetadata;
          steps.push(`Found protected resource metadata: ${metadata.resource_name || metadata.resource}`);
          return metadata;
        }
        steps.push(`${metadataUrl} returned ${response.status}`);
      } catch (error) {
        steps.push(`Failed to fetch ${metadataUrl}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return null;
  }

  /**
   * Fetch authorization server metadata
   */
  private async fetchAuthorizationServerMetadata(
    authServerUrl: string,
    steps: string[]
  ): Promise<AuthorizationServerMetadata | null> {
    // Normalize the URL
    const baseUrl = authServerUrl.replace(/\/$/, '');

    // Try different well-known paths
    const urlsToTry = [
      `${baseUrl}/.well-known/oauth-authorization-server`,
      `${baseUrl}/.well-known/openid-configuration`,
    ];

    // If the URL has a path component, also try without it
    const url = new URL(baseUrl);
    if (url.pathname !== '/' && url.pathname !== '') {
      urlsToTry.push(`${url.origin}/.well-known/oauth-authorization-server`);
      urlsToTry.push(`${url.origin}/.well-known/openid-configuration`);
    }

    for (const metadataUrl of urlsToTry) {
      try {
        steps.push(`Fetching authorization server metadata: ${metadataUrl}`);
        const response = await this.fetchWithTimeout(metadataUrl, {
          headers: { Accept: 'application/json' },
        });

        if (response.ok) {
          const metadata = (await response.json()) as AuthorizationServerMetadata;
          steps.push(`Found authorization server metadata: ${metadata.issuer}`);
          return metadata;
        }
        steps.push(`${metadataUrl} returned ${response.status}`);
      } catch (error) {
        steps.push(`Failed to fetch ${metadataUrl}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return null;
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
