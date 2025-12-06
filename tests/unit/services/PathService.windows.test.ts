/**
 * Unit tests for PathService - Windows Platform Support
 * Tests platform-specific path handling for Windows vs macOS
 *
 * Note: Platform-specific behavior tested at runtime on target platform.
 * These tests verify the logic and type safety of overloaded methods.
 */

import { describe, it, expect } from 'vitest';
import { PathService } from '@/main/services/core/PathService';

describe('PathService - Windows Platform Support', () => {
  let service: PathService;

  beforeEach(() => {
    service = new PathService();
  });

  describe('getProjectClaudeDir - Enforce Explicit projectPath', () => {
    it('should throw error when projectPath is not provided', () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        service.getProjectClaudeDir();
      }).toThrow('projectPath is required');
    });

    it('should throw error when projectPath is empty string', () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        service.getProjectClaudeDir('');
      }).toThrow('projectPath is required');
    });

    it('should return correct path when projectPath is provided (Windows-style)', () => {
      const projectPath = 'C:\\Users\\TestUser\\Projects\\my-project';
      const result = service.getProjectClaudeDir(projectPath);

      expect(result).toContain(projectPath);
      expect(result).toContain('.claude');
    });

    it('should return correct path when projectPath is provided (Unix-style)', () => {
      const projectPath = '/Users/testuser/Projects/my-project';
      const result = service.getProjectClaudeDir(projectPath);

      // Normalize paths for comparison (path.join converts / to \ on Windows)
      const normalizedResult = result.replace(/\\/g, '/');
      expect(normalizedResult).toContain(projectPath);
      expect(result).toContain('.claude');
    });

    it('should include helpful error message mentioning design constraint', () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        service.getProjectClaudeDir();
      }).toThrow('standalone app without project context');
    });
  });

  describe('Path Methods - Cross-Platform Type Safety', () => {
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
      });
    });
  });

  describe('validatePath - Security for Both Platforms', () => {
    it('should prevent directory traversal on Unix', () => {
      const allowedDir = '/Users/test/Projects';
      const maliciousPath = '/Users/test/Projects/../../../etc/passwd';

      const isValid = service.validatePath(maliciousPath, allowedDir);

      expect(isValid).toBe(false);
    });

    it('should allow valid paths within allowed directory (Unix)', () => {
      const allowedDir = '/Users/test/Projects';
      const validPath = '/Users/test/Projects/my-project/.claude';

      const isValid = service.validatePath(validPath, allowedDir);

      expect(isValid).toBe(true);
    });
  });

  describe('Path Utility Methods - Cross-Platform', () => {
    it('should normalize paths correctly on Unix', () => {
      const paths = ['/Users/test/../test/file.txt', 'relative/./path'];

      paths.forEach(p => {
        const normalized = service.normalizePath(p);
        expect(normalized).toBeTruthy();
      });
    });

    it('should calculate relative paths correctly', () => {
      const from = '/Users/test/Projects/project1';
      const to = '/Users/test/Projects/project2';

      const relative = service.getRelativePath(from, to);

      expect(relative).toBeTruthy();
      expect(relative).not.toContain(from);
    });

    it('should extract basename correctly on Unix', () => {
      const unixPath = '/Users/test/file.txt';

      expect(service.basename(unixPath)).toBe('file.txt');
    });

    it('should extract dirname correctly on Unix', () => {
      const unixPath = '/Users/test/file.txt';

      const unixDir = service.dirname(unixPath);

      expect(unixDir).toContain('test');
      expect(unixDir).not.toContain('file.txt');
    });

    it('should extract extension correctly', () => {
      const paths = ['file.txt', 'script.js', 'config.json', 'README.md'];

      paths.forEach(p => {
        const ext = service.extname(p);
        expect(ext).toMatch(/^\.\w+$/);
      });
    });
  });

  describe('Type Safety - Overloaded Method Signatures', () => {
    it('should enforce projectPath when location is "project" for getSkillsPath', () => {
      const projectPath = '/test/project';
      // This should compile and work
      const result = service.getSkillsPath('project', projectPath);
      expect(result).toContain('skills');
    });

    it('should allow optional projectPath when location is "user" for getSkillsPath', () => {
      // This should compile and work without projectPath
      const result = service.getSkillsPath('user');
      expect(result).toContain('skills');
    });

    it('should enforce projectPath when location is "project" for getAgentsPath', () => {
      const projectPath = '/test/project';
      const result = service.getAgentsPath('project', projectPath);
      expect(result).toContain('agents');
    });

    it('should enforce projectPath when location is "project" for getCommandsPath', () => {
      const projectPath = '/test/project';
      const result = service.getCommandsPath('project', projectPath);
      expect(result).toContain('commands');
    });

    it('should enforce projectPath when location is "project" for getSettingsPath', () => {
      const projectPath = '/test/project';
      const result = service.getSettingsPath('project', projectPath);
      expect(result).toContain('settings.json');
    });

    it('should enforce projectPath when location is "project" for getPluginsPath', () => {
      const projectPath = '/test/project';
      const result = service.getPluginsPath('project', projectPath);
      expect(result).toContain('plugins');
    });
  });
});
