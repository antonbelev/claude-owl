import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VersionService } from '../../../src/main/services/VersionService';
import https from 'https';
import { EventEmitter } from 'events';

// Mock https module
vi.mock('https');

describe('VersionService', () => {
  let versionService: VersionService;

  beforeEach(() => {
    versionService = new VersionService();
    vi.clearAllMocks();
  });

  describe('checkVersion', () => {
    it('should detect when current version is outdated', async () => {
      // Mock successful GitHub API response
      mockGitHubApiResponse({
        tag_name: 'v0.6.0',
        html_url: 'https://github.com/antonbelev/claude-owl/releases/tag/v0.6.0',
        body: 'Release notes for v0.6.0',
        published_at: '2024-01-15T10:00:00Z',
        prerelease: false,
        draft: false,
      });

      const result = await versionService.checkVersion('0.5.1');

      expect(result).toEqual({
        currentVersion: '0.5.1',
        latestVersion: '0.6.0',
        isOutdated: true,
        releaseUrl: 'https://github.com/antonbelev/claude-owl/releases/tag/v0.6.0',
        releaseNotes: 'Release notes for v0.6.0',
        publishedAt: '2024-01-15T10:00:00Z',
      });
    });

    it('should detect when current version is up to date', async () => {
      mockGitHubApiResponse({
        tag_name: 'v0.5.1',
        html_url: 'https://github.com/antonbelev/claude-owl/releases/tag/v0.5.1',
        body: 'Release notes',
        published_at: '2024-01-10T10:00:00Z',
        prerelease: false,
        draft: false,
      });

      const result = await versionService.checkVersion('0.5.1');

      expect(result.isOutdated).toBe(false);
      expect(result.currentVersion).toBe('0.5.1');
      expect(result.latestVersion).toBe('0.5.1');
    });

    it('should handle version strings with "v" prefix', async () => {
      mockGitHubApiResponse({
        tag_name: 'v0.6.0',
        html_url: 'https://github.com/antonbelev/claude-owl/releases/tag/v0.6.0',
        body: 'Release notes',
        published_at: '2024-01-15T10:00:00Z',
        prerelease: false,
        draft: false,
      });

      const result = await versionService.checkVersion('v0.5.1');

      expect(result.currentVersion).toBe('0.5.1');
      expect(result.latestVersion).toBe('0.6.0');
      expect(result.isOutdated).toBe(true);
    });

    it('should correctly compare patch versions', async () => {
      mockGitHubApiResponse({
        tag_name: 'v0.5.2',
        html_url: 'https://github.com/antonbelev/claude-owl/releases/tag/v0.5.2',
        body: 'Patch release',
        published_at: '2024-01-15T10:00:00Z',
        prerelease: false,
        draft: false,
      });

      const result = await versionService.checkVersion('0.5.1');

      expect(result.isOutdated).toBe(true);
    });

    it('should correctly compare minor versions', async () => {
      mockGitHubApiResponse({
        tag_name: 'v0.6.0',
        html_url: 'https://github.com/antonbelev/claude-owl/releases/tag/v0.6.0',
        body: 'Minor release',
        published_at: '2024-01-15T10:00:00Z',
        prerelease: false,
        draft: false,
      });

      const result = await versionService.checkVersion('0.5.9');

      expect(result.isOutdated).toBe(true);
    });

    it('should correctly compare major versions', async () => {
      mockGitHubApiResponse({
        tag_name: 'v1.0.0',
        html_url: 'https://github.com/antonbelev/claude-owl/releases/tag/v1.0.0',
        body: 'Major release',
        published_at: '2024-01-15T10:00:00Z',
        prerelease: false,
        draft: false,
      });

      const result = await versionService.checkVersion('0.9.9');

      expect(result.isOutdated).toBe(true);
    });

    it('should reject pre-release versions', async () => {
      mockGitHubApiResponse({
        tag_name: 'v0.6.0-beta',
        html_url: 'https://github.com/antonbelev/claude-owl/releases/tag/v0.6.0-beta',
        body: 'Beta release',
        published_at: '2024-01-15T10:00:00Z',
        prerelease: true,
        draft: false,
      });

      await expect(versionService.checkVersion('0.5.1')).rejects.toThrow(
        'Latest release is a pre-release or draft'
      );
    });

    it('should reject draft releases', async () => {
      mockGitHubApiResponse({
        tag_name: 'v0.6.0',
        html_url: 'https://github.com/antonbelev/claude-owl/releases/tag/v0.6.0',
        body: 'Draft release',
        published_at: '2024-01-15T10:00:00Z',
        prerelease: false,
        draft: true,
      });

      await expect(versionService.checkVersion('0.5.1')).rejects.toThrow(
        'Latest release is a pre-release or draft'
      );
    });

    it('should handle GitHub API errors', async () => {
      mockGitHubApiError(404, 'Not Found');

      await expect(versionService.checkVersion('0.5.1')).rejects.toThrow(
        'GitHub API request failed: 404 Not Found'
      );
    });

    it('should handle network errors', async () => {
      mockNetworkError(new Error('Network error'));

      await expect(versionService.checkVersion('0.5.1')).rejects.toThrow('Network error');
    });

    it('should handle invalid JSON responses', async () => {
      mockInvalidJsonResponse();

      await expect(versionService.checkVersion('0.5.1')).rejects.toThrow(
        'Failed to parse GitHub API response'
      );
    });
  });
});

