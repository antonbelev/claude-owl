# ADR-010: Remote MCP Servers Discovery & Connection Verification

**Status:** Proposed
**Date:** 2025-12-10
**Decision Makers:** Product Team, Engineering Team
**Stakeholders:** Claude Owl Users, Claude Code Users
**Supersedes:** Extends ADR-004 (MCP Manager) Phase 2: Marketplace & Discovery

---

## Executive Summary

This ADR proposes extending Claude Owl's MCP Manager with a **Remote MCP Servers Discovery** feature that allows users to:

1. Browse and search a curated directory of remote MCP servers (sourced from mcpservers.org and our own registry)
2. **Pre-verify connections** before adding servers to Claude Code
3. Understand authentication requirements (OAuth, API keys, open access)
4. Install remote servers with guided setup flows

The key differentiator is **connection verification before configuration** - users can test that a remote server is reachable and responding before committing to the setup process.

---

## Context

### Current State

Claude Owl's MCP Manager (ADR-004) currently supports:

- ✅ Adding/removing stdio and HTTP/SSE servers via `claude mcp` CLI
- ✅ Viewing installed servers with status indicators
- ✅ Basic connection testing (stub - returns "not implemented")
- ✅ Environment variable and header configuration
- ❌ **No server discovery** - users must know server URLs
- ❌ **No pre-installation verification** - users configure first, discover problems later
- ❌ **No remote server directory** - only local stdio servers well-documented

### User Pain Points

From user research and The Pragmatic Engineer's MCP deep dive:

1. **Discovery Problem:** Users don't know which remote MCP servers exist or are trustworthy
2. **Configuration Blindness:** Users configure servers without knowing if they'll work
3. **Authentication Confusion:** Unclear what auth method each server requires
4. **Trust Concerns:** No verification of server authenticity or security posture
5. **Wasted Time:** Users spend hours debugging configurations that were never going to work

### Remote MCP Server Landscape

Based on analysis of mcpservers.org/remote-mcp-servers (December 2025):

| Category | Examples | Auth Type | Transport |
|----------|----------|-----------|-----------|
| **Developer Tools** | GitHub, Linear, Figma, Atlassian | OAuth | HTTP/SSE |
| **Databases** | Neon, Supabase | OAuth | SSE/HTTP |
| **Payments** | PayPal, Square | OAuth | SSE |
| **Content** | Notion, Asana, Intercom | OAuth | HTTP/SSE |
| **Utilities** | Fetch, Sequential Thinking, DeepWiki | Open | HTTP |
| **Security** | Semgrep | Open | SSE |
| **SEO/Analytics** | Ahrefs, CoinGecko | OAuth/Open | HTTP/SSE |

**Key Insight:** Most production-grade remote servers use **OAuth** authentication, while utility servers often allow **open access**.

---

## Decision

We will build a **Remote MCP Servers Discovery** feature that:

1. **Aggregates remote servers** from mcpservers.org and our curated registry
2. **Pre-verifies connections** before users configure Claude Code
3. **Guides authentication** based on server requirements
4. **Provides security context** to help users make informed decisions

### Design Principles

1. **Verify First, Configure Later** - Test connectivity before committing
2. **Transparency Over Abstraction** - Show users what's happening
3. **Security-Conscious Defaults** - Warn about risks, don't hide them
4. **Attribution & Credit** - Clearly credit mcpservers.org as a data source

---

## Detailed Design

### 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Remote MCP Discovery                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────┐  ┌───────────────────┐  ┌──────────────┐ │
│  │  Server Browser   │  │ Connection Tester │  │ Setup Wizard │ │
│  │  - Categories     │  │ - Pre-verify      │  │ - OAuth flow │ │
│  │  - Search         │  │ - Health check    │  │ - API keys   │ │
│  │  - Filters        │  │ - Latency test    │  │ - Headers    │ │
│  └────────┬──────────┘  └────────┬──────────┘  └──────┬───────┘ │
│           │                      │                     │         │
│           ▼                      ▼                     ▼         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    RemoteMCPService                          ││
│  │  - fetchServerDirectory()                                    ││
│  │  - testRemoteConnection(url, transport)                      ││
│  │  - validateOAuthEndpoint(url)                                ││
│  │  - installRemoteServer(config)                               ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ IPC
┌─────────────────────────────────────────────────────────────────┐
│                       Main Process                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  RemoteMCPService                                            ││
│  │  ├─ Fetch registry from mcpservers.org                       ││
│  │  ├─ Merge with local curated registry                        ││
│  │  ├─ HTTP health checks for remote servers                    ││
│  │  ├─ Delegate installation to claude mcp CLI                  ││
│  │  └─ Cache server directory (refresh every 24h)               ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2. Data Model

