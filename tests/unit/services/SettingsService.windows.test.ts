/**
 * Unit tests for SettingsService - Windows Platform Support
 * Tests platform-specific managed settings paths
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SettingsService } from '@/main/services/SettingsService';
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

// Mock fs/promises
vi.mock('fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return {
    ...actual,
    access: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    unlink: vi.fn(),
    copyFile: vi.fn(),
    readdir: vi.fn(),
  };
});

describe('SettingsService - Windows Platform Support', () => {
  let originalPlatform: string;

  beforeEach(() => {
    originalPlatform = process.platform;
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true,
      configurable: true,
    });
  });

  describe('getManagedSettingsPath - Platform-Specific Paths', () => {
    it('should return Windows path on Windows', () => {
      vi.mocked(platform).mockReturnValue('win32');

      // Mock ProgramData environment variable
      const originalProgramData = process.env.ProgramData;
      process.env.ProgramData = 'C:\\ProgramData';

      const service = new SettingsService();

      // Access the managed settings path via getSettingsPath
      const managedPath = service.getSettingsPath('managed');

      // Should use Windows format: C:\ProgramData\ClaudeCode\managed-settings.json
      expect(managedPath).toContain('ProgramData');
      expect(managedPath).toContain('ClaudeCode');
      expect(managedPath).toContain('managed-settings.json');

      // Restore
      process.env.ProgramData = originalProgramData;
    });

    it('should return macOS path on macOS', () => {
      vi.mocked(platform).mockReturnValue('darwin');

      const service = new SettingsService();
      const managedPath = service.getSettingsPath('managed');

      // Should use macOS format: /Library/Application Support/ClaudeCode/managed-settings.json
      expect(managedPath).toContain('Library');
      expect(managedPath).toContain('Application Support');
      expect(managedPath).toContain('ClaudeCode');
      expect(managedPath).toContain('managed-settings.json');
    });

    it('should return Linux path on Linux', () => {
      vi.mocked(platform).mockReturnValue('linux');

      const service = new SettingsService();
      const managedPath = service.getSettingsPath('managed');

      // Should use Linux format: /etc/claude-code/managed-settings.json
      expect(managedPath).toContain('/etc');
      expect(managedPath).toContain('claude-code');
      expect(managedPath).toContain('managed-settings.json');
    });

    it('should handle missing ProgramData on Windows with fallback', () => {
      vi.mocked(platform).mockReturnValue('win32');

      // Remove ProgramData
      const originalProgramData = process.env.ProgramData;
      delete process.env.ProgramData;

      const service = new SettingsService();
      const managedPath = service.getSettingsPath('managed');

      // Should still return a valid path using fallback
      expect(managedPath).toContain('ProgramData');
      expect(managedPath).toContain('ClaudeCode');
      expect(managedPath).toContain('managed-settings.json');

      // Restore
      process.env.ProgramData = originalProgramData;
    });

    it('should use path.join for consistency on Windows', () => {
      vi.mocked(platform).mockReturnValue('win32');
      process.env.ProgramData = 'C:\\ProgramData';

      const service = new SettingsService();
      const managedPath = service.getSettingsPath('managed');

      // Should not have double backslashes (path.join normalizes)
      expect(managedPath).not.toContain('\\\\ClaudeCode');
      expect(managedPath).not.toContain('\\\\managed');

      // Should be properly formed
      expect(managedPath).toMatch(/ProgramData[\\/]ClaudeCode[\\/]managed-settings\.json$/);
    });

    it('should use path.join for consistency on macOS', () => {
      vi.mocked(platform).mockReturnValue('darwin');

      const service = new SettingsService();
      const managedPath = service.getSettingsPath('managed');

      // Should not have issues with "Application Support" spaces
      expect(managedPath).toContain('Application Support');
      expect(managedPath).toMatch(/Library[/]Application Support[/]ClaudeCode[/]managed-settings\.json$/);
    });

    it('should use path.join for consistency on Linux', () => {
      vi.mocked(platform).mockReturnValue('linux');

      const service = new SettingsService();
      const managedPath = service.getSettingsPath('managed');

      // Should be properly formed without double slashes
      expect(managedPath).not.toContain('//');
      expect(managedPath).toMatch(/\/etc[/]claude-code[/]managed-settings\.json$/);
    });
  });

  describe('User Settings Path - Cross-Platform', () => {
    it('should return consistent user settings path format on Windows', () => {
      vi.mocked(platform).mockReturnValue('win32');

      const service = new SettingsService();
      const userPath = service.getSettingsPath('user');

      // Should use homedir/.claude/settings.json format
      expect(userPath).toContain('.claude');
      expect(userPath).toContain('settings.json');
    });

    it('should return consistent user settings path format on macOS', () => {
      vi.mocked(platform).mockReturnValue('darwin');

      const service = new SettingsService();
      const userPath = service.getSettingsPath('user');

      expect(userPath).toContain('.claude');
      expect(userPath).toContain('settings.json');
    });

    it('should return consistent user settings path format on Linux', () => {
      vi.mocked(platform).mockReturnValue('linux');

      const service = new SettingsService();
      const userPath = service.getSettingsPath('user');

      expect(userPath).toContain('.claude');
      expect(userPath).toContain('settings.json');
    });
  });

  describe('Project Settings Path - Cross-Platform', () => {
    it('should handle Windows-style project paths', () => {
      vi.mocked(platform).mockReturnValue('win32');

      const windowsProjectPath = 'C:\\Users\\Test\\Projects\\my-project';
      const service = new SettingsService(windowsProjectPath);

      const projectPath = service.getSettingsPath('project');

      expect(projectPath).toContain(windowsProjectPath);
      expect(projectPath).toContain('.claude');
      expect(projectPath).toContain('settings.json');
    });

    it('should handle Unix-style project paths', () => {
      vi.mocked(platform).mockReturnValue('darwin');

      const unixProjectPath = '/Users/test/Projects/my-project';
      const service = new SettingsService(unixProjectPath);

      const projectPath = service.getSettingsPath('project');

      expect(projectPath).toContain(unixProjectPath);
      expect(projectPath).toContain('.claude');
      expect(projectPath).toContain('settings.json');
    });

    it('should handle paths with spaces on Windows', () => {
      vi.mocked(platform).mockReturnValue('win32');

      const pathWithSpaces = 'C:\\Users\\Test User\\My Projects\\my-project';
      const service = new SettingsService(pathWithSpaces);

      const projectPath = service.getSettingsPath('project');

      expect(projectPath).toContain('Test User');
      expect(projectPath).toContain('My Projects');
    });

    it('should handle paths with spaces on macOS', () => {
      vi.mocked(platform).mockReturnValue('darwin');

      const pathWithSpaces = '/Users/test user/My Projects/my-project';
      const service = new SettingsService(pathWithSpaces);

      const projectPath = service.getSettingsPath('project');

      expect(projectPath).toContain('test user');
      expect(projectPath).toContain('My Projects');
    });
  });

  describe('Local Settings Path - Cross-Platform', () => {
    it('should handle Windows project paths for local settings', () => {
      vi.mocked(platform).mockReturnValue('win32');

      const windowsProjectPath = 'C:\\Users\\Test\\Projects\\my-project';
      const service = new SettingsService(windowsProjectPath);

      const localPath = service.getSettingsPath('local');

      expect(localPath).toContain(windowsProjectPath);
      expect(localPath).toContain('.claude');
      expect(localPath).toContain('settings.local.json');
    });

    it('should handle Unix project paths for local settings', () => {
      vi.mocked(platform).mockReturnValue('darwin');

      const unixProjectPath = '/Users/test/Projects/my-project';
      const service = new SettingsService(unixProjectPath);

      const localPath = service.getSettingsPath('local');

      expect(localPath).toContain(unixProjectPath);
      expect(localPath).toContain('.claude');
      expect(localPath).toContain('settings.local.json');
    });
  });

  describe('Path Validation - Cross-Platform Error Handling', () => {
    it('should throw error when accessing project settings without projectPath on Windows', () => {
      vi.mocked(platform).mockReturnValue('win32');

      const service = new SettingsService(); // No project path

      expect(() => {
        service.getSettingsPath('project');
      }).toThrow('Cannot access project-level settings without projectPath');
    });

    it('should throw error when accessing project settings without projectPath on macOS', () => {
      vi.mocked(platform).mockReturnValue('darwin');

      const service = new SettingsService(); // No project path

      expect(() => {
        service.getSettingsPath('project');
      }).toThrow('Cannot access project-level settings without projectPath');
    });

    it('should throw error when accessing local settings without projectPath on Windows', () => {
      vi.mocked(platform).mockReturnValue('win32');

      const service = new SettingsService();

      expect(() => {
        service.getSettingsPath('local');
      }).toThrow('Cannot access local settings without projectPath');
    });

    it('should throw error when accessing local settings without projectPath on macOS', () => {
      vi.mocked(platform).mockReturnValue('darwin');

      const service = new SettingsService();

      expect(() => {
        service.getSettingsPath('local');
      }).toThrow('Cannot access local settings without projectPath');
    });
  });

  describe('Managed Settings - Read-Only on All Platforms', () => {
    it('should prevent writing to managed settings on Windows', async () => {
      vi.mocked(platform).mockReturnValue('win32');

      const service = new SettingsService();

      await expect(service.writeSettings('managed', {})).rejects.toThrow(
        'Cannot write to managed settings'
      );
    });

    it('should prevent writing to managed settings on macOS', async () => {
      vi.mocked(platform).mockReturnValue('darwin');

      const service = new SettingsService();

      await expect(service.writeSettings('managed', {})).rejects.toThrow(
        'Cannot write to managed settings'
      );
    });

    it('should prevent deleting managed settings on Windows', async () => {
      vi.mocked(platform).mockReturnValue('win32');

      const service = new SettingsService();

      await expect(service.deleteSettings('managed')).rejects.toThrow(
        'Cannot delete managed settings'
      );
    });

    it('should prevent deleting managed settings on macOS', async () => {
      vi.mocked(platform).mockReturnValue('darwin');

      const service = new SettingsService();

      await expect(service.deleteSettings('managed')).rejects.toThrow(
        'Cannot delete managed settings'
      );
    });
  });
});
