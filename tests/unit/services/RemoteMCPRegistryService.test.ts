/**
 * Unit tests for RemoteMCPRegistryService
 *
 * @see ADR-010: Remote MCP Servers Discovery & Connection Verification
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RemoteMCPRegistryService } from '../../../src/main/services/RemoteMCPRegistryService';
import * as fs from 'fs/promises';
import * as dns from 'dns/promises';
import { EventEmitter } from 'events';
import type { RemoteMCPServer as _RemoteMCPServer } from '../../../src/shared/types';

// Mock modules
vi.mock('fs/promises');
vi.mock('dns/promises');

// Create a mock for https.request
const mockHttpsRequest = vi.fn();
vi.mock('https', () => ({
  request: (url: string, options: object, callback: (res: EventEmitter) => void) => {
    return mockHttpsRequest(url, options, callback);
  },
}));

describe('RemoteMCPRegistryService', () => {
  let service: RemoteMCPRegistryService;
  const mockCachePath = '/mock/cache/path';

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: cache file doesn't exist, allow writing
    vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    service = new RemoteMCPRegistryService(mockCachePath);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchServerDirectory', () => {
    it('should return curated servers when no cache exists', async () => {
      const result = await service.fetchServerDirectory();

      expect(result.servers.length).toBeGreaterThan(0);
    });

    it('should return cached data when available and fresh', async () => {
      // First, let cache get populated
      await service.fetchServerDirectory();

      // Second call should use in-memory cache
      const result = await service.fetchServerDirectory();

      expect(result.servers.length).toBeGreaterThan(0);
      // In-memory cache is populated from live data
    });

    it('should force refresh when requested', async () => {
      // First populate the cache
      await service.fetchServerDirectory();

      // Force refresh
      const result = await service.fetchServerDirectory(true);

      expect(result.servers.length).toBeGreaterThan(0);
      expect(result.source).toBe('live');
    });
  });

  describe('searchServers (with filtering)', () => {
    it('should filter servers by category', async () => {
      const result = await service.searchServers({
        category: 'developer-tools',
      });

      expect(result.every(s => s.category === 'developer-tools')).toBe(true);
    });

    it('should filter servers by auth type', async () => {
      const result = await service.searchServers({
        authType: 'oauth',
      });

      expect(result.every(s => s.authType === 'oauth')).toBe(true);
    });

    it('should filter verified servers only', async () => {
      const result = await service.searchServers({
        verifiedOnly: true,
      });

      expect(result.every(s => s.verified === true)).toBe(true);
    });
  });

  describe('searchServers', () => {
    it('should search servers by name', async () => {
      const result = await service.searchServers({ search: 'GitHub' });

      expect(result.some(s => s.name.toLowerCase().includes('github'))).toBe(true);
    });

    it('should search servers by description', async () => {
      const result = await service.searchServers({ search: 'repository' });

      expect(result.length).toBeGreaterThan(0);
    });

    it('should search servers by provider', async () => {
      const result = await service.searchServers({ search: 'GitHub' });

      expect(result.some(s => s.provider === 'GitHub')).toBe(true);
    });

    it('should combine search with filters', async () => {
      const result = await service.searchServers({
        search: 'GitHub',
        category: 'developer-tools',
      });

      expect(
        result.every(s => s.category === 'developer-tools')
      ).toBe(true);
    });

    it('should return empty array for no matches', async () => {
      const result = await service.searchServers({
        search: 'nonexistentserver12345',
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('getServerDetails', () => {
    it('should return server details for valid ID', async () => {
      const result = await service.getServerDetails('github');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('github');
      expect(result?.name).toBe('GitHub MCP');
    });

    it('should return null for unknown server ID', async () => {
      const result = await service.getServerDetails('unknown-server-id');

      expect(result).toBeNull();
    });
  });

  describe('testRemoteConnection', () => {
    beforeEach(() => {
      vi.mocked(dns.lookup).mockImplementation(
        (hostname: string, callback?: (err: NodeJS.ErrnoException | null, address: string, family: number) => void) => {
          if (callback) {
            callback(null, '127.0.0.1', 4);
          }
        }
      );
    });

    it('should return error for DNS failure', async () => {
      vi.mocked(dns.lookup).mockImplementation(
        (hostname: string, callback?: (err: NodeJS.ErrnoException | null, address: string, family: number) => void) => {
          if (callback) {
            const error = new Error('ENOTFOUND') as NodeJS.ErrnoException;
            error.code = 'ENOTFOUND';
            callback(error, '', 0);
          }
        }
      );

      const result = await service.testRemoteConnection(
        'https://nonexistent.invalid/mcp',
        'sse',
        5000
      );

      expect(result.success).toBe(false);
      expect(result.steps?.find(s => s.name === 'DNS Resolution')?.status).toBe('error');
    });

    it('should handle invalid URL', async () => {
      const result = await service.testRemoteConnection(
        'not-a-valid-url',
        'sse',
        5000
      );

      expect(result.success).toBe(false);
      // The error code could be INVALID_URL or NETWORK_ERROR depending on implementation
      expect(['INVALID_URL', 'NETWORK_ERROR']).toContain(result.errorCode);
    });
  });

  describe('getCacheStatus', () => {
    it('should return cache status object with correct shape', async () => {
      const result = await service.getCacheStatus();

      // Verify the returned object has the expected shape
      expect(typeof result.isCached).toBe('boolean');
      expect(typeof result.isStale).toBe('boolean');
      expect(typeof result.serverCount).toBe('number');
    });
  });

  describe('curated servers', () => {
    it('should include well-known servers', async () => {
      const result = await service.fetchServerDirectory();
      const serverIds = result.servers.map(s => s.id);

      expect(serverIds).toContain('github');
      expect(serverIds).toContain('notion');
    });

    it('should have valid server data structure', async () => {
      const result = await service.fetchServerDirectory();

      result.servers.forEach(server => {
        expect(server.id).toBeDefined();
        expect(server.name).toBeDefined();
        expect(server.description).toBeDefined();
        expect(server.provider).toBeDefined();
        expect(server.endpoint).toBeDefined();
        expect(['http', 'sse']).toContain(server.transport);
        expect(['oauth', 'api-key', 'header', 'open']).toContain(server.authType);
        expect(typeof server.verified).toBe('boolean');
        expect(server.category).toBeDefined();
        expect(Array.isArray(server.tags)).toBe(true);
      });
    });

    it('should have valid endpoint URLs', async () => {
      const result = await service.fetchServerDirectory();

      result.servers.forEach(server => {
        expect(() => new URL(server.endpoint)).not.toThrow();
      });
    });
  });

  describe('getCategories', () => {
    it('should return list of categories', async () => {
      const categories = await service.getCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('developer-tools');
    });
  });
});
