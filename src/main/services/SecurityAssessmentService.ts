/**
 * Security Assessment Service
 *
 * Analyzes remote MCP servers and provides security context and warnings.
 * Helps users make informed decisions about which servers to trust.
 *
 * @see ADR-010: Remote MCP Servers Discovery & Connection Verification
 */

import type {
  RemoteMCPServer,
  SecurityContext,
  SecurityWarning,
  SecurityRiskLevel,
  ConnectionTestResult,
} from '@/shared/types';

/**
 * Service for assessing security of remote MCP servers
 */
export class SecurityAssessmentService {
  /**
   * Assess the security context of a remote MCP server
   */
  assessRemoteServer(
    server: RemoteMCPServer,
    connectionTestResult?: ConnectionTestResult
  ): SecurityContext {
    console.log('[SecurityAssessmentService] Assessing server:', server.id);

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

    // Check OAuth scopes for sensitive permissions
    const sensitiveScopes = this.checkSensitiveScopes(server);
    if (sensitiveScopes.length > 0) {
      riskFactors.push(`Requests sensitive permissions: ${sensitiveScopes.join(', ')}`);
    }

    // Check if provider is well-known
    const wellKnownProviders = [
      'GitHub',
      'Notion',
      'Figma',
      'Linear',
      'Supabase',
      'Neon',
      'Sentry',
      'PayPal',
      'Atlassian',
      'Asana',
      'Intercom',
      'MCP Servers',
    ];
    if (!wellKnownProviders.includes(server.provider)) {
      riskFactors.push('Unknown provider');
    }

    // Calculate risk level
    const riskLevel = this.calculateRiskLevel(riskFactors, server);

    // Build security context
    const context: SecurityContext = {
      isVerifiedProvider: server.verified,
      isOfficialServer: server.source === 'mcpservers.org',
      hasValidTLS: true, // Assume true; updated by connection test
      riskLevel,
      riskFactors,
      dataAccessDescription: this.getDataAccessDescription(server),
    };

    // Add optional properties only if they have values
    if (server.authConfig?.requiredScopes && server.authConfig.requiredScopes.length > 0) {
      context.requestedScopes = server.authConfig.requiredScopes;
    }

    // Add TLS info from connection test if available
    if (connectionTestResult) {
      const tlsStep = connectionTestResult.steps?.find(s => s.name === 'TLS/SSL Verification');
      if (tlsStep?.status === 'warning' || tlsStep?.status === 'error') {
        context.hasValidTLS = false;
        riskFactors.push('TLS certificate issue');
      }
    }

    console.log('[SecurityAssessmentService] Assessment complete:', {
      serverId: server.id,
      riskLevel,
      riskFactorCount: riskFactors.length,
    });

    return context;
  }

  /**
   * Generate security warnings for a server
   */
  generateWarnings(server: RemoteMCPServer, context: SecurityContext): SecurityWarning[] {
    const warnings: SecurityWarning[] = [];

    // Unverified provider warning
    if (!context.isVerifiedProvider) {
      warnings.push({
        severity: 'warning',
        title: 'Unverified Provider',
        description:
          'This server is not from a verified provider. Exercise caution when granting access to sensitive data.',
        recommendation:
          "Review the server's documentation and only proceed if you trust the provider.",
      });
    }

    // Community server warning
    if (server.source === 'community') {
      warnings.push({
        severity: 'warning',
        title: 'Community Server',
        description:
          'This server was submitted by the community and has not been officially reviewed.',
        recommendation:
          'Verify the server source and review any available documentation before connecting.',
      });
    }

    // Open access warning
    if (server.authType === 'open') {
      warnings.push({
        severity: 'info',
        title: 'Open Access',
        description:
          'This server allows open access without authentication. Data sent to this server may not be encrypted end-to-end.',
        recommendation: 'Avoid sending sensitive or personal data through this server.',
      });
    }

    // Sensitive permissions warning
    const sensitiveScopes = this.checkSensitiveScopes(server);
    if (sensitiveScopes.length > 0) {
      warnings.push({
        severity: 'warning',
        title: 'Sensitive Permissions',
        description: `This server requests access to: ${sensitiveScopes.join(', ')}. These permissions allow significant access to your data.`,
        recommendation: 'Only grant access if you understand and need these capabilities.',
      });
    }

    // TLS warning
    if (!context.hasValidTLS) {
      warnings.push({
        severity: 'critical',
        title: 'TLS Certificate Issue',
        description: 'The server has a TLS certificate issue. Your connection may not be secure.',
        recommendation: 'Do not proceed unless you understand the security implications.',
      });
    }

    // High risk warning
    if (context.riskLevel === 'high') {
      warnings.push({
        severity: 'critical',
        title: 'High Risk Server',
        description:
          'Multiple risk factors have been identified with this server. Proceed with extreme caution.',
        recommendation:
          'Consider whether you really need this server and if there are safer alternatives.',
      });
    }

    return warnings;
  }

