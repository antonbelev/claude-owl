/**
 * Unit tests for PathService - Windows Platform Support
 * Tests platform-specific path handling for Windows vs macOS
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PathService } from '@/main/services/core/PathService';
import { platform } from 'os';

// Mock os module
vi.mock('os', async importOriginal => {
  const actual = await importOriginal<typeof import('os')>();
  return {
    ...actual,
    homedir: vi.fn(() => '/Users/testuser'),
    platform: vi.fn(() => 'darwin'),
  };
});

describe('PathService - Windows Platform Support', () => {
  let service: PathService;
  let originalPlatform: string;

  beforeEach(() => {
    service = new PathService();
    originalPlatform = process.platform;
  });

  afterEach(() => {
    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true,
      configurable: true,
    });
    vi.clearAllMocks();
  });

  describe('getDebugLogsPath - Platform-Specific Paths', () => {
    it('should return Windows path format on Windows', () => {
      // Mock Windows platform
      vi.mocked(platform).mockReturnValue('win32');

      // Mock APPDATA environment variable
      const originalAppData = process.env.APPDATA;
      process.env.APPDATA = 'C:\\Users\\TestUser\\AppData\\Roaming';

      const logsPath = service.getDebugLogsPath();

      // Should use Windows path format with backslashes
      expect(logsPath).toContain('AppData');
      expect(logsPath).toContain('claude-owl');
      expect(logsPath).toContain('logs');
      expect(logsPath).toMatch(/Roaming[\\\/]claude-owl[\\\/]logs$/);

      // Restore
      process.env.APPDATA = originalAppData;
    });

    it('should return macOS path format on macOS', () => {
      vi.mocked(platform).mockReturnValue('darwin');

      const logsPath = service.getDebugLogsPath();

      // Should use macOS Library/Caches path
      expect(logsPath).toContain('Library');
      expect(logsPath).toContain('Caches');
      expect(logsPath).toContain('claude-owl');
      expect(logsPath).toMatch(/Caches[\/]claude-owl[\/]logs$/);
    });

    it('should return Linux path format on Linux', () => {
      vi.mocked(platform).mockReturnValue('linux');

      const logsPath = service.getDebugLogsPath();

      // Should use Linux .cache path
      expect(logsPath).toContain('.cache');
      expect(logsPath).toContain('claude-owl');
      expect(logsPath).toMatch(/\.cache[\/]claude-owl[\/]logs$/);
    });

    it('should handle missing APPDATA on Windows with fallback', () => {
      vi.mocked(platform).mockReturnValue('win32');

      // Remove APPDATA
      const originalAppData = process.env.APPDATA;
      delete process.env.APPDATA;

      const logsPath = service.getDebugLogsPath();

      // Should still return a valid path using fallback
      expect(logsPath).toContain('AppData');
      expect(logsPath).toContain('Roaming');
      expect(logsPath).toContain('claude-owl');
      expect(logsPath).toContain('logs');

      // Restore
      process.env.APPDATA = originalAppData;
    });

    it('should log warning when APPDATA is missing on Windows', () => {
      vi.mocked(platform).mockReturnValue('win32');

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const originalAppData = process.env.APPDATA;
      delete process.env.APPDATA;

      service.getDebugLogsPath();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('APPDATA environment variable not found')
      );

      // Restore
      consoleWarnSpy.mockRestore();
      process.env.APPDATA = originalAppData;
    });

    it('should log debug path on Windows', () => {
      vi.mocked(platform).mockReturnValue('win32');

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      process.env.APPDATA = 'C:\\Users\\TestUser\\AppData\\Roaming';

      service.getDebugLogsPath();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PathService] Windows debug logs path:')
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe('getProjectClaudeDir - Enforce Explicit projectPath', () => {
    it('should throw error when projectPath is not provided', () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        service.getProjectClaudeDir();
      }).toThrow('projectPath is required');

      expect(() => {
        // @ts-expect-error - Testing runtime validation
        service.getProjectClaudeDir('');
      }).toThrow('projectPath is required');

      expect(() => {
        // @ts-expect-error - Testing runtime validation
        service.getProjectClaudeDir(null);
      }).toThrow('projectPath is required');

      expect(() => {
        // @ts-expect-error - Testing runtime validation
        service.getProjectClaudeDir(undefined);
      }).toThrow('projectPath is required');
    });

    it('should return correct path when projectPath is provided (Windows)', () => {
      const projectPath = 'C:\\Users\\TestUser\\Projects\\my-project';
      const result = service.getProjectClaudeDir(projectPath);

      expect(result).toContain(projectPath);
      expect(result).toMatch(/\.claude$/);
    });

    it('should return correct path when projectPath is provided (macOS)', () => {
      const projectPath = '/Users/testuser/Projects/my-project';
      const result = service.getProjectClaudeDir(projectPath);

      expect(result).toContain(projectPath);
      expect(result).toMatch(/\.claude$/);
    });

    it('should include helpful error message mentioning design constraint', () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        service.getProjectClaudeDir();
      }).toThrow('standalone app without project context');
    });

    it('should reference ADR in error message', () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        service.getProjectClaudeDir();
      }).toThrow('ADR-007');
    });
  });

  describe('Path Methods - Cross-Platform Compatibility', () => {
    const testProjectPath = '/test/project';

    it('should handle Windows-style paths in getSkillsPath', () => {
      const windowsPath = 'C:\\Users\\Test\\Projects\\my-project';
      const result = service.getSkillsPath('project', windowsPath);

      expect(result).toContain('skills');
    });

    it('should handle Unix-style paths in getSkillsPath', () => {
      const unixPath = '/Users/test/Projects/my-project';
      const result = service.getSkillsPath('project', unixPath);

      expect(result).toContain('skills');
    });

    it('should handle Windows-style paths in getAgentsPath', () => {
      const windowsPath = 'C:\\Users\\Test\\Projects\\my-project';
      const result = service.getAgentsPath('project', windowsPath);

      expect(result).toContain('agents');
    });

    it('should handle Unix-style paths in getCommandsPath', () => {
      const unixPath = '/Users/test/Projects/my-project';
      const result = service.getCommandsPath('project', unixPath);

      expect(result).toContain('commands');
    });

    it('should use path.join for cross-platform compatibility', () => {
      // All methods should use path.join internally
      const testCases = [
        service.getUserClaudeDir(),
        service.getProjectClaudeDir(testProjectPath),
        service.getSkillsPath('user'),
        service.getAgentsPath('user'),
        service.getCommandsPath('user'),
        service.getSettingsPath('user'),
        service.getPluginsPath('user'),
      ];

      // All paths should be properly normalized
      testCases.forEach(pathResult => {
        expect(pathResult).toBeTruthy();
        expect(pathResult).not.toContain('//'); // No double slashes
        expect(pathResult).not.toContain('\\\\'); // No double backslashes
      });
    });
  });

  describe('validatePath - Security for Both Platforms', () => {
    it('should prevent directory traversal on Windows', () => {
      const allowedDir = 'C:\\Users\\Test\\Projects';
      const maliciousPath = 'C:\\Users\\Test\\Projects\\..\\..\\..\\Windows\\System32';

      const isValid = service.validatePath(maliciousPath, allowedDir);

      expect(isValid).toBe(false);
    });

    it('should prevent directory traversal on Unix', () => {
      const allowedDir = '/Users/test/Projects';
      const maliciousPath = '/Users/test/Projects/../../../etc/passwd';

      const isValid = service.validatePath(maliciousPath, allowedDir);

      expect(isValid).toBe(false);
    });

    it('should allow valid paths within allowed directory (Windows)', () => {
      const allowedDir = 'C:\\Users\\Test\\Projects';
      const validPath = 'C:\\Users\\Test\\Projects\\my-project\\.claude';

      const isValid = service.validatePath(validPath, allowedDir);

      expect(isValid).toBe(true);
    });

    it('should allow valid paths within allowed directory (Unix)', () => {
      const allowedDir = '/Users/test/Projects';
      const validPath = '/Users/test/Projects/my-project/.claude';

      const isValid = service.validatePath(validPath, allowedDir);

      expect(isValid).toBe(true);
    });
  });

  describe('Path Utility Methods - Cross-Platform', () => {
    it('should normalize paths correctly on both platforms', () => {
      const paths = [
        'C:\\Users\\Test\\..\\Test\\file.txt',
        '/Users/test/../test/file.txt',
        'relative/./path',
      ];

      paths.forEach(p => {
        const normalized = service.normalizePath(p);
        expect(normalized).not.toContain('..');
        expect(normalized).not.toContain('./');
      });
    });

    it('should calculate relative paths correctly', () => {
      const from = '/Users/test/Projects/project1';
      const to = '/Users/test/Projects/project2';

      const relative = service.getRelativePath(from, to);

      expect(relative).toBeTruthy();
      expect(relative).not.toContain(from);
    });

    it('should extract basename correctly on both platforms', () => {
      const windowsPath = 'C:\\Users\\Test\\file.txt';
      const unixPath = '/Users/test/file.txt';

      expect(service.basename(windowsPath)).toBe('file.txt');
      expect(service.basename(unixPath)).toBe('file.txt');
    });

    it('should extract dirname correctly on both platforms', () => {
      const windowsPath = 'C:\\Users\\Test\\file.txt';
      const unixPath = '/Users/test/file.txt';

      const windowsDir = service.dirname(windowsPath);
      const unixDir = service.dirname(unixPath);

      expect(windowsDir).toContain('Test');
      expect(unixDir).toContain('test');
    });

    it('should extract extension correctly', () => {
      const paths = ['file.txt', 'script.js', 'config.json', 'README.md'];

      paths.forEach(p => {
        const ext = service.extname(p);
        expect(ext).toMatch(/^\.\w+$/);
      });
    });
  });
});