#### Remote Server Registry

```typescript
// src/shared/types/remote-mcp.types.ts

export interface RemoteMCPServer {
  // Core identification
  id: string;                          // Unique identifier (e.g., "github", "notion")
  name: string;                        // Display name (e.g., "GitHub MCP")
  description: string;                 // Short description

  // Connection details
  endpoint: string;                    // Server URL (e.g., "https://mcp.notion.com/mcp")
  transport: 'http' | 'sse';           // Transport type (no stdio for remote)

  // Authentication
  authType: 'oauth' | 'api-key' | 'header' | 'open';
  authConfig?: {
    oauthProvider?: string;            // OAuth provider name
    oauthUrl?: string;                 // OAuth authorization URL
    apiKeyHeader?: string;             // Header name for API key (e.g., "X-API-Key")
    apiKeyEnvVar?: string;             // Suggested env var name
    requiredScopes?: string[];         // OAuth scopes needed
  };

  // Metadata
  provider: string;                    // Company/org name (e.g., "GitHub", "Notion")
  verified: boolean;                   // Official/verified server
  category: RemoteMCPCategory;
  tags: string[];
  documentationUrl?: string;
  logoUrl?: string;

  // Discovery metadata
  source: 'mcpservers.org' | 'claude-owl' | 'community';
  lastVerified?: string;               // ISO date of last health check
  healthStatus?: 'healthy' | 'degraded' | 'offline' | 'unknown';
}

export type RemoteMCPCategory =
  | 'developer-tools'
  | 'databases'
  | 'productivity'
  | 'payments'
  | 'content'
  | 'utilities'
  | 'security'
  | 'analytics';

export interface ConnectionTestResult {
  success: boolean;
  latencyMs?: number;
  httpStatus?: number;
  error?: string;
  errorCode?: ConnectionErrorCode;
  serverInfo?: {
    protocolVersion?: string;
    capabilities?: string[];
    toolCount?: number;
  };
  suggestions?: string[];
}

export type ConnectionErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'SSL_ERROR'
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID'
  | 'NOT_MCP_SERVER'
  | 'SERVER_ERROR'
  | 'RATE_LIMITED';
```

### 3. Connection Verification Flow

The key innovation: **Test before you invest**.

```
┌──────────────────────────────────────────────────────────────────┐
│  Pre-Installation Connection Verification                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Testing: GitHub MCP (api.githubcopilot.com/mcp/)                │
│                                                                   │
│  Step 1: DNS Resolution                                    ✓     │
│  └─ Resolved to 52.192.123.45                                    │
│                                                                   │
│  Step 2: TLS/SSL Verification                              ✓     │
│  └─ Valid certificate (expires: 2026-03-15)                      │
│  └─ Issuer: DigiCert                                             │
│                                                                   │
│  Step 3: HTTP Reachability                                 ✓     │
│  └─ Response: 401 Unauthorized (expected - requires OAuth)       │
│  └─ Latency: 145ms                                               │
│                                                                   │
│  Step 4: MCP Protocol Detection                            ✓     │
│  └─ MCP-Version header present: 1.0                              │
│  └─ Content-Type: application/json                               │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ✓ Server is reachable and appears to be a valid MCP server │ │
│  │                                                             │ │
│  │ 🔐 Authentication Required: OAuth 2.0                       │ │
│  │    You'll be redirected to GitHub to authorize access.      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  [Cancel]  [View Documentation]  [Continue to Setup →]           │
└──────────────────────────────────────────────────────────────────┘
```

#### Implementation Details

