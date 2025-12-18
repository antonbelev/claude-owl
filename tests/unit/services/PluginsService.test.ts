/**
 * Unit tests for PluginsService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PluginsService } from '../../../src/main/services/PluginsService';
import { ClaudeService } from '../../../src/main/services/ClaudeService';
import * as fs from 'fs/promises';

// Mock fs/promises
vi.mock('fs/promises');

// Mock ClaudeService
vi.mock('../../../src/main/services/ClaudeService');

describe('PluginsService', () => {
  let pluginsService: PluginsService;
  let mockClaudeService: ClaudeService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClaudeService = {
      addPluginMarketplace: vi.fn(),
      removePluginMarketplace: vi.fn(),
      installPlugin: vi.fn(),
      uninstallPlugin: vi.fn(),
      enablePlugin: vi.fn(),
      disablePlugin: vi.fn(),
    } as any;

    pluginsService = new PluginsService(mockClaudeService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getMarketplaces', () => {
    it('should parse CLI marketplace file format correctly', async () => {
      const mockFileContent = {
        'claude-plugins-official': {
          source: {
            source: 'github',
            repo: 'anthropics/claude-plugins-official',
          },
          installLocation: '/Users/test/.claude/plugins/marketplaces/claude-plugins-official',
          lastUpdated: '2025-12-18T10:00:00.000Z',
        },
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockFileContent));

      // Mock fetchMarketplaceManifest to return a valid manifest
      vi.spyOn(pluginsService as any, 'fetchMarketplaceManifest').mockResolvedValue({
        name: 'claude-plugins-official',
        owner: { name: 'Anthropic', email: 'support@anthropic.com' },
        plugins: [
          { name: 'test-plugin', source: './plugins/test-plugin' },
        ],
      });

      const result = await pluginsService.getMarketplaces();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'claude-plugins-official',
        source: 'https://github.com/anthropics/claude-plugins-official',
        pluginCount: 1,
        available: true,
      });
    });

    it('should handle marketplace with URL source', async () => {
      const mockFileContent = {
        'custom-marketplace': {
          source: {
            source: 'url',
            url: 'https://gitlab.com/org/marketplace.git',
          },
          installLocation: '/Users/test/.claude/plugins/marketplaces/custom-marketplace',
          lastUpdated: '2025-12-18T10:00:00.000Z',
        },
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockFileContent));

      vi.spyOn(pluginsService as any, 'fetchMarketplaceManifest').mockResolvedValue({
        name: 'custom-marketplace',
        owner: { name: 'Custom', email: 'test@example.com' },
        plugins: [],
      });

      const result = await pluginsService.getMarketplaces();

      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('https://gitlab.com/org/marketplace.git');
    });

    it('should return empty array when file does not exist', async () => {
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });

      const result = await pluginsService.getMarketplaces();

      expect(result).toEqual([]);
    });
  });

  describe('getInstalledPlugins', () => {
    it('should parse installed_plugins.json array format correctly', async () => {
      const mockFileContent = {
        version: 2,
        plugins: {
          'feature-dev@claude-plugins-official': [
            {
              scope: 'user',
              installPath: '/Users/test/.claude/plugins/cache/claude-plugins-official/feature-dev/abc123',
              version: 'abc123',
              installedAt: '2025-12-18T10:00:00.000Z',
              lastUpdated: '2025-12-18T10:00:00.000Z',
              isLocal: true,
            },
          ],
        },
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockFileContent));

      // Mock readPluginMetadata
      vi.spyOn(pluginsService as any, 'readPluginMetadata').mockResolvedValue({
        name: 'feature-dev',
        description: 'Feature development plugin',
        version: '1.0.0',
      });

      // Mock countPluginComponents
      vi.spyOn(pluginsService as any, 'countPluginComponents').mockResolvedValue({
        commands: 2,
        agents: 1,
        skills: 0,
      });

      const result = await pluginsService.getInstalledPlugins();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'feature-dev@claude-plugins-official',
        marketplace: 'claude-plugins-official',
        installPath: '/Users/test/.claude/plugins/cache/claude-plugins-official/feature-dev/abc123',
        enabled: true,
      });
    });

    it('should handle multiple installations per plugin', async () => {
      const mockFileContent = {
        version: 2,
        plugins: {
          'test-plugin@marketplace': [
            {
              scope: 'user',
              installPath: '/path/to/user/install',
              version: 'v1',
              installedAt: '2025-12-18T10:00:00.000Z',
            },
            {
              scope: 'project',
              installPath: '/path/to/project/install',
              version: 'v1',
              installedAt: '2025-12-18T10:00:00.000Z',
            },
          ],
        },
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockFileContent));

      vi.spyOn(pluginsService as any, 'readPluginMetadata').mockResolvedValue({
        name: 'test-plugin',
        description: 'Test',
        version: 'v1',
      });

      vi.spyOn(pluginsService as any, 'countPluginComponents').mockResolvedValue({});

      const result = await pluginsService.getInstalledPlugins();

      expect(result).toHaveLength(2);
      expect(result[0].installPath).toBe('/path/to/user/install');
      expect(result[1].installPath).toBe('/path/to/project/install');
    });

    it('should return empty array when file does not exist', async () => {
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });

      const result = await pluginsService.getInstalledPlugins();

      expect(result).toEqual([]);
    });
  });

  describe('getAvailablePlugins', () => {
    it('should normalize plugin sources to URL strings', async () => {
      // Mock getMarketplaces
      vi.spyOn(pluginsService, 'getMarketplaces').mockResolvedValue([
        {
          name: 'test-marketplace',
          source: 'https://github.com/test/marketplace',
          pluginCount: 2,
          addedAt: '2025-12-18T10:00:00.000Z',
          available: true,
        },
      ]);

      // Mock getInstalledPlugins
      vi.spyOn(pluginsService, 'getInstalledPlugins').mockResolvedValue([]);

      // Mock fetchMarketplaceManifest to return plugins with object sources
      vi.spyOn(pluginsService as any, 'fetchMarketplaceManifest').mockResolvedValue({
        name: 'test-marketplace',
        owner: { name: 'Test', email: 'test@example.com' },
        plugins: [
          {
            name: 'plugin-1',
            source: {
              source: 'github',
              repo: 'test/plugin-1',
            },
            description: 'Plugin 1',
          },
          {
            name: 'plugin-2',
            source: './plugins/plugin-2',
            description: 'Plugin 2',
          },
        ],
      });

      const result = await pluginsService.getAvailablePlugins();

      expect(result).toHaveLength(2);
      expect(result[0].source).toBe('https://github.com/test/plugin-1');
      expect(result[1].source).toBe('./plugins/plugin-2');
    });

    it('should skip plugins with invalid source format', async () => {
      vi.spyOn(pluginsService, 'getMarketplaces').mockResolvedValue([
        {
          name: 'test-marketplace',
          source: 'https://github.com/test/marketplace',
          pluginCount: 1,
          addedAt: '2025-12-18T10:00:00.000Z',
          available: true,
        },
      ]);

      vi.spyOn(pluginsService, 'getInstalledPlugins').mockResolvedValue([]);

      vi.spyOn(pluginsService as any, 'fetchMarketplaceManifest').mockResolvedValue({
        name: 'test-marketplace',
        owner: { name: 'Test', email: 'test@example.com' },
        plugins: [
          {
            name: 'invalid-plugin',
            source: { unknownFormat: true },
            description: 'Invalid',
          },
          {
            name: 'valid-plugin',
            source: 'https://github.com/test/valid',
            description: 'Valid',
          },
        ],
      });

      const result = await pluginsService.getAvailablePlugins();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('valid-plugin');
    });
  });

  describe('addMarketplace', () => {
    it('should delegate to Claude CLI and return marketplace name from manifest', async () => {
      vi.mocked(mockClaudeService.addPluginMarketplace).mockResolvedValue({
        success: true,
        message: 'Marketplace added',
      });

      vi.spyOn(pluginsService as any, 'fetchMarketplaceManifest').mockResolvedValue({
        name: 'test-marketplace',
        owner: { name: 'Test', email: 'test@example.com' },
        plugins: [],
      });

      const result = await pluginsService.addMarketplace(
        'https://github.com/test/marketplace'
      );

      expect(result.success).toBe(true);
      expect(result.marketplaceName).toBe('test-marketplace');
      expect(mockClaudeService.addPluginMarketplace).toHaveBeenCalledWith(
        'https://github.com/test/marketplace'
      );
    });

    it('should validate marketplace manifest before adding', async () => {
      vi.spyOn(pluginsService as any, 'fetchMarketplaceManifest').mockResolvedValue(null);

      const result = await pluginsService.addMarketplace(
        'https://github.com/test/invalid'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot find marketplace manifest');
      expect(mockClaudeService.addPluginMarketplace).not.toHaveBeenCalled();
    });

    it('should return error if manifest missing name field', async () => {
      vi.spyOn(pluginsService as any, 'fetchMarketplaceManifest').mockResolvedValue({
        owner: { name: 'Test', email: 'test@example.com' },
        plugins: [],
        // Missing 'name' field
      });

      const result = await pluginsService.addMarketplace(
        'https://github.com/test/invalid'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing the required "name" field');
      expect(mockClaudeService.addPluginMarketplace).not.toHaveBeenCalled();
    });
  });

  describe('installPlugin', () => {
    it('should delegate to Claude CLI', async () => {
      vi.spyOn(pluginsService, 'getMarketplaces').mockResolvedValue([
        {
          name: 'test-marketplace',
          source: 'https://github.com/test/marketplace',
          pluginCount: 1,
          addedAt: '2025-12-18T10:00:00.000Z',
          available: true,
        },
      ]);

      vi.mocked(mockClaudeService.installPlugin).mockResolvedValue({
        success: true,
        message: 'Plugin installed',
      });

      const result = await pluginsService.installPlugin('test-plugin', 'test-marketplace');

      expect(result.success).toBe(true);
      expect(mockClaudeService.installPlugin).toHaveBeenCalledWith('test-plugin', 'test-marketplace');
    });

    it('should return error if marketplace not found', async () => {
      vi.spyOn(pluginsService, 'getMarketplaces').mockResolvedValue([]);

      const result = await pluginsService.installPlugin('test-plugin', 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Marketplace not found');
      expect(mockClaudeService.installPlugin).not.toHaveBeenCalled();
    });
  });

  describe('uninstallPlugin', () => {
    it('should delegate to Claude CLI', async () => {
      vi.spyOn(pluginsService, 'getInstalledPlugins').mockResolvedValue([
        {
          id: 'test-plugin@test-marketplace',
          name: 'test-plugin',
          marketplace: 'test-marketplace',
          installPath: '/path/to/plugin',
          enabled: true,
          installedAt: '2025-12-18T10:00:00.000Z',
          componentCounts: {},
        },
      ]);

      vi.mocked(mockClaudeService.uninstallPlugin).mockResolvedValue({
        success: true,
        message: 'Plugin uninstalled',
      });

      const result = await pluginsService.uninstallPlugin('test-plugin@test-marketplace');

      expect(result.success).toBe(true);
      expect(mockClaudeService.uninstallPlugin).toHaveBeenCalledWith('test-plugin', 'test-marketplace');
    });

    it('should return error if plugin not found', async () => {
      vi.spyOn(pluginsService, 'getInstalledPlugins').mockResolvedValue([]);

      const result = await pluginsService.uninstallPlugin('nonexistent@marketplace');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Plugin not found');
      expect(mockClaudeService.uninstallPlugin).not.toHaveBeenCalled();
    });
  });

  describe('togglePlugin', () => {
    it('should enable plugin via Claude CLI', async () => {
      vi.mocked(mockClaudeService.enablePlugin).mockResolvedValue({
        success: true,
        message: 'Plugin enabled',
      });

      const result = await pluginsService.togglePlugin('test-plugin@test-marketplace', true);

      expect(result.success).toBe(true);
      expect(mockClaudeService.enablePlugin).toHaveBeenCalledWith('test-plugin', 'test-marketplace');
    });

    it('should disable plugin via Claude CLI', async () => {
      vi.mocked(mockClaudeService.disablePlugin).mockResolvedValue({
        success: true,
        message: 'Plugin disabled',
      });

      const result = await pluginsService.togglePlugin('test-plugin@test-marketplace', false);

      expect(result.success).toBe(true);
      expect(mockClaudeService.disablePlugin).toHaveBeenCalledWith('test-plugin', 'test-marketplace');
    });

    it('should handle invalid plugin ID format', async () => {
      const result = await pluginsService.togglePlugin('invalid-format', true);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid plugin ID format');
    });
  });
});
