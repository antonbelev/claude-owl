/**
 * Unit tests for ClaudeService plugin management methods
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClaudeService } from '../../../src/main/services/ClaudeService';
import { exec } from 'child_process';
import { promisify } from 'util';

// Mock child_process
vi.mock('child_process');
const execAsync = promisify(exec);

describe('ClaudeService - Plugin Management', () => {
  let claudeService: ClaudeService;

  beforeEach(() => {
    vi.clearAllMocks();
    claudeService = new ClaudeService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('installPlugin', () => {
    it('should use correct CLI command without slash', async () => {
      const mockExecAsync = vi.fn().mockResolvedValue({
        stdout: '✔ Successfully installed plugin: test-plugin@test-marketplace',
        stderr: '',
      });
      vi.mocked(execAsync).mockImplementation(mockExecAsync as any);

      await claudeService.installPlugin('test-plugin', 'test-marketplace');

      const calls = mockExecAsync.mock.calls;
      expect(calls[0][0]).toBe('claude plugin install test-plugin@test-marketplace');
      expect(calls[0][1]).toHaveProperty('cwd', undefined);
      expect(calls[0][1]).toHaveProperty('env');
    });

    it('should escape plugin identifier with special characters', async () => {
      const mockExecAsync = vi.fn().mockResolvedValue({
        stdout: 'Successfully installed',
        stderr: '',
      });
      vi.mocked(execAsync).mockImplementation(mockExecAsync as any);

      await claudeService.installPlugin('plugin-name', 'marketplace with spaces');

      const calls = mockExecAsync.mock.calls;
      expect(calls[0][0]).toContain('plugin install');
      expect(calls[0][0]).toContain('"plugin-name@marketplace with spaces"');
    });

    it('should use projectPath as cwd when provided', async () => {
      const mockExecAsync = vi.fn().mockResolvedValue({
        stdout: 'Successfully installed',
        stderr: '',
      });
      vi.mocked(execAsync).mockImplementation(mockExecAsync as any);

      await claudeService.installPlugin('test-plugin', 'test-marketplace', '/path/to/project');

      const calls = mockExecAsync.mock.calls;
      expect(calls[0][1]).toHaveProperty('cwd', '/path/to/project');
    });

    it('should return success when installation succeeds', async () => {
      vi.mocked(execAsync).mockResolvedValue({
        stdout: '✔ Successfully installed plugin: test-plugin',
        stderr: '',
      } as any);

      const result = await claudeService.installPlugin('test-plugin', 'test-marketplace');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully installed');
    });

    it('should return error when installation fails', async () => {
      vi.mocked(execAsync).mockResolvedValue({
        stdout: '',
        stderr: 'Error: Plugin not found',
      } as any);

      const result = await claudeService.installPlugin('test-plugin', 'test-marketplace');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Error: Plugin not found');
    });
  });

  describe('uninstallPlugin', () => {
    it('should use correct CLI command without slash', async () => {
      const mockExecAsync = vi.fn().mockResolvedValue({
        stdout: '✔ Successfully uninstalled plugin: test-plugin',
        stderr: '',
      });
      vi.mocked(execAsync).mockImplementation(mockExecAsync as any);

      await claudeService.uninstallPlugin('test-plugin', 'test-marketplace');

      const calls = mockExecAsync.mock.calls;
      expect(calls[0][0]).toBe('claude plugin uninstall test-plugin@test-marketplace');
    });

    it('should return success when uninstallation succeeds', async () => {
      vi.mocked(execAsync).mockResolvedValue({
        stdout: '✔ Successfully uninstalled plugin: test-plugin',
        stderr: '',
      } as any);

      const result = await claudeService.uninstallPlugin('test-plugin', 'test-marketplace');

      expect(result.success).toBe(true);
    });
  });

  describe('enablePlugin', () => {
    it('should use correct CLI command without slash', async () => {
      const mockExecAsync = vi.fn().mockResolvedValue({
        stdout: '✔ Successfully enabled plugin: test-plugin',
        stderr: '',
      });
      vi.mocked(execAsync).mockImplementation(mockExecAsync as any);

      await claudeService.enablePlugin('test-plugin', 'test-marketplace');

      const calls = mockExecAsync.mock.calls;
      expect(calls[0][0]).toBe('claude plugin enable test-plugin@test-marketplace');
    });
  });

  describe('disablePlugin', () => {
    it('should use correct CLI command without slash', async () => {
      const mockExecAsync = vi.fn().mockResolvedValue({
        stdout: '✔ Successfully disabled plugin: test-plugin',
        stderr: '',
      });
      vi.mocked(execAsync).mockImplementation(mockExecAsync as any);

      await claudeService.disablePlugin('test-plugin', 'test-marketplace');

      const calls = mockExecAsync.mock.calls;
      expect(calls[0][0]).toBe('claude plugin disable test-plugin@test-marketplace');
    });
  });

  describe('addPluginMarketplace', () => {
    it('should use correct CLI command without slash', async () => {
      const mockExecAsync = vi.fn().mockResolvedValue({
        stdout: 'Marketplace added successfully',
        stderr: '',
      });
      vi.mocked(execAsync).mockImplementation(mockExecAsync as any);

      await claudeService.addPluginMarketplace('https://github.com/test/marketplace');

      const calls = mockExecAsync.mock.calls;
      expect(calls[0][0]).toBe('claude plugin marketplace add https://github.com/test/marketplace');
    });

    it('should escape marketplace URL with special characters', async () => {
      const mockExecAsync = vi.fn().mockResolvedValue({
        stdout: 'Success',
        stderr: '',
      });
      vi.mocked(execAsync).mockImplementation(mockExecAsync as any);

      await claudeService.addPluginMarketplace('https://example.com/repo with spaces');

      const calls = mockExecAsync.mock.calls;
      expect(calls[0][0]).toContain('marketplace add');
      expect(calls[0][0]).toContain('"https://example.com/repo with spaces"');
    });
  });

  describe('removePluginMarketplace', () => {
    it('should use correct CLI command without slash', async () => {
      const mockExecAsync = vi.fn().mockResolvedValue({
        stdout: 'Marketplace removed successfully',
        stderr: '',
      });
      vi.mocked(execAsync).mockImplementation(mockExecAsync as any);

      await claudeService.removePluginMarketplace('test-marketplace');

      const calls = mockExecAsync.mock.calls;
      expect(calls[0][0]).toBe('claude plugin marketplace remove test-marketplace');
    });
  });

  describe('Command format regression tests', () => {
    it('should never use /plugin (slash commands) format', async () => {
      const mockExecAsync = vi.fn().mockResolvedValue({
        stdout: 'Success',
        stderr: '',
      });
      vi.mocked(execAsync).mockImplementation(mockExecAsync as any);

      // Test all plugin commands
      await claudeService.installPlugin('test', 'marketplace');
      await claudeService.uninstallPlugin('test', 'marketplace');
      await claudeService.enablePlugin('test', 'marketplace');
      await claudeService.disablePlugin('test', 'marketplace');
      await claudeService.addPluginMarketplace('https://github.com/test/repo');
      await claudeService.removePluginMarketplace('marketplace');

      // Verify no calls use /plugin format
      const allCalls = mockExecAsync.mock.calls;
      allCalls.forEach(([command]) => {
        expect(command).not.toContain('/plugin');
        expect(command).toMatch(/^claude plugin/);
      });
    });
  });
});