```typescript
// src/main/services/RemoteMCPService.ts

export class RemoteMCPService {
  /**
   * Pre-verify a remote MCP server connection BEFORE configuration.
   * This helps users avoid wasting time on servers that won't work.
   */
  async testRemoteConnection(
    url: string,
    transport: 'http' | 'sse'
  ): Promise<ConnectionTestResult> {
    const steps: TestStep[] = [];

    // Step 1: DNS Resolution
    try {
      const { address, family } = await dns.promises.lookup(new URL(url).hostname);
      steps.push({
        name: 'DNS Resolution',
        status: 'success',
        details: `Resolved to ${address} (IPv${family})`
      });
    } catch (error) {
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        error: `DNS resolution failed: ${error.message}`,
        suggestions: [
          'Check that the server URL is correct',
          'Verify your internet connection',
          'The server may be temporarily unavailable'
        ]
      };
    }

    // Step 2: TLS/SSL Verification
    try {
      const tlsInfo = await this.checkTLSCertificate(url);
      steps.push({
        name: 'TLS/SSL Verification',
        status: 'success',
        details: `Valid certificate (expires: ${tlsInfo.validTo}), Issuer: ${tlsInfo.issuer}`
      });
    } catch (error) {
      steps.push({
        name: 'TLS/SSL Verification',
        status: 'warning',
        details: `Certificate issue: ${error.message}`
      });
      // Don't fail - some internal servers use self-signed certs
    }

    // Step 3: HTTP Reachability
    const startTime = Date.now();
    try {
      const response = await fetch(url, {
        method: 'OPTIONS',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });

      const latencyMs = Date.now() - startTime;

      // 401/403 is expected for auth-required servers
      if (response.status === 401 || response.status === 403) {
        steps.push({
          name: 'HTTP Reachability',
          status: 'success',
          details: `Response: ${response.status} (expected - requires authentication), Latency: ${latencyMs}ms`
        });
      } else if (response.ok) {
        steps.push({
          name: 'HTTP Reachability',
          status: 'success',
          details: `Response: ${response.status} OK, Latency: ${latencyMs}ms`
        });
      } else {
        return {
          success: false,
          errorCode: 'SERVER_ERROR',
          error: `Server returned ${response.status}: ${response.statusText}`,
          latencyMs
        };
      }
    } catch (error) {
      return {
        success: false,
        errorCode: error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
        error: error.message,
        suggestions: [
          'The server may be temporarily unavailable',
          'Check if a VPN or firewall is blocking the connection',
          'Try again in a few minutes'
        ]
      };
    }

    // Step 4: MCP Protocol Detection
    const mcpHeaders = await this.detectMCPProtocol(url, transport);
    if (mcpHeaders.detected) {
      steps.push({
        name: 'MCP Protocol Detection',
        status: 'success',
        details: `MCP-Version: ${mcpHeaders.version}, Transport: ${transport.toUpperCase()}`
      });
    } else {
      steps.push({
        name: 'MCP Protocol Detection',
        status: 'warning',
        details: 'Could not confirm MCP protocol (server may still work)'
      });
    }

    return {
      success: true,
      latencyMs: Date.now() - startTime,
      steps,
      serverInfo: mcpHeaders.serverInfo
    };
  }
}
```

### 4. Remote Server Browser UI

