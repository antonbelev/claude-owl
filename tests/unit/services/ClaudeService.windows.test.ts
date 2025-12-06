/**
 * Unit tests for ClaudeService - Windows Platform Support
 * Tests platform-specific functionality for Windows vs macOS
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ClaudeService } from '@/main/services/ClaudeService';
import type { MCPAddOptions } from '@/shared/types/mcp.types';
import { exec } from 'child_process';

// Mock child_process
vi.mock('child_process', async importOriginal => {
  const actual = await importOriginal<typeof import('child_process')>();
  return {
    ...actual,
    exec: vi.fn(),
  };
});

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}));

describe('ClaudeService - Windows Platform Support', () => {
  let service: ClaudeService;
  const mockedExec = vi.mocked(exec);
  let originalPlatform: string;

  beforeEach(() => {
    service = new ClaudeService();
    vi.clearAllMocks();
    originalPlatform = process.platform;
  });

  afterEach(() => {
    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true,
      configurable: true,
    });
  });

  describe('checkInstallation - Platform Detection', () => {
    it.skip('should use "where" command on Windows', async () => {
      // Mock Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true,
      });

      let capturedCommand = '';
      mockedExec.mockImplementation(((cmd: string, options: any, callback: any) => {
        capturedCommand = cmd;
        // Immediately call the callback
        callback(null, 'C:\\Users\\Test\\claude.exe\n', '');
        return {} as any;
      }) as any);

      await service.checkInstallation();

      expect(capturedCommand).toContain('where claude');
      expect(capturedCommand).not.toContain('which claude');
    });

    it.skip('should use "which" command on macOS', async () => {
      // Mock macOS platform
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
        configurable: true,
      });

      let capturedCommand = '';
      mockedExec.mockImplementation(((cmd: string, options: any, callback: any) => {
        capturedCommand = cmd;
        callback(null, '/usr/local/bin/claude\n', '');
        return {} as any;
      }) as any);

      await service.checkInstallation();

      expect(capturedCommand).toContain('which claude');
      expect(capturedCommand).not.toContain('where claude');
    });

    it.skip('should handle multiple paths from Windows "where" command', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true,
      });

      // Windows 'where' returns multiple paths
      const multiplePaths = 'C:\\Users\\Test\\claude.exe\nC:\\Program Files\\claude.exe';

      mockedExec.mockImplementation(((cmd: string, options: any, callback: any) => {
        if (cmd.includes('where')) {
          callback(null, multiplePaths, '');
        } else if (cmd.includes('--version')) {
          callback(null, '1.0.0', '');
        }
        return {} as any;
      }) as any);

      const result = await service.checkInstallation();

      // Should select the first path
      expect(result.installed).toBe(true);
      expect(result.path).toBe('C:\\Users\\Test\\claude.exe');
    });
  });

  describe('getExecEnv - PATH Handling', () => {
    it('should use semicolon separator on Windows', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true,
      });

      // Access private method via reflection for testing
      const getExecEnv = (service as any).getExecEnv.bind(service);
      const env = getExecEnv();

      // Windows uses semicolon separator
      expect(env.PATH).toContain(';');
      // Should include Windows-specific paths
      expect(env.PATH).toContain('System32');
    });

    it('should use colon separator on macOS', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
        configurable: true,
      });

      const getExecEnv = (service as any).getExecEnv.bind(service);
      const env = getExecEnv();

      // macOS uses colon separator
      expect(env.PATH).toContain(':');
      // Should include macOS-specific paths
      expect(env.PATH).toContain('/usr/local/bin');
    });

    it('should include Windows-specific paths on Windows', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true,
      });

      // Mock USERPROFILE
      const originalEnv = process.env.USERPROFILE;
      process.env.USERPROFILE = 'C:\\Users\\TestUser';

      const getExecEnv = (service as any).getExecEnv.bind(service);
      const env = getExecEnv();

      // Should include Node.js paths (path.join normalizes separators)
      expect(env.PATH).toContain('Program Files');
      expect(env.PATH).toContain('nodejs');
      expect(env.PATH).toContain('AppData');
      expect(env.PATH).toContain('Roaming');
      expect(env.PATH).toContain('npm');
      // Should include system paths
      expect(env.PATH).toContain('System32');
      expect(env.PATH).toContain('Windows');

      // Restore
      process.env.USERPROFILE = originalEnv;
    });

    it('should include macOS-specific paths on macOS', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
        configurable: true,
      });

      const getExecEnv = (service as any).getExecEnv.bind(service);
      const env = getExecEnv();

      expect(env.PATH).toContain('/usr/local/bin');
      expect(env.PATH).toContain('/opt/homebrew/bin');
      expect(env.PATH).toContain('/usr/bin');
      expect(env.PATH).toContain('/bin');
    });
  });

  describe('buildMCPAddCommand - Windows cmd /c Wrapper', () => {
    it('should add "cmd /c" wrapper for npx on Windows', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true,
      });

      const options: MCPAddOptions = {
        name: 'test-server',
        transport: 'stdio',
        scope: 'user',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
      };

      const buildCommand = (service as any).buildMCPAddCommand.bind(service);
      const command = buildCommand(options);

      // Should include cmd /c wrapper
      expect(command).toContain('cmd /c npx');
      // Should still include the args
      expect(command).toContain('-y');
      expect(command).toContain('@modelcontextprotocol/server-sequential-thinking');
    });

    it('should NOT add "cmd /c" wrapper for npx on macOS', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
        configurable: true,
      });

      const options: MCPAddOptions = {
        name: 'test-server',
        transport: 'stdio',
        scope: 'user',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
      };

      const buildCommand = (service as any).buildMCPAddCommand.bind(service);
      const command = buildCommand(options);

      // Should NOT include cmd /c
      expect(command).not.toContain('cmd /c');
      // Should still include npx normally
      expect(command).toContain('-- npx');
    });

    it('should NOT add "cmd /c" for non-npx commands on Windows', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true,
      });

      const options: MCPAddOptions = {
        name: 'test-server',
        transport: 'stdio',
        scope: 'user',
        command: 'node',
        args: ['server.js'],
      };

      const buildCommand = (service as any).buildMCPAddCommand.bind(service);
      const command = buildCommand(options);

      // Should NOT include cmd /c for non-npx commands
      expect(command).not.toContain('cmd /c');
      expect(command).toContain('-- node');
    });

    it('should handle HTTP transport the same on both platforms', () => {
      const options: MCPAddOptions = {
        name: 'http-server',
        transport: 'http',
        scope: 'user',
        url: 'https://example.com/mcp',
      };

      const buildCommand = (service as any).buildMCPAddCommand.bind(service);

      // Test Windows
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true,
      });
      const windowsCommand = buildCommand(options);

      // Test macOS
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
        configurable: true,
      });
      const macCommand = buildCommand(options);

      // HTTP transport should be identical on both platforms
      expect(windowsCommand).toBe(macCommand);
      expect(windowsCommand).toContain('--transport http');
      expect(windowsCommand).toContain('https://example.com/mcp');
    });

    it('should be case-insensitive for npx detection on Windows', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true,
      });

      const testCases = ['npx', 'NPX', 'Npx', 'NpX'];

      testCases.forEach(command => {
        const options: MCPAddOptions = {
          name: 'test',
          transport: 'stdio',
          scope: 'user',
          command,
        };

        const buildCommand = (service as any).buildMCPAddCommand.bind(service);
        const result = buildCommand(options);

        expect(result).toContain('cmd /c');
      });
    });
  });

  describe('escapeArg - Cross-Platform Argument Escaping', () => {
    it('should escape arguments with spaces on both platforms', () => {
      const escapeArg = (service as any).escapeArg.bind(service);

      const arg = 'path with spaces';
      const escaped = escapeArg(arg);

      expect(escaped).toBe('"path with spaces"');
    });

    it('should escape special characters consistently', () => {
      const escapeArg = (service as any).escapeArg.bind(service);

      const specialChars = [
        'test$VAR',
        'test`command`',
        'test&test',
        'test|test',
        'test;test',
        'test\\path',
      ];

      specialChars.forEach(arg => {
        const escaped = escapeArg(arg);
        // All special characters should be quoted
        expect(escaped).toMatch(/^".*"$/);
      });
    });
  });
});
