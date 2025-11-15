/**
 * Unit tests for ClaudeService MCP methods
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClaudeService } from '@/main/services/ClaudeService';
import type { MCPAddOptions } from '@/shared/types/mcp.types';
import { exec } from 'child_process';

// Mock child_process
vi.mock('child_process', async () => {
  const actual = await vi.importActual('child_process');
  return {
    ...actual,
    exec: vi.fn(),
  };
});

describe.skip('ClaudeService - MCP Methods', () => {
  let service: ClaudeService;
  const mockedExec = vi.mocked(exec);

  beforeEach(() => {
    service = new ClaudeService();
    vi.clearAllMocks();
  });

  describe('addMCPServer', () => {
    it('should build correct command for stdio server', async () => {
      const options: MCPAddOptions = {
        name: 'test-server',
        transport: 'stdio',
        scope: 'user',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
      };

      // Mock successful exec
      mockedExec.mockImplementation((cmd, callback) => {
        expect(cmd).toContain('claude mcp add test-server');
        expect(cmd).toContain('--transport stdio');
        expect(cmd).toContain('--scope user');
        expect(cmd).toContain('-- npx -y');
        callback?.(null, { stdout: 'Success', stderr: '' } as never, '');
        return undefined as never;
      });

      const result = await service.addMCPServer(options);
      expect(result.success).toBe(true);
    });

    it('should build correct command with environment variables', async () => {
      const options: MCPAddOptions = {
        name: 'brave-search',
        transport: 'stdio',
        scope: 'user',
        command: 'npx',
        env: {
          BRAVE_API_KEY: 'test-key-123',
        },
      };

      mockedExec.mockImplementation((cmd, callback) => {
        expect(cmd).toContain('--env BRAVE_API_KEY=test-key-123');
        callback?.(null, { stdout: 'Success', stderr: '' } as never, '');
        return undefined as never;
      });

      const result = await service.addMCPServer(options);
      expect(result.success).toBe(true);
    });

    it('should build correct command for HTTP server with headers', async () => {
      const options: MCPAddOptions = {
        name: 'http-server',
        transport: 'http',
        scope: 'project',
        url: 'https://example.com/mcp',
        headers: {
          Authorization: 'Bearer token123',
        },
      };

      mockedExec.mockImplementation((cmd, callback) => {
        expect(cmd).toContain('--transport http');
        expect(cmd).toContain('--scope project');
        expect(cmd).toContain('--header');
        expect(cmd).toContain('Authorization: Bearer token123');
        expect(cmd).toContain('https://example.com/mcp');
        callback?.(null, { stdout: 'Success', stderr: '' } as never, '');
        return undefined as never;
      });

      const result = await service.addMCPServer(options);
      expect(result.success).toBe(true);
    });

    it('should escape special characters in arguments', async () => {
      const options: MCPAddOptions = {
        name: 'test-server',
        transport: 'stdio',
        scope: 'user',
        command: 'node',
        args: ['/path/with spaces/script.js', 'arg with "quotes"'],
      };

      mockedExec.mockImplementation((cmd, callback) => {
        // Check that spaces and quotes are properly escaped
        expect(cmd).toContain('"/path/with spaces/script.js"');
        callback?.(null, { stdout: 'Success', stderr: '' } as never, '');
        return undefined as never;
      });

      const result = await service.addMCPServer(options);
      expect(result.success).toBe(true);
    });

    it('should handle errors from CLI', async () => {
      const options: MCPAddOptions = {
        name: 'test-server',
        transport: 'stdio',
        scope: 'user',
        command: 'npx',
      };

      mockedExec.mockImplementation((cmd, callback) => {
        callback?.(new Error('Command failed') as never, { stdout: '', stderr: 'Error occurred' } as never, 'Error occurred');
        return undefined as never;
      });

      const result = await service.addMCPServer(options);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('removeMCPServer', () => {
    it('should build correct remove command', async () => {
      mockedExec.mockImplementation((cmd, callback) => {
        expect(cmd).toContain('claude mcp remove test-server');
        expect(cmd).toContain('--scope user');
        callback?.(null, { stdout: 'Removed', stderr: '' } as never, '');
        return undefined as never;
      });

      const result = await service.removeMCPServer('test-server', 'user');
      expect(result.success).toBe(true);
    });

    it('should handle remove errors', async () => {
      mockedExec.mockImplementation((cmd, callback) => {
        callback?.(new Error('Server not found') as never, { stdout: '', stderr: 'Error' } as never, 'Error');
        return undefined as never;
      });

      const result = await service.removeMCPServer('nonexistent', 'user');
      expect(result.success).toBe(false);
    });
  });

  describe('listMCPServers', () => {
    it('should parse JSON output from claude mcp list', async () => {
      const mockServers = [
        {
          name: 'server1',
          transport: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
        },
        {
          name: 'server2',
          transport: 'http',
          url: 'https://example.com/mcp',
        },
      ];

      mockedExec.mockImplementation((cmd, callback) => {
        expect(cmd).toContain('claude mcp list --format json');
        callback?.(null, { stdout: JSON.stringify(mockServers), stderr: '' } as never, '');
        return undefined as never;
      });

      const servers = await service.listMCPServers();
      expect(servers).toHaveLength(2);
      expect(servers[0].name).toBe('server1');
      expect(servers[1].name).toBe('server2');
    });

    it('should filter by scope', async () => {
      mockedExec.mockImplementation((cmd, callback) => {
        expect(cmd).toContain('--scope user');
        callback?.(null, { stdout: '[]', stderr: '' } as never, '');
        return undefined as never;
      });

      await service.listMCPServers('user');
      expect(mockedExec).toHaveBeenCalled();
    });

    it('should return empty array on error', async () => {
      mockedExec.mockImplementation((cmd, callback) => {
        callback?.(new Error('Failed') as never, { stdout: '', stderr: 'Error' } as never, 'Error');
        return undefined as never;
      });

      const servers = await service.listMCPServers();
      expect(servers).toEqual([]);
    });
  });

  describe('getMCPServer', () => {
    it('should get server details', async () => {
      const mockServer = {
        name: 'test-server',
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@test/server'],
      };

      mockedExec.mockImplementation((cmd, callback) => {
        expect(cmd).toContain('claude mcp get test-server --format json');
        callback?.(null, { stdout: JSON.stringify(mockServer), stderr: '' } as never, '');
        return undefined as never;
      });

      const server = await service.getMCPServer('test-server');
      expect(server).not.toBeNull();
      expect(server?.name).toBe('test-server');
      expect(server?.transport).toBe('stdio');
    });

    it('should return null on error', async () => {
      mockedExec.mockImplementation((cmd, callback) => {
        callback?.(new Error('Not found') as never, { stdout: '', stderr: 'Error' } as never, 'Error');
        return undefined as never;
      });

      const server = await service.getMCPServer('nonexistent');
      expect(server).toBeNull();
    });
  });

  describe('escapeArg (via command building)', () => {
    it('should escape arguments with spaces', async () => {
      const options: MCPAddOptions = {
        name: 'test server with spaces',
        transport: 'stdio',
        scope: 'user',
        command: 'npx',
      };

      mockedExec.mockImplementation((cmd, callback) => {
        expect(cmd).toContain('"test server with spaces"');
        callback?.(null, { stdout: 'Success', stderr: '' } as never, '');
        return undefined as never;
      });

      await service.addMCPServer(options);
    });

    it('should escape arguments with special characters', async () => {
      const options: MCPAddOptions = {
        name: 'test',
        transport: 'stdio',
        scope: 'user',
        command: 'echo',
        args: ['hello && rm -rf /', 'test$VAR'],
      };

      mockedExec.mockImplementation((cmd, callback) => {
        // Special characters should be escaped
        expect(cmd).toContain('"hello && rm -rf /"');
        expect(cmd).toContain('"test$VAR"');
        callback?.(null, { stdout: 'Success', stderr: '' } as never, '');
        return undefined as never;
      });

      await service.addMCPServer(options);
    });
  });
});