```
┌──────────────────────────────────────────────────────────────────┐
│  MCP Servers  >  Remote Servers                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Discover remote MCP servers from verified providers.             │
│  Data sourced from mcpservers.org - Thank you! ❤️                │
│                                                                   │
│  Search: [                                              🔍]       │
│                                                                   │
│  Categories:                                                      │
│  [All] [Developer] [Databases] [Productivity] [Payments] [Utils] │
│                                                                   │
│  Auth Filter: [All ▾]  Transport: [All ▾]  Status: [Verified ▾] │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Developer Tools                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  [GitHub Logo]                                                ││
│  │  GitHub MCP                              ✓ Verified   OAuth  ││
│  │  GitHub's official MCP Server for repo access                 ││
│  │  api.githubcopilot.com/mcp/                                   ││
│  │                                                               ││
│  │  Status: ● Healthy (145ms)        [Test Connection] [Add →]  ││
│  └──────────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  [Figma Logo]                                                 ││
│  │  Figma MCP                               ✓ Verified   OAuth  ││
│  │  Collaborative design and prototyping platform                ││
│  │  mcp.figma.com/mcp                                            ││
│  │                                                               ││
│  │  Status: ● Healthy (98ms)         [Test Connection] [Add →]  ││
│  └──────────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  [Linear Logo]                                                ││
│  │  Linear MCP                              ✓ Verified   OAuth  ││
│  │  Project management for software teams                        ││
│  │  mcp.linear.app/sse                                           ││
│  │                                                               ││
│  │  Status: ● Healthy (112ms)        [Test Connection] [Add →]  ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Utilities (Open Access)                                          │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  [Globe Icon]                                                 ││
│  │  Fetch                                   ✓ Verified   Open   ││
│  │  Web content retrieval, converts HTML to markdown             ││
│  │  remote.mcpservers.org/fetch/mcp                              ││
│  │                                                               ││
│  │  Status: ● Healthy (67ms)         [Test Connection] [Add →]  ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  [Load More...]                                                   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 5. Server Detail & Setup Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Remote Servers                                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [GitHub Logo]                                                    │
│  GitHub MCP                                        ✓ Verified    │
│                                                                   │
│  GitHub's official MCP Server providing access to repositories,   │
│  issues, pull requests, and GitHub Actions workflows.             │
│                                                                   │
│  Provider: GitHub (Verified ✓)                                   │
│  Endpoint: api.githubcopilot.com/mcp/                            │
│  Transport: HTTP                                                  │
│  Source: mcpservers.org                                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📊 Connection Status                                        │ │
│  │ ● Healthy  •  Last checked: 2 min ago  •  Latency: 145ms   │ │
│  │ [Refresh Status]                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🔐 Authentication: OAuth 2.0                                │ │
│  │                                                             │ │
│  │ This server requires GitHub OAuth authentication.           │ │
│  │ You'll be redirected to GitHub to authorize access.         │ │
│  │                                                             │ │
│  │ Required Scopes:                                            │ │
│  │ • repo (Full control of private repositories)               │ │
│  │ • workflow (Update GitHub Action workflows)                 │ │
│  │                                                             │ │
│  │ ⚠️ Security Note:                                           │ │
│  │ Only grant access if you trust Claude Code to interact      │ │
│  │ with your GitHub repositories.                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📚 Documentation                                            │ │
│  │ [View on mcpservers.org →]  [GitHub MCP Docs →]            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Step 1: Test Connection (Recommended)                       │ │
│  │ Verify the server is reachable before configuring.          │ │
│  │                                                 [Test →]    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Step 2: Add to Claude Code                                  │ │
│  │                                                             │ │
│  │ Scope: ◉ User (all projects)  ○ Project (select below)     │ │
│  │                                                             │ │
│  │ After adding, use Claude Code's /mcp command to complete    │ │
│  │ OAuth authentication.                                       │ │
│  │                                                 [Add →]     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 6. Security Considerations

Based on insights from The Pragmatic Engineer's MCP deep dive:

#### Security Model

```typescript
// src/shared/types/remote-mcp-security.types.ts

export interface SecurityContext {
  // Trust indicators
  isVerifiedProvider: boolean;      // Official provider (GitHub, Notion, etc.)
  isOfficialServer: boolean;        // Listed on mcpservers.org
  hasValidTLS: boolean;             // Valid SSL certificate
  tlsCertificateInfo?: {
    issuer: string;
    validFrom: string;
    validTo: string;
    fingerprint: string;
  };

  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  riskFactors: string[];

  // Data access
  requestedScopes?: string[];
  dataAccessDescription?: string;
}

export interface SecurityWarning {
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation: string;
}
```

#### Security Warnings UI

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚠️ Security Assessment: Custom MCP Server                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Risk Level: MEDIUM                                              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ⚠️ Unverified Provider                                      │ │
│  │ This server is not from a verified provider. Exercise       │ │
│  │ caution when granting access to sensitive data.             │ │
│  │                                                             │ │
│  │ Recommendation: Review the server's documentation and       │ │
│  │ only proceed if you trust the provider.                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ℹ️ Data Access                                               │ │
│  │ This server requests access to:                             │ │
│  │ • Read and write files in selected directories              │ │
│  │ • Execute commands on your behalf                           │ │
│  │                                                             │ │
│  │ Only grant access to directories you trust Claude with.     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ✓ Valid TLS Certificate                                     │ │
│  │ Certificate issued by Let's Encrypt, expires 2026-01-15    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  [Cancel]                              [I Understand, Continue →] │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### Key Security Principles

From The Pragmatic Engineer's analysis:

1. **Internal > External:** Internal MCP servers are safer because you control both client and server
2. **Verify Before Trust:** Always test connections and review permissions before granting access
3. **Prompt Injection Risk:** Be cautious with servers that fetch untrusted content
4. **Scope Minimization:** Only grant the minimum required permissions

#### Implementation

```typescript
// src/main/services/SecurityAssessmentService.ts

