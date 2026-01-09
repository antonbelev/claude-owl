/**
 * Unit tests for useRemoteMCPServers hook
 *
 * @see ADR-010: Remote MCP Servers Discovery & Connection Verification
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useRemoteMCPServers,
  useConnectionTest,
} from '@/renderer/hooks/useRemoteMCPServers';
import type { RemoteMCPServer } from '@/shared/types';

describe('useRemoteMCPServers', () => {
  const mockServers: RemoteMCPServer[] = [
    {
      id: 'github-mcp',
      name: 'GitHub MCP',
      description: 'GitHub integration',
      provider: 'GitHub',
      endpoint: 'https://api.github.com/mcp',
      transport: 'sse',
      authType: 'oauth',
      verified: true,
      source: 'mcpservers.org',
      category: 'developer-tools',
      tags: ['git', 'github'],
    },
    {
      id: 'notion-mcp',
      name: 'Notion MCP',
      description: 'Notion integration',
      provider: 'Notion',
      endpoint: 'https://api.notion.com/mcp',
      transport: 'sse',
      authType: 'oauth',
      verified: true,
      source: 'mcpservers.org',
      category: 'productivity',
      tags: ['notes', 'wiki'],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with loading state', () => {
    window.electronAPI.fetchRemoteMCPDirectory = vi.fn().mockResolvedValue({
      success: true,
      servers: [],
      source: 'live',
      lastUpdated: new Date().toISOString(),
    });
    window.electronAPI.getRemoteMCPCacheStatus = vi.fn().mockResolvedValue({
      success: true,
      cacheStatus: { exists: false },
    });

    const { result } = renderHook(() => useRemoteMCPServers());

    expect(result.current.loading).toBe(true);
    expect(result.current.servers).toEqual([]);
  });

  it('should load servers successfully', async () => {
    window.electronAPI.fetchRemoteMCPDirectory = vi.fn().mockResolvedValue({
      success: true,
      servers: mockServers,
      source: 'live',
      lastUpdated: new Date().toISOString(),
    });
    window.electronAPI.getRemoteMCPCacheStatus = vi.fn().mockResolvedValue({
      success: true,
      cacheStatus: { exists: true },
    });

    const { result } = renderHook(() => useRemoteMCPServers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.servers).toHaveLength(2);
    expect(result.current.servers[0].id).toBe('github-mcp');
    expect(result.current.error).toBeNull();
    expect(result.current.source).toBe('live');
  });

  it('should handle API errors', async () => {
    window.electronAPI.fetchRemoteMCPDirectory = vi.fn().mockResolvedValue({
      success: false,
      error: 'Failed to fetch directory',
    });
    window.electronAPI.getRemoteMCPCacheStatus = vi.fn().mockResolvedValue({
      success: true,
      cacheStatus: { exists: false },
    });

    const { result } = renderHook(() => useRemoteMCPServers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.servers).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch directory');
  });

  it('should handle exceptions', async () => {
    window.electronAPI.fetchRemoteMCPDirectory = vi
      .fn()
      .mockRejectedValue(new Error('Network error'));
    window.electronAPI.getRemoteMCPCacheStatus = vi.fn().mockResolvedValue({
      success: true,
      cacheStatus: { exists: false },
    });

    const { result } = renderHook(() => useRemoteMCPServers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.servers).toEqual([]);
    expect(result.current.error).toBe('Network error');
  });

  it('should search servers', async () => {
    window.electronAPI.fetchRemoteMCPDirectory = vi.fn().mockResolvedValue({
      success: true,
      servers: mockServers,
      source: 'live',
      lastUpdated: new Date().toISOString(),
    });
    window.electronAPI.getRemoteMCPCacheStatus = vi.fn().mockResolvedValue({
      success: true,
      cacheStatus: { exists: false },
    });
    window.electronAPI.searchRemoteMCPServers = vi.fn().mockResolvedValue({
      success: true,
      servers: [mockServers[0]],
    });

    const { result } = renderHook(() => useRemoteMCPServers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const searchResults = await result.current.search('GitHub');

    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].name).toBe('GitHub MCP');
    expect(window.electronAPI.searchRemoteMCPServers).toHaveBeenCalledWith({
      query: 'GitHub',
      category: undefined,
      authType: undefined,
    });
  });

  it('should get server details', async () => {
    const mockSecurityContext = {
      isVerifiedProvider: true,
      isOfficialServer: true,
      hasValidTLS: true,
      riskLevel: 'low' as const,
      riskFactors: [],
      dataAccessDescription: 'GitHub access',
    };

    window.electronAPI.fetchRemoteMCPDirectory = vi.fn().mockResolvedValue({
      success: true,
      servers: mockServers,
      source: 'live',
      lastUpdated: new Date().toISOString(),
    });
    window.electronAPI.getRemoteMCPCacheStatus = vi.fn().mockResolvedValue({
      success: true,
      cacheStatus: { exists: false },
    });
    window.electronAPI.getRemoteMCPServerDetails = vi.fn().mockResolvedValue({
      success: true,
      server: mockServers[0],
      securityContext: mockSecurityContext,
    });

    const { result } = renderHook(() => useRemoteMCPServers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const details = await result.current.getServerDetails('github-mcp');

    expect(details).not.toBeNull();
    expect(details?.server.id).toBe('github-mcp');
    expect(details?.securityContext.isVerifiedProvider).toBe(true);
  });

  it('should test connection', async () => {
    const mockTestResult = {
      success: true,
      latencyMs: 150,
      steps: [
        { name: 'DNS Resolution', status: 'success' as const },
        { name: 'TLS/SSL Verification', status: 'success' as const },
      ],
    };

    window.electronAPI.fetchRemoteMCPDirectory = vi.fn().mockResolvedValue({
      success: true,
      servers: mockServers,
      source: 'live',
      lastUpdated: new Date().toISOString(),
    });
    window.electronAPI.getRemoteMCPCacheStatus = vi.fn().mockResolvedValue({
      success: true,
      cacheStatus: { exists: false },
    });
    window.electronAPI.testRemoteMCPConnection = vi.fn().mockResolvedValue({
      success: true,
      result: mockTestResult,
    });

    const { result } = renderHook(() => useRemoteMCPServers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const testResult = await result.current.testConnection(
      'https://api.github.com/mcp',
      'sse'
    );

    expect(testResult.success).toBe(true);
    expect(testResult.latencyMs).toBe(150);
    expect(window.electronAPI.testRemoteMCPConnection).toHaveBeenCalledWith({
      url: 'https://api.github.com/mcp',
      transport: 'sse',
      timeout: undefined,
    });
  });

  it('should add server', async () => {
    window.electronAPI.fetchRemoteMCPDirectory = vi.fn().mockResolvedValue({
      success: true,
      servers: mockServers,
      source: 'live',
      lastUpdated: new Date().toISOString(),
    });
    window.electronAPI.getRemoteMCPCacheStatus = vi.fn().mockResolvedValue({
      success: true,
      cacheStatus: { exists: false },
    });
    window.electronAPI.addRemoteMCPServer = vi.fn().mockResolvedValue({
      success: true,
      serverName: 'github-mcp',
    });

    const { result } = renderHook(() => useRemoteMCPServers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const addResult = await result.current.addServer(mockServers[0], 'user');

    expect(addResult.success).toBe(true);
    expect(window.electronAPI.addRemoteMCPServer).toHaveBeenCalledWith({
      server: mockServers[0],
      scope: 'user',
      projectPath: undefined,
      customName: undefined,
    });
  });

  it('should group servers by category', async () => {
    window.electronAPI.fetchRemoteMCPDirectory = vi.fn().mockResolvedValue({
      success: true,
      servers: mockServers,
      source: 'live',
      lastUpdated: new Date().toISOString(),
    });
    window.electronAPI.getRemoteMCPCacheStatus = vi.fn().mockResolvedValue({
      success: true,
      cacheStatus: { exists: false },
    });

    const { result } = renderHook(() => useRemoteMCPServers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.serversByCategory['developer-tools']).toHaveLength(1);
    expect(result.current.serversByCategory['productivity']).toHaveLength(1);
    expect(result.current.categories).toContain('developer-tools');
    expect(result.current.categories).toContain('productivity');
  });

  it('should support refresh functionality', async () => {
    let callCount = 0;
    window.electronAPI.fetchRemoteMCPDirectory = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        success: true,
        servers: mockServers.slice(0, callCount),
        source: 'live',
        lastUpdated: new Date().toISOString(),
      });
    });
    window.electronAPI.getRemoteMCPCacheStatus = vi.fn().mockResolvedValue({
      success: true,
      cacheStatus: { exists: false },
    });

    const { result } = renderHook(() => useRemoteMCPServers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.servers).toHaveLength(1);

    await act(async () => {
      await result.current.refresh(true);
    });

    await waitFor(() => {
      expect(result.current.servers).toHaveLength(2);
    });
  });

  it('should handle test connection failure', async () => {
    window.electronAPI.fetchRemoteMCPDirectory = vi.fn().mockResolvedValue({
      success: true,
      servers: mockServers,
      source: 'live',
      lastUpdated: new Date().toISOString(),
    });
    window.electronAPI.getRemoteMCPCacheStatus = vi.fn().mockResolvedValue({
      success: true,
      cacheStatus: { exists: false },
    });
    window.electronAPI.testRemoteMCPConnection = vi.fn().mockResolvedValue({
      success: false,
      error: 'Connection refused',
    });

    const { result } = renderHook(() => useRemoteMCPServers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const testResult = await result.current.testConnection(
      'https://invalid.example.com/mcp',
      'sse'
    );

    expect(testResult.success).toBe(false);
    expect(testResult.error).toBe('Connection refused');
    expect(testResult.errorCode).toBe('NETWORK_ERROR');
  });
});

describe('useConnectionTest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with initial state', () => {
    const { result } = renderHook(() => useConnectionTest());

    expect(result.current.testing).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.progress).toBeNull();
  });

  it('should test single connection', async () => {
    const mockResult = {
      success: true,
      latencyMs: 100,
      steps: [{ name: 'DNS', status: 'success' as const }],
    };

    window.electronAPI.testRemoteMCPConnection = vi.fn().mockResolvedValue({
      success: true,
      result: mockResult,
    });

    const { result } = renderHook(() => useConnectionTest());

    let testResult;
    await act(async () => {
      testResult = await result.current.testSingle('https://test.com/mcp', 'sse');
    });

    expect(testResult).toEqual(mockResult);
    expect(result.current.result).toEqual(mockResult);
    expect(result.current.testing).toBe(false);
  });

  it('should test multiple connections with progress', async () => {
    const mockResult = {
      success: true,
      latencyMs: 100,
      steps: [],
    };

    window.electronAPI.testRemoteMCPConnection = vi.fn().mockResolvedValue({
      success: true,
      result: mockResult,
    });

    const { result } = renderHook(() => useConnectionTest());

    const servers = [
      { id: 'server1', endpoint: 'https://s1.com/mcp', transport: 'sse' as const },
      { id: 'server2', endpoint: 'https://s2.com/mcp', transport: 'sse' as const },
    ];

    let results: Map<string, { success: boolean }>;
    await act(async () => {
      results = await result.current.testMultiple(servers);
    });

    expect(results!.size).toBe(2);
    expect(results!.get('server1')?.success).toBe(true);
    expect(results!.get('server2')?.success).toBe(true);
    expect(result.current.testing).toBe(false);
    expect(result.current.progress).toBeNull();
  });

  it('should reset state', async () => {
    const mockResult = {
      success: true,
      latencyMs: 100,
      steps: [],
    };

    window.electronAPI.testRemoteMCPConnection = vi.fn().mockResolvedValue({
      success: true,
      result: mockResult,
    });

    const { result } = renderHook(() => useConnectionTest());

    await act(async () => {
      await result.current.testSingle('https://test.com/mcp', 'sse');
    });

    expect(result.current.result).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.testing).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.progress).toBeNull();
  });
});
