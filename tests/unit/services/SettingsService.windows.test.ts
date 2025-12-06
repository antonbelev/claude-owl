/**
 * Unit tests for SettingsService - Windows Platform Support
 * Tests platform-specific managed settings paths
 *
 * Note: Platform-specific paths are tested at runtime on target platform.
 * These tests verify cross-platform path handling and error handling.
 */

import { describe, it, expect } from 'vitest';
import { SettingsService } from '@/main/services/SettingsService';

describe('SettingsService - Windows Platform Support', () => {
  describe('User Settings Path - Cross-Platform', () => {
    it('should return consistent user settings path format', () => {
      const service = new SettingsService();
      const userPath = service.getSettingsPath('user');

      expect(userPath).toContain('.claude');
      expect(userPath).toContain('settings.json');
    });
  });

  describe('Project Settings Path - Cross-Platform', () => {
    it('should handle Windows-style project paths', () => {
      const windowsProjectPath = 'C:\\Users\\Test\\Projects\\my-project';
      const service = new SettingsService(windowsProjectPath);

      const projectPath = service.getSettingsPath('project');

      expect(projectPath).toContain(windowsProjectPath);
      expect(projectPath).toContain('.claude');
      expect(projectPath).toContain('settings.json');
    });

    it('should handle Unix-style project paths', () => {
      const unixProjectPath = '/Users/test/Projects/my-project';
      const service = new SettingsService(unixProjectPath);

      const projectPath = service.getSettingsPath('project');

      // Normalize paths for comparison (path.join converts / to \ on Windows)
      const normalizedPath = projectPath.replace(/\\/g, '/');
      expect(normalizedPath).toContain(unixProjectPath);
      expect(projectPath).toContain('.claude');
      expect(projectPath).toContain('settings.json');
    });

    it('should handle paths with spaces on Unix', () => {
      const pathWithSpaces = '/Users/test user/My Projects/my-project';
      const service = new SettingsService(pathWithSpaces);

      const projectPath = service.getSettingsPath('project');

      expect(projectPath).toContain('test user');
      expect(projectPath).toContain('My Projects');
    });
  });

  describe('Local Settings Path - Cross-Platform', () => {
    it('should handle Windows project paths for local settings', () => {
      const windowsProjectPath = 'C:\\Users\\Test\\Projects\\my-project';
      const service = new SettingsService(windowsProjectPath);

      const localPath = service.getSettingsPath('local');

      expect(localPath).toContain(windowsProjectPath);
      expect(localPath).toContain('.claude');
      expect(localPath).toContain('settings.local.json');
    });

    it('should handle Unix project paths for local settings', () => {
      const unixProjectPath = '/Users/test/Projects/my-project';
      const service = new SettingsService(unixProjectPath);

      const localPath = service.getSettingsPath('local');

      // Normalize paths for comparison (path.join converts / to \ on Windows)
      const normalizedPath = localPath.replace(/\\/g, '/');
      expect(normalizedPath).toContain(unixProjectPath);
      expect(localPath).toContain('.claude');
      expect(localPath).toContain('settings.local.json');
    });
  });

  describe('Path Validation - Cross-Platform Error Handling', () => {
    it('should throw error when accessing project settings without projectPath', () => {
      const service = new SettingsService(); // No project path

      expect(() => {
        service.getSettingsPath('project');
      }).toThrow('Cannot access project-level settings without projectPath');
    });

    it('should throw error when accessing local settings without projectPath', () => {
      const service = new SettingsService();

      expect(() => {
        service.getSettingsPath('local');
      }).toThrow('Cannot access local settings without projectPath');
    });
  });

  describe('Managed Settings - Read-Only on All Platforms', () => {
    it('should prevent writing to managed settings', async () => {
      const service = new SettingsService();

      await expect(service.writeSettings('managed', {})).rejects.toThrow(
        'Cannot write to managed settings'
      );
    });

    it('should prevent deleting managed settings', async () => {
      const service = new SettingsService();

      await expect(service.deleteSettings('managed')).rejects.toThrow(
        'Cannot delete managed settings'
      );
    });

    it('should return valid path when getting managed settings', () => {
      const service = new SettingsService();
      const managedPath = service.getSettingsPath('managed');

      expect(managedPath).toBeDefined();
      expect(managedPath).toContain('managed-settings.json');
    });
  });

  describe('Backup and Restore - Cross-Platform', () => {
    it('should throw error when trying to restore to managed settings', async () => {
      const service = new SettingsService();

      await expect(service.restoreBackup('/path/to/backup.json', 'managed')).rejects.toThrow(
        'Cannot restore to managed settings'
      );
    });
  });

  describe('Settings Initialization - Cross-Platform', () => {
    it('should initialize with user path when no project path provided', () => {
      const service = new SettingsService();
      const userPath = service.getSettingsPath('user');

      expect(userPath).toBeDefined();
      expect(userPath).toContain('.claude');
      expect(userPath).toContain('settings.json');
    });

    it('should initialize with project path when provided', () => {
      const projectPath = '/test/project';
      const service = new SettingsService(projectPath);
      const projPath = service.getSettingsPath('project');

      expect(projPath).toBeDefined();
      // Normalize paths for comparison (path.join converts / to \ on Windows)
      const normalizedPath = projPath.replace(/\\/g, '/');
      expect(normalizedPath).toContain(projectPath);
    });
  });
});