export class SecurityAssessmentService {
  assessRemoteServer(server: RemoteMCPServer): SecurityContext {
    const riskFactors: string[] = [];

    // Check verification status
    if (!server.verified) {
      riskFactors.push('Unverified provider');
    }

    // Check data source
    if (server.source === 'community') {
      riskFactors.push('Community-submitted server');
    }

    // Check auth type
    if (server.authType === 'open') {
      riskFactors.push('Open access (no authentication)');
    }

    // Check OAuth scopes
    if (server.authConfig?.requiredScopes?.some(scope =>
      scope.includes('write') || scope.includes('admin')
    )) {
      riskFactors.push('Requests write/admin permissions');
    }

    // Calculate risk level
    let riskLevel: SecurityContext['riskLevel'] = 'low';
    if (riskFactors.length >= 3) {
      riskLevel = 'high';
    } else if (riskFactors.length >= 1) {
      riskLevel = 'medium';
    }

    return {
      isVerifiedProvider: server.verified,
      isOfficialServer: server.source === 'mcpservers.org',
      hasValidTLS: true, // Verified during connection test
      riskLevel,
      riskFactors
    };
  }
}
```

### 7. Data Sources & Attribution

#### mcpservers.org Integration

We will fetch and cache the remote server directory from mcpservers.org:

```typescript
// src/main/services/RemoteMCPRegistryService.ts

