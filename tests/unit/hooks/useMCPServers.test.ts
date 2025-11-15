/**
 * Unit tests for useMCPServers hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMCPServers } from '@/renderer/hooks/useMCPServers';
import type { MCPServer, MCPScope } from '@/shared/types/mcp.types';

describe('useMCPServers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with loading state', () => {
    window.electronAPI.listMCPServers = vi.fn().mockResolvedValue({
      success: true,
      servers: [],
    });

    const { result } = renderHook(() => useMCPServers());

    expect(result.current.loading).toBe(true);
    expect(result.current.servers).toEqual([]);
  });

  it('should load servers successfully', async () => {
    const mockServers: MCPServer[] = [
      {
        name: 'sequential-thinking',
        transport: 'stdio',
        scope: 'user',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
      },
      {
        name: 'brave-search',
        transport: 'stdio',
        scope: 'user',
        command: 'npx',
        env: { BRAVE_API_KEY: 'test' },
      },
    ];

    window.electronAPI.listMCPServers = vi.fn().mockResolvedValue({
      success: true,
      servers: mockServers,
    });

    const { result } = renderHook(() => useMCPServers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.servers).toHaveLength(2);
    expect(result.current.servers[0].name).toBe('sequential-thinking');
    expect(result.current.servers[1].name).toBe('brave-search');
    expect(result.current.error).toBeNull();
  });

  it('should filter by scope', async () => {
    window.electronAPI.listMCPServers = vi.fn().mockResolvedValue({
      success: true,
      servers: [],
    });

    const scope: MCPScope = 'user';
    renderHook(() => useMCPServers(scope));

    await waitFor(() => {
      expect(window.electronAPI.listMCPServers).toHaveBeenCalledWith({ scope });
    });
  });

  it('should handle API errors', async () => {
    window.electronAPI.listMCPServers = vi.fn().mockResolvedValue({
      success: false,
      error: 'Failed to list servers',
    });

    const { result } = renderHook(() => useMCPServers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.servers).toEqual([]);
    expect(result.current.error).toBe('Failed to list servers');
  });

  it('should handle exceptions', async () => {
    window.electronAPI.listMCPServers = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useMCPServers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.servers).toEqual([]);
    expect(result.current.error).toBe('Network error');
  });

  it('should add server successfully', async () => {
    window.electronAPI.listMCPServers = vi.fn().mockResolvedValue({
      success: true,
      servers: [],
    });

    window.electronAPI.addMCPServer = vi.fn().mockResolvedValue({
      success: true,
      message: 'Server added',
    });

    const { result } = renderHook(() => useMCPServers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const addRequest = {
      name: 'test-server',
      transport: 'stdio' as const,
      scope: 'user' as const,
      command: 'npx',
    };

    const response = await result.current.addServer(addRequest);

    expect(response.success).toBe(true);
    expect(window.electronAPI.addMCPServer).toHaveBeenCalledWith(addRequest);
    // Should refresh after adding
    expect(window.electronAPI.listMCPServers).toHaveBeenCalledTimes(2);
  });

  it('should handle add server errors', async () => {
    window.electronAPI.listMCPServers = vi.fn().mockResolvedValue({
      success: true,
      servers: [],
    });

    window.electronAPI.addMCPServer = vi.fn().mockResolvedValue({
      success: false,
      error: 'Server already exists',
    });

    const { result } = renderHook(() => useMCPServers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const addRequest = {
      name: 'test-server',
      transport: 'stdio' as const,
      scope: 'user' as const,
      command: 'npx',
    };

    const response = await result.current.addServer(addRequest);

    expect(response.success).toBe(false);
    expect(response.error).toBe('Server already exists');

    await waitFor(() => {
      expect(result.current.error).toBe('Server already exists');
    });
  });

  it('should remove server successfully', async () => {
    window.electronAPI.listMCPServers = vi.fn().mockResolvedValue({
      success: true,
      servers: [],
    });

    window.electronAPI.removeMCPServer = vi.fn().mockResolvedValue({
      success: true,
      message: 'Server removed',
    });

    const { result } = renderHook(() => useMCPServers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const removeRequest = {
      name: 'test-server',
      scope: 'user' as const,
    };

    const response = await result.current.removeServer(removeRequest);

    expect(response.success).toBe(true);
    expect(window.electronAPI.removeMCPServer).toHaveBeenCalledWith(removeRequest);
    // Should refresh after removing
    expect(window.electronAPI.listMCPServers).toHaveBeenCalledTimes(2);
  });

  it('should handle remove server errors', async () => {
    window.electronAPI.listMCPServers = vi.fn().mockResolvedValue({
      success: true,
      servers: [],
    });

    window.electronAPI.removeMCPServer = vi.fn().mockResolvedValue({
      success: false,
      error: 'Server not found',
    });

    const { result } = renderHook(() => useMCPServers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const removeRequest = {
      name: 'nonexistent',
      scope: 'user' as const,
    };

    const response = await result.current.removeServer(removeRequest);

    expect(response.success).toBe(false);
    expect(response.error).toBe('Server not found');

    await waitFor(() => {
      expect(result.current.error).toBe('Server not found');
    });
  });

  it('should support refresh functionality', async () => {
    let callCount = 0;
    window.electronAPI.listMCPServers = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        success: true,
        servers: [
          {
            name: `server-${callCount}`,
            transport: 'stdio' as const,
            scope: 'user' as const,
          },
        ],
      });
    });

    const { result } = renderHook(() => useMCPServers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.servers[0].name).toBe('server-1');

    // Refresh
    await result.current.refresh();

    await waitFor(() => {
      expect(result.current.servers[0].name).toBe('server-2');
    });

    expect(callCount).toBe(2);
  });

  it('should reload when scope changes', async () => {
    window.electronAPI.listMCPServers = vi.fn().mockResolvedValue({
      success: true,
      servers: [],
    });

    const { rerender } = renderHook(({ scope }: { scope?: MCPScope }) => useMCPServers(scope), {
      initialProps: { scope: undefined },
    });

    await waitFor(() => {
      expect(window.electronAPI.listMCPServers).toHaveBeenCalledWith(undefined);
    });

    // Change scope
    rerender({ scope: 'user' });

    await waitFor(() => {
      expect(window.electronAPI.listMCPServers).toHaveBeenCalledWith({ scope: 'user' });
    });

    expect(window.electronAPI.listMCPServers).toHaveBeenCalledTimes(2);
  });
});
