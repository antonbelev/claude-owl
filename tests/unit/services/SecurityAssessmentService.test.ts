/**
 * Unit tests for SecurityAssessmentService
 *
 * @see ADR-010: Remote MCP Servers Discovery & Connection Verification
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityAssessmentService } from '../../../src/main/services/SecurityAssessmentService';
import type { RemoteMCPServer, ConnectionTestResult } from '../../../src/shared/types';

describe('SecurityAssessmentService', () => {
  let service: SecurityAssessmentService;

  beforeEach(() => {
    service = new SecurityAssessmentService();
  });

  describe('assessRemoteServer', () => {
    const createMockServer = (overrides: Partial<RemoteMCPServer> = {}): RemoteMCPServer => ({
      id: 'test-server',
      name: 'Test Server',
      description: 'A test server',
      provider: 'GitHub',
      endpoint: 'https://api.github.com/mcp',
      transport: 'sse',
      authType: 'oauth',
      verified: true,
      source: 'mcpservers.org',
      category: 'developer-tools',
      tags: ['test'],
      ...overrides,
    });

    it('should return low risk for verified official server', () => {
      const server = createMockServer({
        verified: true,
        source: 'mcpservers.org',
        provider: 'GitHub',
        authType: 'oauth',
      });

      const result = service.assessRemoteServer(server);

      expect(result.riskLevel).toBe('low');
      expect(result.isVerifiedProvider).toBe(true);
      expect(result.isOfficialServer).toBe(true);
      expect(result.riskFactors).toHaveLength(0);
    });

    it('should flag unverified provider as risk factor', () => {
      const server = createMockServer({
        verified: false,
      });

      const result = service.assessRemoteServer(server);

      expect(result.riskFactors).toContain('Unverified provider');
      expect(result.isVerifiedProvider).toBe(false);
    });

    it('should flag community source as risk factor', () => {
      const server = createMockServer({
        source: 'community',
      });

      const result = service.assessRemoteServer(server);

      expect(result.riskFactors).toContain('Community-submitted server');
    });

    it('should flag open auth as risk factor', () => {
      const server = createMockServer({
        authType: 'open',
      });

      const result = service.assessRemoteServer(server);

      expect(result.riskFactors).toContain('Open access (no authentication)');
    });

    it('should flag unknown provider as risk factor', () => {
      const server = createMockServer({
        provider: 'Unknown Random Provider',
      });

      const result = service.assessRemoteServer(server);

      expect(result.riskFactors).toContain('Unknown provider');
    });

    it('should flag sensitive OAuth scopes', () => {
      const server = createMockServer({
        authConfig: {
          type: 'oauth',
          requiredScopes: ['repo', 'admin:org', 'workflow'],
        },
      });

      const result = service.assessRemoteServer(server);

      expect(result.riskFactors.some(f => f.includes('sensitive permissions'))).toBe(true);
      expect(result.requestedScopes).toContain('repo');
      expect(result.requestedScopes).toContain('admin:org');
    });

    it('should calculate medium risk for one or two risk factors', () => {
      const server = createMockServer({
        verified: false,
        provider: 'GitHub', // Well-known provider
      });

      const result = service.assessRemoteServer(server);

      expect(result.riskLevel).toBe('medium');
    });

    it('should calculate high risk for multiple risk factors', () => {
      const server = createMockServer({
        verified: false,
        source: 'community',
        provider: 'Unknown Provider',
        authType: 'open',
      });

      const result = service.assessRemoteServer(server);

      expect(result.riskLevel).toBe('high');
    });

    it('should include TLS info from connection test', () => {
      const server = createMockServer();
      const testResult: ConnectionTestResult = {
        success: true,
        steps: [
          {
            name: 'TLS/SSL Verification',
            status: 'warning',
            details: 'Certificate expires soon',
          },
        ],
      };

      const result = service.assessRemoteServer(server, testResult);

      expect(result.hasValidTLS).toBe(false);
      expect(result.riskFactors).toContain('TLS certificate issue');
    });

    it('should generate data access description based on category', () => {
      const serverDeveloper = createMockServer({ category: 'developer-tools' });
      const serverPayments = createMockServer({ category: 'payments' });
      const serverDatabase = createMockServer({ category: 'databases' });

      const resultDev = service.assessRemoteServer(serverDeveloper);
      const resultPay = service.assessRemoteServer(serverPayments);
      const resultDb = service.assessRemoteServer(serverDatabase);

      expect(resultDev.dataAccessDescription).toContain('development');
      expect(resultPay.dataAccessDescription).toContain('payment');
      expect(resultDb.dataAccessDescription).toContain('database');
    });
  });

  describe('generateWarnings', () => {
    const createMockServer = (overrides: Partial<RemoteMCPServer> = {}): RemoteMCPServer => ({
      id: 'test-server',
      name: 'Test Server',
      description: 'A test server',
      provider: 'Test Provider',
      endpoint: 'https://test.example.com/mcp',
      transport: 'sse',
      authType: 'oauth',
      verified: true,
      source: 'mcpservers.org',
      category: 'developer-tools',
      tags: ['test'],
      ...overrides,
    });

    it('should generate warning for unverified provider', () => {
      const server = createMockServer({ verified: false });
      const context = service.assessRemoteServer(server);

      const warnings = service.generateWarnings(server, context);

      expect(warnings.some(w => w.title === 'Unverified Provider')).toBe(true);
      expect(warnings.some(w => w.severity === 'warning')).toBe(true);
    });

    it('should generate warning for community server', () => {
      const server = createMockServer({ source: 'community' });
      const context = service.assessRemoteServer(server);

      const warnings = service.generateWarnings(server, context);

      expect(warnings.some(w => w.title === 'Community Server')).toBe(true);
    });

    it('should generate info for open access', () => {
      const server = createMockServer({ authType: 'open' });
      const context = service.assessRemoteServer(server);

      const warnings = service.generateWarnings(server, context);

      expect(warnings.some(w => w.title === 'Open Access')).toBe(true);
      expect(warnings.some(w => w.severity === 'info')).toBe(true);
    });

    it('should generate warning for sensitive permissions', () => {
      const server = createMockServer({
        authConfig: {
          type: 'oauth',
          requiredScopes: ['admin:org', 'delete_repo'],
        },
      });
      const context = service.assessRemoteServer(server);

      const warnings = service.generateWarnings(server, context);

      expect(warnings.some(w => w.title === 'Sensitive Permissions')).toBe(true);
    });

    it('should generate critical warning for TLS issues', () => {
      const server = createMockServer();
      const context = service.assessRemoteServer(server);
      context.hasValidTLS = false;

      const warnings = service.generateWarnings(server, context);

      expect(warnings.some(w => w.title === 'TLS Certificate Issue')).toBe(true);
      expect(warnings.some(w => w.severity === 'critical')).toBe(true);
    });

    it('should generate critical warning for high risk servers', () => {
      const server = createMockServer({
        verified: false,
        source: 'community',
        provider: 'Unknown Provider',
      });
      const context = service.assessRemoteServer(server);

      const warnings = service.generateWarnings(server, context);

      expect(warnings.some(w => w.title === 'High Risk Server')).toBe(true);
      expect(warnings.some(w => w.severity === 'critical')).toBe(true);
    });

    it('should include recommendations in warnings', () => {
      const server = createMockServer({ verified: false });
      const context = service.assessRemoteServer(server);

      const warnings = service.generateWarnings(server, context);

      warnings.forEach(warning => {
        expect(warning.recommendation).toBeDefined();
        expect(warning.recommendation.length).toBeGreaterThan(0);
      });
    });

    it('should return empty array for safe server', () => {
      const server = createMockServer({
        verified: true,
        source: 'mcpservers.org',
        provider: 'GitHub',
      });
      const context = service.assessRemoteServer(server);

      const warnings = service.generateWarnings(server, context);

      expect(warnings).toHaveLength(0);
    });
  });

  describe('getRiskSummary', () => {
    it('should return appropriate summary for low risk', () => {
      const context = {
        isVerifiedProvider: true,
        isOfficialServer: true,
        hasValidTLS: true,
        riskLevel: 'low' as const,
        riskFactors: [],
        dataAccessDescription: 'Test access',
      };

      const summary = service.getRiskSummary(context);

      expect(summary).toContain('safe');
      expect(summary).toContain('verified');
    });

    it('should return appropriate summary for medium risk', () => {
      const context = {
        isVerifiedProvider: false,
        isOfficialServer: true,
        hasValidTLS: true,
        riskLevel: 'medium' as const,
        riskFactors: ['Unverified provider'],
        dataAccessDescription: 'Test access',
      };

      const summary = service.getRiskSummary(context);

      expect(summary).toContain('risk factors');
    });

    it('should return appropriate summary for high risk', () => {
      const context = {
        isVerifiedProvider: false,
        isOfficialServer: false,
        hasValidTLS: false,
        riskLevel: 'high' as const,
        riskFactors: ['Multiple issues'],
        dataAccessDescription: 'Test access',
      };

      const summary = service.getRiskSummary(context);

      expect(summary).toContain('significant');
      expect(summary).toContain('caution');
    });

    it('should return cautious summary for unknown risk', () => {
      const context = {
        isVerifiedProvider: true,
        isOfficialServer: false,
        hasValidTLS: true,
        riskLevel: 'unknown' as const,
        riskFactors: [],
        dataAccessDescription: 'Test access',
      };

      const summary = service.getRiskSummary(context);

      expect(summary).toContain('caution');
    });
  });

  describe('shouldShowSecurityDialog', () => {
    it('should return false for low risk with no factors', () => {
      const context = {
        isVerifiedProvider: true,
        isOfficialServer: true,
        hasValidTLS: true,
        riskLevel: 'low' as const,
        riskFactors: [],
        dataAccessDescription: 'Test access',
      };

      expect(service.shouldShowSecurityDialog(context)).toBe(false);
    });

    it('should return true for medium risk', () => {
      const context = {
        isVerifiedProvider: false,
        isOfficialServer: true,
        hasValidTLS: true,
        riskLevel: 'medium' as const,
        riskFactors: ['Unverified provider'],
        dataAccessDescription: 'Test access',
      };

      expect(service.shouldShowSecurityDialog(context)).toBe(true);
    });

    it('should return true for high risk', () => {
      const context = {
        isVerifiedProvider: false,
        isOfficialServer: false,
        hasValidTLS: false,
        riskLevel: 'high' as const,
        riskFactors: ['Multiple issues'],
        dataAccessDescription: 'Test access',
      };

      expect(service.shouldShowSecurityDialog(context)).toBe(true);
    });

    it('should return true for low risk with risk factors', () => {
      const context = {
        isVerifiedProvider: true,
        isOfficialServer: true,
        hasValidTLS: true,
        riskLevel: 'low' as const,
        riskFactors: ['Some minor issue'],
        dataAccessDescription: 'Test access',
      };

      expect(service.shouldShowSecurityDialog(context)).toBe(true);
    });
  });

  describe('well-known providers', () => {
    const createMockServer = (provider: string): RemoteMCPServer => ({
      id: 'test-server',
      name: 'Test Server',
      description: 'A test server',
      provider,
      endpoint: 'https://test.example.com/mcp',
      transport: 'sse',
      authType: 'oauth',
      verified: true,
      source: 'mcpservers.org',
      category: 'developer-tools',
      tags: ['test'],
    });

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
    ];

    wellKnownProviders.forEach(provider => {
      it(`should recognize ${provider} as well-known provider`, () => {
        const server = createMockServer(provider);
        const result = service.assessRemoteServer(server);

        expect(result.riskFactors).not.toContain('Unknown provider');
      });
    });

    it('should flag unknown provider', () => {
      const server = createMockServer('Random Unknown Company');
      const result = service.assessRemoteServer(server);

      expect(result.riskFactors).toContain('Unknown provider');
    });
  });
});