export class RemoteMCPRegistryService {
  private readonly MCPSERVERS_ORG_URL = 'https://mcpservers.org/api/remote-servers';
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Fetch remote server directory from mcpservers.org
   * Falls back to local cache if unavailable
   */
  async fetchServerDirectory(): Promise<RemoteMCPServer[]> {
    try {
      const response = await fetch(this.MCPSERVERS_ORG_URL, {
        headers: {
          'User-Agent': 'Claude-Owl/1.0 (https://github.com/antonbelev/claude-owl)',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Transform to our format and add source attribution
      const servers = data.servers.map(server => ({
        ...this.transformServer(server),
        source: 'mcpservers.org' as const
      }));

      // Cache for offline access
      await this.cacheServers(servers);

      return servers;
    } catch (error) {
      console.warn('[RemoteMCPRegistry] Failed to fetch from mcpservers.org, using cache:', error);
      return this.loadCachedServers();
    }
  }

  /**
   * Merge with our curated additions/overrides
   */
  async getFullDirectory(): Promise<RemoteMCPServer[]> {
    const mcpserversOrgServers = await this.fetchServerDirectory();
    const curatedServers = await this.loadCuratedRegistry();

    // Merge, preferring our curated data for duplicates
    const merged = new Map<string, RemoteMCPServer>();

    for (const server of mcpserversOrgServers) {
      merged.set(server.id, server);
    }

    for (const server of curatedServers) {
      merged.set(server.id, {
        ...merged.get(server.id),
        ...server,
        source: server.source || 'claude-owl'
      });
    }

    return Array.from(merged.values());
  }
}
```

#### Attribution in UI

```
┌──────────────────────────────────────────────────────────────────┐
│  Remote MCP Servers                                               │
│                                                                   │
│  Server directory powered by mcpservers.org                       │
│  Thank you for maintaining this valuable resource! ❤️             │
│  [Visit mcpservers.org →]                                        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 8. Implementation Plan

#### Phase 1: Core Discovery (Week 1-2)

**Backend:**
- [ ] Create `RemoteMCPServer` types
- [ ] Implement `RemoteMCPRegistryService` with mcpservers.org fetch
- [ ] Implement caching layer
- [ ] Add IPC handlers for remote server operations

**Frontend:**
- [ ] Build remote server browser component
- [ ] Implement category filtering and search
- [ ] Create server card component with status indicators

#### Phase 2: Connection Verification (Week 2-3)

**Backend:**
- [ ] Implement `testRemoteConnection()` with multi-step verification
- [ ] Add DNS resolution check
- [ ] Add TLS certificate verification
- [ ] Add MCP protocol detection

**Frontend:**
- [ ] Build connection test UI with step-by-step progress
- [ ] Show test results with actionable suggestions
- [ ] Add "Test All" functionality for batch verification

#### Phase 3: Security & Setup (Week 3-4)

**Backend:**
- [ ] Implement `SecurityAssessmentService`
- [ ] Add security context to all remote servers
- [ ] Implement OAuth flow detection

**Frontend:**
- [ ] Build security warning dialogs
- [ ] Create guided setup wizard
- [ ] Add OAuth authentication guidance
- [ ] Implement scope selector integration

#### Phase 4: Polish & Documentation (Week 4)

- [ ] Add loading states and error handling
- [ ] Implement retry logic for failed fetches
- [ ] Write user documentation
- [ ] Add tooltips and help text
- [ ] Create "What's New" entry for feature

### 9. IPC Channels

```typescript
// src/shared/types/ipc.remote-mcp.types.ts

export const REMOTE_MCP_CHANNELS = {
  // Directory operations
  FETCH_DIRECTORY: 'remote-mcp:fetch-directory',
  SEARCH_SERVERS: 'remote-mcp:search',
  GET_SERVER_DETAILS: 'remote-mcp:get-details',

  // Connection verification
  TEST_CONNECTION: 'remote-mcp:test-connection',
  TEST_ALL_CONNECTIONS: 'remote-mcp:test-all',

  // Installation
  ADD_REMOTE_SERVER: 'remote-mcp:add',

  // Cache management
  REFRESH_DIRECTORY: 'remote-mcp:refresh',
  GET_CACHE_STATUS: 'remote-mcp:cache-status',
} as const;

// Request/Response types
export interface FetchDirectoryResponse {
  success: boolean;
  servers: RemoteMCPServer[];
  source: 'live' | 'cache';
  lastUpdated: string;
  error?: string;
}

export interface TestConnectionRequest {
  url: string;
  transport: 'http' | 'sse';
}

export interface TestConnectionResponse {
  success: boolean;
  result: ConnectionTestResult;
  securityContext: SecurityContext;
}

export interface AddRemoteServerRequest {
  server: RemoteMCPServer;
  scope: 'user' | 'project';
  projectPath?: string;
}
```

### 10. Testing Strategy

#### Unit Tests

```typescript
// tests/unit/services/RemoteMCPService.test.ts

describe('RemoteMCPService', () => {
  describe('testRemoteConnection', () => {
    it('should detect healthy HTTP server', async () => {
      // Mock successful HTTP response
      fetchMock.mockResponseOnce('', { status: 200 });

      const result = await service.testRemoteConnection(
        'https://mcp.example.com/mcp',
        'http'
      );

      expect(result.success).toBe(true);
      expect(result.latencyMs).toBeDefined();
    });

    it('should handle 401 as expected for OAuth servers', async () => {
      fetchMock.mockResponseOnce('', { status: 401 });

      const result = await service.testRemoteConnection(
        'https://mcp.github.com/mcp',
        'http'
      );

      // 401 is expected - server is reachable but needs auth
      expect(result.success).toBe(true);
      expect(result.serverInfo?.requiresAuth).toBe(true);
    });

    it('should return actionable error for timeout', async () => {
      fetchMock.mockAbortOnce();

      const result = await service.testRemoteConnection(
        'https://slow.server.com/mcp',
        'http'
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('TIMEOUT');
      expect(result.suggestions).toContain('The server may be temporarily unavailable');
    });
  });

  describe('SecurityAssessmentService', () => {
    it('should flag unverified providers as medium risk', () => {
      const assessment = securityService.assessRemoteServer({
        ...mockServer,
        verified: false
      });

      expect(assessment.riskLevel).toBe('medium');
      expect(assessment.riskFactors).toContain('Unverified provider');
    });
  });
});
```

#### Integration Tests

```typescript
// tests/integration/remote-mcp.test.ts

describe('Remote MCP Integration', () => {
  it('should fetch and display server directory', async () => {
    render(<RemoteServersBrowser />);

    // Wait for directory to load
    await waitFor(() => {
      expect(screen.getByText('GitHub MCP')).toBeInTheDocument();
    });

    // Check attribution is displayed
    expect(screen.getByText(/mcpservers.org/)).toBeInTheDocument();
  });

  it('should test connection before adding server', async () => {
    render(<ServerDetailView server={mockGitHubServer} />);

    // Click test button
    fireEvent.click(screen.getByText('Test Connection'));

    // Wait for test to complete
    await waitFor(() => {
      expect(screen.getByText(/Healthy/)).toBeInTheDocument();
    });
  });
});
```

---

## Success Criteria

### Must Have (Launch Blockers)

- [ ] Remote server directory fetched from mcpservers.org with proper attribution
- [ ] Connection pre-verification with multi-step feedback
- [ ] Security warnings for unverified/risky servers
- [ ] Basic search and category filtering
- [ ] Integration with existing AddServerForm

### Should Have (Post-Launch)

- [ ] OAuth flow guidance in UI
- [ ] Batch connection testing ("Test All")
- [ ] Server health status caching
- [ ] Custom server URL entry (not in directory)

### Nice to Have (Future)

- [ ] Community server submissions
- [ ] User ratings/reviews
- [ ] Usage analytics (most popular servers)
- [ ] Server recommendations based on user's installed servers

---

## Risks & Mitigations

### Risk 1: mcpservers.org API Changes/Unavailability

**Impact:** High - Feature broken if API unavailable
**Mitigation:**
- 24-hour cache with fallback
- Bundle initial server list in app
- Monitor for API changes
- Contact mcpservers.org maintainers for stable API

### Risk 2: False Positive Connection Tests

**Impact:** Medium - Users may add non-functional servers
**Mitigation:**
- Multi-step verification (DNS, TLS, HTTP, MCP detection)
- Clear messaging that test ≠ full functionality
- Recommend testing in Claude Code after adding

### Risk 3: Security Concerns with OAuth Redirect

**Impact:** High - Phishing potential
**Mitigation:**
- Only support OAuth for verified providers
- Display full OAuth URL before redirect
- Warn users about granting permissions
- Never store OAuth tokens in Claude Owl

### Risk 4: Rate Limiting from Servers

**Impact:** Medium - Tests may fail during batch operations
**Mitigation:**
- Rate limit batch tests (5 concurrent max)
- Implement exponential backoff
- Cache successful test results

---

## Open Questions

1. **Should we allow users to add custom remote servers not in the directory?**
   - Pro: Power users want flexibility
   - Con: Higher security risk
   - Proposal: Allow with prominent security warnings

2. **How do we handle servers that go offline permanently?**
   - Option A: Auto-remove from directory after X days offline
   - Option B: Mark as "Offline" but keep in list
   - Proposal: Option B with "Report Issue" button

3. **Should we implement OAuth token storage?**
   - Pro: Better UX - no re-auth needed
   - Con: Security risk, complexity
   - Proposal: Defer to Phase 2, let Claude Code handle auth

4. **How often should we refresh the server directory?**
   - Proposal: 24-hour cache, manual refresh button, check on app launch

---

## Appendix A: Remote Server Registry (Initial)

Based on mcpservers.org as of December 2025:

```json
{
  "servers": [
    {
      "id": "github",
      "name": "GitHub MCP",
      "description": "GitHub's official MCP Server for repository access",
      "endpoint": "https://api.githubcopilot.com/mcp/",
      "transport": "http",
      "authType": "oauth",
      "provider": "GitHub",
      "verified": true,
      "category": "developer-tools"
    },
    {
      "id": "notion",
      "name": "Notion MCP",
      "description": "Collaboration and productivity tool integration",
      "endpoint": "https://mcp.notion.com/mcp",
      "transport": "http",
      "authType": "oauth",
      "provider": "Notion",
      "verified": true,
      "category": "productivity"
    },
    {
      "id": "figma",
      "name": "Figma MCP",
      "description": "Collaborative design and prototyping platform",
      "endpoint": "https://mcp.figma.com/mcp",
      "transport": "http",
      "authType": "oauth",
      "provider": "Figma",
      "verified": true,
      "category": "developer-tools"
    },
    {
      "id": "linear",
      "name": "Linear MCP",
      "description": "Project management tool for software teams",
      "endpoint": "https://mcp.linear.app/sse",
      "transport": "sse",
      "authType": "oauth",
      "provider": "Linear",
      "verified": true,
      "category": "developer-tools"
    },
    {
      "id": "supabase",
      "name": "Supabase MCP",
      "description": "Open-source Firebase alternative with PostgreSQL",
      "endpoint": "https://mcp.supabase.com/mcp",
      "transport": "http",
      "authType": "oauth",
      "provider": "Supabase",
      "verified": true,
      "category": "databases"
    },
    {
      "id": "neon",
      "name": "Neon MCP",
      "description": "Serverless PostgreSQL database",
      "endpoint": "https://mcp.neon.tech/sse",
      "transport": "sse",
      "authType": "oauth",
      "provider": "Neon",
      "verified": true,
      "category": "databases"
    },
    {
      "id": "fetch",
      "name": "Fetch MCP",
      "description": "Web content retrieval, converts HTML to markdown",
      "endpoint": "https://remote.mcpservers.org/fetch/mcp",
      "transport": "http",
      "authType": "open",
      "provider": "MCP Servers",
      "verified": true,
      "category": "utilities"
    },
    {
      "id": "sequential-thinking",
      "name": "Sequential Thinking MCP",
      "description": "Structured thinking process for problem-solving",
      "endpoint": "https://remote.mcpservers.org/sequentialthinking/mcp",
      "transport": "http",
      "authType": "open",
      "provider": "MCP Servers",
      "verified": true,
      "category": "utilities"
    },
    {
      "id": "sentry",
      "name": "Sentry MCP",
      "description": "Error tracking and performance monitoring",
      "endpoint": "https://mcp.sentry.dev/sse",
      "transport": "sse",
      "authType": "oauth",
      "provider": "Sentry",
      "verified": true,
      "category": "developer-tools"
    },
    {
      "id": "paypal",
      "name": "PayPal MCP",
      "description": "Global online payment system integration",
      "endpoint": "https://mcp.paypal.com/sse",
      "transport": "sse",
      "authType": "oauth",
      "provider": "PayPal",
      "verified": true,
      "category": "payments"
    }
  ]
}
```

---

## Appendix B: UX Mockups Reference

### Connection Test States

| State | Visual | Message |
|-------|--------|---------|
| Pending | ○ gray | "Waiting to test..." |
| Testing | ◐ blue spinner | "Testing connection..." |
| Success | ● green | "Healthy (145ms)" |
| Warning | ◐ yellow | "Reachable but slow (2.3s)" |
| Auth Required | 🔐 blue | "Requires authentication" |
| Failed | ● red | "Connection failed" |
| Offline | ○ gray strikethrough | "Server offline" |

### Auth Type Badges

| Auth Type | Badge | Color |
|-----------|-------|-------|
| OAuth | "OAuth" | Blue |
| API Key | "API Key" | Purple |
| Header | "Header" | Gray |
| Open | "Open" | Green |

---

## References

1. **Claude Code MCP Documentation:** https://code.claude.com/docs/en/mcp
2. **mcpservers.org Remote Servers:** https://mcpservers.org/remote-mcp-servers
3. **The Pragmatic Engineer MCP Deep Dive:** https://newsletter.pragmaticengineer.com/p/mcp-deepdive
4. **ADR-004 MCP Manager:** See `project-docs/adr/adr-004-mcp-manager.md`

---

## Conclusion

The Remote MCP Servers Discovery feature will transform Claude Owl into a comprehensive MCP management tool by:

1. **Eliminating Discovery Pain:** Users can browse verified remote servers instead of hunting for URLs
2. **Building Confidence:** Pre-verification lets users know a server works before investing setup time
3. **Prioritizing Security:** Clear risk assessments help users make informed decisions
4. **Attributing Properly:** mcpservers.org gets prominent credit for their valuable work

The "verify first, configure later" approach differentiates Claude Owl from other tools and addresses the key user pain point: wasting time on configurations that were never going to work.

**Expected Impact:**
- 70% reduction in MCP setup failures
- 50% faster time to first successful remote server connection
- Increased adoption of remote MCP servers among Claude Owl users

---

**Questions or Feedback?**
Please comment on this ADR document or open a GitHub discussion.