/**
 * Helper function to mock successful GitHub API response
 */
function mockGitHubApiResponse(releaseData: unknown) {
  const mockResponse = new EventEmitter() as unknown as NodeJS.ReadableStream & {
    statusCode: number;
    statusMessage: string;
  };
  mockResponse.statusCode = 200;
  mockResponse.statusMessage = 'OK';

  const mockedHttps = https as unknown as {
    get: ReturnType<typeof vi.fn>;
  };

  mockedHttps.get = vi.fn().mockImplementation((_url, _options, callback) => {
    callback(mockResponse);

    // Simulate data event
    setTimeout(() => {
      mockResponse.emit('data', JSON.stringify(releaseData));
      mockResponse.emit('end');
    }, 0);

    return new EventEmitter();
  });
}

/**
 * Helper function to mock GitHub API error response
 */
function mockGitHubApiError(statusCode: number, statusMessage: string) {
  const mockResponse = new EventEmitter() as unknown as NodeJS.ReadableStream & {
    statusCode: number;
    statusMessage: string;
  };
  mockResponse.statusCode = statusCode;
  mockResponse.statusMessage = statusMessage;

  const mockedHttps = https as unknown as {
    get: ReturnType<typeof vi.fn>;
  };

  mockedHttps.get = vi.fn().mockImplementation((_url, _options, callback) => {
    callback(mockResponse);

    setTimeout(() => {
      mockResponse.emit('end');
    }, 0);

    return new EventEmitter();
  });
}

/**
 * Helper function to mock network errors
 */
function mockNetworkError(error: Error) {
  const mockRequest = new EventEmitter();

  const mockedHttps = https as unknown as {
    get: ReturnType<typeof vi.fn>;
  };

  mockedHttps.get = vi.fn().mockImplementation(() => {
    setTimeout(() => {
      mockRequest.emit('error', error);
    }, 0);

    return mockRequest;
  });
}

/**
 * Helper function to mock invalid JSON response
 */
function mockInvalidJsonResponse() {
  const mockResponse = new EventEmitter() as unknown as NodeJS.ReadableStream & {
    statusCode: number;
    statusMessage: string;
  };
  mockResponse.statusCode = 200;
  mockResponse.statusMessage = 'OK';

  const mockedHttps = https as unknown as {
    get: ReturnType<typeof vi.fn>;
  };

  mockedHttps.get = vi.fn().mockImplementation((_url, _options, callback) => {
    callback(mockResponse);

    setTimeout(() => {
      mockResponse.emit('data', 'invalid json');
      mockResponse.emit('end');
    }, 0);

    return new EventEmitter();
  });
}
