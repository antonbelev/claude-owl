import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useYearReview } from '@/renderer/hooks/useYearReview';
import type { MetricsData } from '@/shared/types';

// Mock the year-review.utils module
vi.mock('@/shared/utils/year-review.utils', () => ({
  isYearReviewActive: vi.fn(() => true),
  buildYearReviewData: vi.fn((data) => ({
    metrics: data,
    summary: data.summary,
    daily: data.daily,
    byModel: data.byModel,
    byProject: data.byProject,
    badges: [],
    activityStats: {
      peakMonth: null,
      peakDay: null,
      monthlyData: [],
      longestStreak: 5,
      totalDaysActive: 10,
    },
    shareStats: {
      totalTokens: 10000,
      totalTokensFormatted: '10.0K',
      totalCost: 5.0,
      totalSessions: 10,
      longestStreak: 5,
      topModel: 'claude-3-sonnet',
      topModelShort: '3 Sonnet',
      topProject: 'my-project',
      cacheEfficiency: 50,
      badgeCount: 2,
    },
    funFacts: [],
    tokenComparison: 'A great start!',
    costComparison: 'Pocket change!',
    modelPersonality: {
      title: 'The Balanced Genius',
      description: 'You appreciate quality AND speed!',
      emoji: '🎯',
    },
  })),
}));

describe('useYearReview', () => {
  const mockMetricsData: MetricsData = {
    sessions: [
      {
        sessionId: 's1',
        projectPath: '/project',
        startTime: '2025-06-15T10:00:00Z',
        endTime: '2025-06-15T11:00:00Z',
        totalTokens: 10000,
        cost: 5.0,
        messages: [
          {
            model: 'claude-3-sonnet',
            inputTokens: 5000,
            outputTokens: 5000,
            cacheCreationTokens: 0,
            cacheReadTokens: 0,
            timestamp: '2025-06-15T10:30:00Z',
          },
        ],
      },
    ],
    daily: [
      { date: '2025-06-15', sessionCount: 1, totalTokens: 10000, cost: 5.0 },
    ],
    byModel: [
      {
        model: 'claude-3-sonnet',
        messageCount: 1,
        sessionCount: 1,
        inputTokens: 5000,
        outputTokens: 5000,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        totalTokens: 10000,
        cost: 5.0,
        percentage: 100,
      },
    ],
    byProject: [
      {
        projectPath: '/project',
        projectName: 'my-project',
        sessionCount: 1,
        totalTokens: 10000,
        cost: 5.0,
        lastActivity: new Date('2025-06-15'),
        topModel: 'claude-3-sonnet',
      },
    ],
    summary: {
      totalSessions: 1,
      totalMessages: 1,
      totalInputTokens: 5000,
      totalOutputTokens: 5000,
      totalCacheCreationTokens: 0,
      totalCacheReadTokens: 0,
      totalTokens: 10000,
      totalCost: 5.0,
      daysActive: 1,
      topModel: 'claude-3-sonnet',
      averageCostPerSession: 5.0,
      cacheEfficiency: 0,
      dateRange: { start: '2025-06-15', end: '2025-06-15' },
    },
  };

  beforeEach(() => {
    vi.stubGlobal('electronAPI', {
      computeMetrics: vi.fn().mockResolvedValue({
        success: true,
        data: mockMetricsData,
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should return loading state initially', () => {
    const { result } = renderHook(() => useYearReview());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('should fetch and return year review data', async () => {
    const { result } = renderHook(() => useYearReview());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.hasData).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle API errors', async () => {
    vi.stubGlobal('electronAPI', {
      computeMetrics: vi.fn().mockResolvedValue({
        success: false,
        error: 'Failed to fetch metrics',
      }),
    });

    const { result } = renderHook(() => useYearReview());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch metrics');
    expect(result.current.data).toBeNull();
  });

  it('should return isActive status', async () => {
    const { result } = renderHook(() => useYearReview());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isActive).toBe(true);
  });

  it('should return hasData as false when no sessions', async () => {
    vi.stubGlobal('electronAPI', {
      computeMetrics: vi.fn().mockResolvedValue({
        success: true,
        data: {
          ...mockMetricsData,
          sessions: [],
        },
      }),
    });

    const { result } = renderHook(() => useYearReview());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasData).toBe(false);
  });

  it('should handle missing electronAPI', async () => {
    vi.stubGlobal('electronAPI', undefined);

    const { result } = renderHook(() => useYearReview());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Not running in Electron');
  });
});
