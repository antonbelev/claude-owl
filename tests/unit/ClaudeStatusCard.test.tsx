import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ClaudeStatusCard } from '@/renderer/components/Dashboard/ClaudeStatusCard';

describe('ClaudeStatusCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    window.electronAPI.checkClaudeInstalled = vi.fn(
      () => new Promise(() => {}) // Never resolves
    );

    render(<ClaudeStatusCard />);

    expect(screen.getByText('Checking installation...')).toBeInTheDocument();
    expect(screen.getByTestId('claude-status-card')).toBeInTheDocument();
  });

  it('should render success state when Claude is installed', async () => {
    window.electronAPI.checkClaudeInstalled = vi.fn().mockResolvedValue({
      success: true,
      installed: true,
      version: '1.0.0',
      path: '/usr/local/bin/claude',
    });

    render(<ClaudeStatusCard />);

    await waitFor(() => {
      expect(screen.getByText('✓ Claude Code is installed')).toBeInTheDocument();
    });

    expect(screen.getByTestId('version-info')).toHaveTextContent('Version: 1.0.0');
    expect(screen.getByTestId('path-info')).toHaveTextContent('/usr/local/bin/claude');
    expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
  });

  it('should render warning state when Claude is not installed', async () => {
    window.electronAPI.checkClaudeInstalled = vi.fn().mockResolvedValue({
      success: true,
      installed: false,
    });

    render(<ClaudeStatusCard />);

    await waitFor(() => {
      expect(screen.getByText('Claude Code is not installed')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Please install Claude Code CLI to use this application.')
    ).toBeInTheDocument();
    expect(screen.getByText('Installation Guide')).toBeInTheDocument();
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('should render error state when check fails', async () => {
    window.electronAPI.checkClaudeInstalled = vi.fn().mockResolvedValue({
      success: false,
      installed: false,
      error: 'Network error',
    });

    render(<ClaudeStatusCard />);

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    });

    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('should call refetch when retry button is clicked', async () => {
    let callCount = 0;
    window.electronAPI.checkClaudeInstalled = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        success: true,
        installed: false,
      });
    });

    render(<ClaudeStatusCard />);

    await waitFor(() => {
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    expect(callCount).toBe(1);

    fireEvent.click(screen.getByTestId('retry-button'));

    await waitFor(() => {
      expect(callCount).toBe(2);
    });
  });

  it('should show refresh button when installed', async () => {
    let callCount = 0;
    window.electronAPI.checkClaudeInstalled = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        success: true,
        installed: true,
        version: `1.0.${callCount}`,
      });
    });

    render(<ClaudeStatusCard />);

    await waitFor(() => {
      expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
    });

    expect(screen.getByTestId('version-info')).toHaveTextContent('1.0.1');

    fireEvent.click(screen.getByTestId('refresh-button'));

    await waitFor(() => {
      expect(screen.getByTestId('version-info')).toHaveTextContent('1.0.2');
    });
  });
});