  /**
   * Get a human-readable risk summary
   */
  getRiskSummary(context: SecurityContext): string {
    switch (context.riskLevel) {
      case 'low':
        return 'This server appears to be safe. It is from a verified provider with standard permissions.';
      case 'medium':
        return 'This server has some risk factors. Review the warnings before proceeding.';
      case 'high':
        return 'This server has significant risk factors. Exercise extreme caution.';
      default:
        return 'Unable to fully assess server security. Proceed with caution.';
    }
  }

  /**
   * Check if server should show a security dialog before installation
   */
  shouldShowSecurityDialog(context: SecurityContext): boolean {
    return context.riskLevel !== 'low' || context.riskFactors.length > 0;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Check for sensitive OAuth scopes
   */
  private checkSensitiveScopes(server: RemoteMCPServer): string[] {
    const sensitivePatterns = [
      'write',
      'delete',
      'admin',
      'manage',
      'full',
      'all',
      'workflow',
      'execute',
    ];

    const scopes = server.authConfig?.requiredScopes || [];
    return scopes.filter(scope =>
      sensitivePatterns.some(pattern => scope.toLowerCase().includes(pattern))
    );
  }

  /**
   * Calculate overall risk level based on factors
   */
  private calculateRiskLevel(riskFactors: string[], server: RemoteMCPServer): SecurityRiskLevel {
    // Critical factors that immediately make it high risk
    const criticalFactors = riskFactors.filter(
      f => f.includes('TLS') || f.includes('Unknown provider') || f.includes('Community')
    );

    if (criticalFactors.length >= 2) {
      return 'high';
    }

    if (riskFactors.length >= 3) {
      return 'high';
    }

    if (riskFactors.length >= 1) {
      return 'medium';
    }

    // Verified, official source, no risk factors
    if (server.verified && server.source === 'mcpservers.org') {
      return 'low';
    }

    return 'unknown';
  }

  /**
   * Get human-readable data access description
   */
  private getDataAccessDescription(server: RemoteMCPServer): string {
    const descriptions: string[] = [];

    switch (server.category) {
      case 'developer-tools':
        descriptions.push('Access to development tools and workflows');
        break;
      case 'databases':
        descriptions.push('Access to database operations and data');
        break;
      case 'productivity':
        descriptions.push('Access to productivity tools and documents');
        break;
      case 'payments':
        descriptions.push('Access to payment and financial information');
        break;
      case 'content':
        descriptions.push('Access to content and media');
        break;
      case 'utilities':
        descriptions.push('Access to utility functions');
        break;
      case 'security':
        descriptions.push('Access to security scanning tools');
        break;
      case 'analytics':
        descriptions.push('Access to analytics and metrics');
        break;
    }

    // Add OAuth scope descriptions
    const scopes = server.authConfig?.requiredScopes || [];
    if (scopes.some(s => s.includes('repo'))) {
      descriptions.push('Read and write to repositories');
    }
    if (scopes.some(s => s.includes('workflow'))) {
      descriptions.push('Manage workflows and automations');
    }
    if (scopes.some(s => s.includes('admin'))) {
      descriptions.push('Administrative access');
    }

    return descriptions.join('. ') || 'General access to server features';
  }
}
