import { describe, it, expect, beforeEach } from 'vitest';
import { PathService } from '@/main/services/core/PathService';
import path from 'path';
import { homedir } from 'os';

describe('PathService', () => {
  let pathService: PathService;

  beforeEach(() => {
    pathService = new PathService();
  });

  describe('getUserClaudeDir', () => {
    it('should return user claude directory path', () => {
      const result = pathService.getUserClaudeDir();
      expect(result).toBe(path.join(homedir(), '.claude'));
    });

    it('should always return the same path', () => {
      const result1 = pathService.getUserClaudeDir();
      const result2 = pathService.getUserClaudeDir();
      expect(result1).toBe(result2);
    });
  });

  describe('getProjectClaudeDir', () => {
    it('should return project claude directory for given path', () => {
      const projectPath = '/path/to/project';
      const result = pathService.getProjectClaudeDir(projectPath);
      expect(result).toBe(path.join(projectPath, '.claude'));
    });

    it('should return project claude directory for cwd if no path provided', () => {
      const result = pathService.getProjectClaudeDir();
      expect(result).toBe(path.join(process.cwd(), '.claude'));
    });
  });

  describe('getSkillsPath', () => {
    it('should return user skills path', () => {
      const result = pathService.getSkillsPath('user');
      expect(result).toBe(path.join(pathService.getUserClaudeDir(), 'skills'));
    });

    it('should return project skills path', () => {
      const projectPath = '/path/to/project';
      const result = pathService.getSkillsPath('project', projectPath);
      expect(result).toBe(path.join(projectPath, '.claude', 'skills'));
    });
  });

  describe('getSkillPath', () => {
    it('should return specific skill path', () => {
      const skillName = 'my-skill';
      const result = pathService.getSkillPath(skillName, 'user');
      expect(result).toContain('my-skill.md');
      expect(result).toContain('skills');
    });

    it('should handle special characters in skill name', () => {
      const skillName = 'my-awesome-skill';
      const result = pathService.getSkillPath(skillName, 'user');
      expect(result).toContain(skillName);
    });
  });

  describe('getAgentsPath', () => {
    it('should return user agents path', () => {
      const result = pathService.getAgentsPath('user');
      expect(result).toBe(path.join(pathService.getUserClaudeDir(), 'agents'));
    });

    it('should return project agents path', () => {
      const projectPath = '/path/to/project';
      const result = pathService.getAgentsPath('project', projectPath);
      expect(result).toBe(path.join(projectPath, '.claude', 'agents'));
    });
  });

  describe('getSettingsPath', () => {
    it('should return user settings path', () => {
      const result = pathService.getSettingsPath('user');
      expect(result).toBe(path.join(pathService.getUserClaudeDir(), 'settings.json'));
    });

    it('should return project settings path', () => {
      const projectPath = '/path/to/project';
      const result = pathService.getSettingsPath('project', projectPath);
      expect(result).toBe(path.join(projectPath, '.claude', 'settings.json'));
    });
  });

  describe('getLocalSettingsPath', () => {
    it('should return local settings path', () => {
      const result = pathService.getLocalSettingsPath('user');
      expect(result).toContain('settings.local.json');
    });
  });

  describe('getManagedSettingsPath', () => {
    it('should return managed settings path', () => {
      const result = pathService.getManagedSettingsPath();
      expect(result).toContain('settings.managed.json');
      expect(result).toContain('.claude');
    });
  });

  describe('getPluginsPath', () => {
    it('should return user plugins path', () => {
      const result = pathService.getPluginsPath('user');
      expect(result).toContain('plugins');
    });

    it('should return project plugins path', () => {
      const result = pathService.getPluginsPath('project', '/path/to/project');
      expect(result).toContain('plugins');
    });
  });

  describe('getDebugLogsPath', () => {
    it('should return debug logs path', () => {
      const result = pathService.getDebugLogsPath();
      expect(result).toBeDefined();
      expect(result).not.toBe('');
    });

    it('should return different paths for different platforms', () => {
      const currentPlatform = process.platform;
      const result = pathService.getDebugLogsPath();

      if (currentPlatform === 'darwin') {
        expect(result).toContain('Library');
        expect(result).toContain('Caches');
      } else if (currentPlatform === 'linux') {
        expect(result).toContain('.cache');
      }
    });
  });

  describe('validatePath', () => {
    it('should return true for valid absolute paths', () => {
      const result = pathService.validatePath('/path/to/file.txt');
      expect(result).toBe(true);
    });

    it('should allow paths with null bytes (PathService does basic check only)', () => {
      // PathService.validatePath only checks basic validity, not null bytes
      // Null byte validation is in ValidationService.validatePath
      const result = pathService.validatePath('/path/to/file\0.txt');
      expect(result).toBe(true);
    });

    it('should allow directory traversal without base dir', () => {
      // PathService only prevents traversal when baseDir is specified
      const result = pathService.validatePath('../../../etc/passwd');
      expect(result).toBe(true);
    });

    it('should prevent directory traversal when base dir is specified', () => {
      // When baseDir is specified, PathService checks if resolved path escapes base
      const result = pathService.validatePath('../../../etc/passwd', '/home/user');
      expect(result).toBe(false);
    });
  });

  describe('normalizePath', () => {
    it('should normalize path separators', () => {
      const result = pathService.normalizePath('/path//to///file.txt');
      expect(result).not.toContain('//');
    });

    it('should handle relative paths', () => {
      const result = pathService.normalizePath('./path/./to/file.txt');
      expect(result).toContain('path');
      expect(result).toContain('to');
    });
  });

  describe('getRelativePath', () => {
    it('should return relative path between directories', () => {
      const from = '/home/user/project';
      const to = '/home/user/project/src/file.ts';
      const result = pathService.getRelativePath(from, to);
      expect(result).toContain('src');
      expect(result).toContain('file.ts');
    });
  });

  describe('join', () => {
    it('should join path segments', () => {
      const result = pathService.join('path', 'to', 'file.txt');
      expect(result).toContain('path');
      expect(result).toContain('to');
      expect(result).toContain('file.txt');
    });
  });

  describe('basename', () => {
    it('should extract file name from path', () => {
      const result = pathService.basename('/path/to/file.txt');
      expect(result).toBe('file.txt');
    });

    it('should remove extension when specified', () => {
      const result = pathService.basename('/path/to/file.txt', '.txt');
      expect(result).toBe('file');
    });
  });

  describe('extname', () => {
    it('should extract file extension', () => {
      const result = pathService.extname('/path/to/file.txt');
      expect(result).toBe('.txt');
    });

    it('should handle files without extension', () => {
      const result = pathService.extname('/path/to/file');
      expect(result).toBe('');
    });
  });

  describe('dirname', () => {
    it('should extract directory from path', () => {
      const result = pathService.dirname('/path/to/file.txt');
      expect(result).toContain('path');
      expect(result).not.toContain('file.txt');
    });
  });
});
