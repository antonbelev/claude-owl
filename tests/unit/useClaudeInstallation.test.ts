import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClaudeInstallation } from '@/renderer/hooks/useClaudeInstallation';

describe('useClaudeInstallation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with loading state', () => {
    const { result } = renderHook(() => useClaudeInstallation());

    expect(result.current.loading).toBe(true);
    expect(result.current.installed).toBe(false);
  });

  it('should set installed status when Claude is found', async () => {
    window.electronAPI.checkClaudeInstalled = vi.fn().mockResolvedValue({
      success: true,
      installed: true,
      version: '1.0.0',
      path: '/usr/local/bin/claude',
    });

    const { result } = renderHook(() => useClaudeInstallation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.installed).toBe(true);
    expect(result.current.version).toBe('1.0.0');
    expect(result.current.path).toBe('/usr/local/bin/claude');
    expect(result.current.error).toBeNull();
  });

  it('should handle not installed status', async () => {
    window.electronAPI.checkClaudeInstalled = vi.fn().mockResolvedValue({
      success: true,
      installed: false,
    });

    const { result } = renderHook(() => useClaudeInstallation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.installed).toBe(false);
    expect(result.current.version).toBeNull();
    expect(result.current.path).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle API errors', async () => {
    window.electronAPI.checkClaudeInstalled = vi.fn().mockResolvedValue({
      success: false,
      installed: false,
      error: 'Failed to check installation',
    });

    const { result } = renderHook(() => useClaudeInstallation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.installed).toBe(false);
    expect(result.current.error).toBe('Failed to check installation');
  });

  it('should support refetch functionality', async () => {
    let callCount = 0;
    window.electronAPI.checkClaudeInstalled = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        success: true,
        installed: true,
        version: `1.0.${callCount}`,
      });
    });

    const { result } = renderHook(() => useClaudeInstallation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.version).toBe('1.0.1');

    // Refetch
    result.current.refetch();

    await waitFor(() => {
      expect(result.current.version).toBe('1.0.2');
    });

    expect(callCount).toBe(2);
  });
});
