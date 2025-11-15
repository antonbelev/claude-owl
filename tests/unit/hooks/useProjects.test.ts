import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProjects } from '@/renderer/hooks/useProjects';

describe('useProjects', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    // Mock electronAPI to prevent actual calls
    vi.stubGlobal('electronAPI', {
      checkClaudeConfig: vi.fn().mockResolvedValue({
        success: true,
        data: { exists: false, path: '', readable: false, projectCount: 0 },
      }),
      getProjects: vi.fn().mockResolvedValue({
        success: true,
        data: { projects: [] },
      }),
    });

    const { result } = renderHook(() => useProjects());

    expect(result.current.loading).toBe(true);
    expect(result.current.projects).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should fetch projects successfully', async () => {
    const mockProjects = [
      {
        path: '/home/user/project1',
        name: 'project1',
        mcpServerCount: 2,
        mcpServerNames: ['server1', 'server2'],
        hasTrustAccepted: true,
      },
      {
        path: '/home/user/project2',
        name: 'project2',
        mcpServerCount: 0,
        mcpServerNames: [],
        hasTrustAccepted: false,
      },
    ];

    vi.stubGlobal('electronAPI', {
      checkClaudeConfig: vi.fn().mockResolvedValue({
        success: true,
        data: { exists: true, path: '', readable: true, projectCount: 2 },
      }),
      getProjects: vi.fn().mockResolvedValue({
        success: true,
        data: { projects: mockProjects },
      }),
    });

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projects).toEqual(mockProjects);
    expect(result.current.error).toBeNull();
    expect(result.current.configExists).toBe(true);
  });

  it('should handle missing config file', async () => {
    vi.stubGlobal('electronAPI', {
      checkClaudeConfig: vi.fn().mockResolvedValue({
        success: true,
        data: { exists: false, path: '', readable: false, projectCount: 0 },
      }),
      getProjects: vi.fn(),
    });

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.configExists).toBe(false);
    expect(result.current.error).toContain('.claude.json not found');
  });

  it('should handle errors gracefully', async () => {
    vi.stubGlobal('electronAPI', {
      checkClaudeConfig: vi.fn().mockResolvedValue({
        success: true,
        data: { exists: true, path: '', readable: true, projectCount: 0 },
      }),
      getProjects: vi.fn().mockResolvedValue({
        success: false,
        error: 'Failed to read config',
      }),
    });

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to read config');
    expect(result.current.projects).toEqual([]);
  });

  it('should handle missing electronAPI', async () => {
    vi.stubGlobal('electronAPI', undefined);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Not running in Electron');
    expect(result.current.projects).toEqual([]);
  });
});
