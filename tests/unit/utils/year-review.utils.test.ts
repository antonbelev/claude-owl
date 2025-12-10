import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isYearReviewActive,
  filter2025Data,
  computeActivityStats,
  computeLongestStreak,
  computeBadges,
  getModelPersonality,
  formatNumber,
  getTokenComparison,
  getCostComparison,
  computeFunFacts,
  computeShareStats,
} from '@/shared/utils/year-review.utils';
import type { MetricsData, DailyStats, SessionWithCost } from '@/shared/types';

describe('year-review.utils', () => {
  describe('isYearReviewActive', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true in December 2025', () => {
      vi.setSystemTime(new Date('2025-12-20T10:00:00'));
      expect(isYearReviewActive()).toBe(true);
    });

    it('returns true on Dec 31 2025', () => {
      vi.setSystemTime(new Date('2025-12-31T23:59:59'));
      expect(isYearReviewActive()).toBe(true);
    });

    it('returns true in early 2025', () => {
      vi.setSystemTime(new Date('2025-01-15T10:00:00'));
      expect(isYearReviewActive()).toBe(true);
    });

    it('returns true in mid-2025', () => {
      vi.setSystemTime(new Date('2025-06-15T10:00:00'));
      expect(isYearReviewActive()).toBe(true);
    });

    it('returns false on Jan 1 2026', () => {
      vi.setSystemTime(new Date('2026-01-01T00:00:00'));
      expect(isYearReviewActive()).toBe(false);
    });

    it('returns false after 2025', () => {
      vi.setSystemTime(new Date('2026-03-20T10:00:00'));
      expect(isYearReviewActive()).toBe(false);
    });
  });

  describe('formatNumber', () => {
    it('formats billions correctly', () => {
      expect(formatNumber(1_500_000_000)).toBe('1.5B');
    });

    it('formats millions correctly', () => {
      expect(formatNumber(1_500_000)).toBe('1.5M');
    });

    it('formats thousands correctly', () => {
      expect(formatNumber(1_500)).toBe('1.5K');
    });

    it('formats small numbers with locale', () => {
      expect(formatNumber(500)).toBe('500');
    });
  });

  describe('getModelPersonality', () => {
    it('returns Perfectionist for Opus', () => {
      const result = getModelPersonality('claude-opus-4-5-20251101');
      expect(result.title).toBe('The Perfectionist');
      expect(result.emoji).toBe('👑');
    });

    it('returns Balanced Genius for Sonnet', () => {
      const result = getModelPersonality('claude-3-sonnet-20240229');
      expect(result.title).toBe('The Balanced Genius');
      expect(result.emoji).toBe('🎯');
    });

    it('returns Speed Demon for Haiku', () => {
      const result = getModelPersonality('claude-3-haiku-20240307');
      expect(result.title).toBe('The Speed Demon');
      expect(result.emoji).toBe('⚡');
    });

    it('returns Explorer for unknown models', () => {
      const result = getModelPersonality('some-other-model');
      expect(result.title).toBe('The Explorer');
      expect(result.emoji).toBe('🧭');
    });
  });

  describe('getTokenComparison', () => {
    it('returns War & Peace comparison for 10M+ tokens', () => {
      const result = getTokenComparison(15_000_000);
      expect(result).toContain('War & Peace');
    });

    it('returns Harry Potter comparison for 5M+ tokens', () => {
      const result = getTokenComparison(6_000_000);
      expect(result).toContain('Harry Potter');
    });

    it('returns Bible comparison for 1M+ tokens', () => {
      const result = getTokenComparison(2_000_000);
      expect(result).toContain('Bible');
    });

    it('returns tweets comparison for 100K+ tokens', () => {
      const result = getTokenComparison(200_000);
      expect(result).toContain('tweets');
    });

    it('returns novel comparison for 10K+ tokens', () => {
      const result = getTokenComparison(50_000);
      expect(result).toContain('novel');
    });

    it('returns journey start for small amounts', () => {
      const result = getTokenComparison(1000);
      expect(result).toContain('journey');
    });
  });

  describe('getCostComparison', () => {
    it('returns lattes comparison for high cost', () => {
      const result = getCostComparison(600);
      expect(result).toContain('lattes');
    });

    it('returns Netflix comparison for medium-high cost', () => {
      const result = getCostComparison(150);
      expect(result).toContain('Netflix');
    });

    it('returns avocado toast comparison for medium cost', () => {
      const result = getCostComparison(30);
      expect(result).toContain('avocado');
    });

    it('returns dinner comparison for low-medium cost', () => {
      const result = getCostComparison(10);
      expect(result).toContain('dinner');
    });

    it('returns pocket change for low cost', () => {
      const result = getCostComparison(2);
      expect(result).toContain('Pocket change');
    });
  });

  describe('computeLongestStreak', () => {
    it('returns 0 for empty array', () => {
      expect(computeLongestStreak([])).toBe(0);
    });

    it('returns 1 for single day', () => {
      const daily: DailyStats[] = [
        { date: '2025-06-01', sessionCount: 1, totalTokens: 100, cost: 0.5 },
      ];
      expect(computeLongestStreak(daily)).toBe(1);
    });

    it('returns correct streak for consecutive days', () => {
      const daily: DailyStats[] = [
        { date: '2025-06-01', sessionCount: 1, totalTokens: 100, cost: 0.5 },
        { date: '2025-06-02', sessionCount: 2, totalTokens: 200, cost: 1.0 },
        { date: '2025-06-03', sessionCount: 1, totalTokens: 150, cost: 0.75 },
        { date: '2025-06-04', sessionCount: 3, totalTokens: 300, cost: 1.5 },
      ];
      expect(computeLongestStreak(daily)).toBe(4);
    });

    it('returns correct streak when there are gaps', () => {
      const daily: DailyStats[] = [
        { date: '2025-06-01', sessionCount: 1, totalTokens: 100, cost: 0.5 },
        { date: '2025-06-02', sessionCount: 2, totalTokens: 200, cost: 1.0 },
        // Gap here
        { date: '2025-06-05', sessionCount: 1, totalTokens: 150, cost: 0.75 },
        { date: '2025-06-06', sessionCount: 3, totalTokens: 300, cost: 1.5 },
        { date: '2025-06-07', sessionCount: 2, totalTokens: 250, cost: 1.25 },
      ];
      expect(computeLongestStreak(daily)).toBe(3);
    });

    it('handles unsorted input', () => {
      const daily: DailyStats[] = [
        { date: '2025-06-03', sessionCount: 1, totalTokens: 150, cost: 0.75 },
        { date: '2025-06-01', sessionCount: 1, totalTokens: 100, cost: 0.5 },
        { date: '2025-06-02', sessionCount: 2, totalTokens: 200, cost: 1.0 },
      ];
      expect(computeLongestStreak(daily)).toBe(3);
    });
  });

  describe('computeActivityStats', () => {
    it('returns correct peak month', () => {
      const daily: DailyStats[] = [
        { date: '2025-01-15', sessionCount: 5, totalTokens: 1000, cost: 1.0 },
        { date: '2025-01-16', sessionCount: 3, totalTokens: 800, cost: 0.8 },
        { date: '2025-06-10', sessionCount: 2, totalTokens: 500, cost: 0.5 },
      ];

      const result = computeActivityStats(daily);

      expect(result.peakMonth?.name).toBe('January');
      expect(result.peakMonth?.sessions).toBe(8);
    });

    it('returns correct peak day', () => {
      const daily: DailyStats[] = [
        { date: '2025-06-15', sessionCount: 5, totalTokens: 1000, cost: 1.0 },
        { date: '2025-06-16', sessionCount: 10, totalTokens: 2000, cost: 2.0 },
        { date: '2025-06-17', sessionCount: 3, totalTokens: 600, cost: 0.6 },
      ];

      const result = computeActivityStats(daily);

      expect(result.peakDay?.sessions).toBe(10);
      expect(result.peakDay?.date).toBe('2025-06-16');
    });

    it('computes total days active', () => {
      const daily: DailyStats[] = [
        { date: '2025-01-15', sessionCount: 5, totalTokens: 1000, cost: 1.0 },
        { date: '2025-03-20', sessionCount: 3, totalTokens: 800, cost: 0.8 },
        { date: '2025-06-10', sessionCount: 2, totalTokens: 500, cost: 0.5 },
      ];

      const result = computeActivityStats(daily);

      expect(result.totalDaysActive).toBe(3);
    });
  });

  describe('filter2025Data', () => {
    it('filters sessions to only 2025', () => {
      const mockData: MetricsData = {
        sessions: [
          {
            sessionId: 's1',
            projectPath: '/project',
            startTime: '2024-12-15T10:00:00Z',
            endTime: '2024-12-15T11:00:00Z',
            totalTokens: 1000,
            cost: 1.0,
            messages: [],
          },
          {
            sessionId: 's2',
            projectPath: '/project',
            startTime: '2025-06-15T10:00:00Z',
            endTime: '2025-06-15T11:00:00Z',
            totalTokens: 2000,
            cost: 2.0,
            messages: [],
          },
          {
            sessionId: 's3',
            projectPath: '/project',
            startTime: '2026-01-15T10:00:00Z',
            endTime: '2026-01-15T11:00:00Z',
            totalTokens: 3000,
            cost: 3.0,
            messages: [],
          },
        ],
        daily: [
          { date: '2024-12-15', sessionCount: 1, totalTokens: 1000, cost: 1.0 },
          { date: '2025-06-15', sessionCount: 1, totalTokens: 2000, cost: 2.0 },
          { date: '2026-01-15', sessionCount: 1, totalTokens: 3000, cost: 3.0 },
        ],
        byModel: [],
        byProject: [],
        summary: {
          totalSessions: 3,
          totalMessages: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCacheCreationTokens: 0,
          totalCacheReadTokens: 0,
          totalTokens: 6000,
          totalCost: 6.0,
          daysActive: 3,
          topModel: 'claude-3-sonnet',
          averageCostPerSession: 2.0,
          cacheEfficiency: 0,
          dateRange: { start: '2024-12-15', end: '2026-01-15' },
        },
      };

      const result = filter2025Data(mockData);

      expect(result.sessions.length).toBe(1);
      expect(result.sessions[0].sessionId).toBe('s2');
      expect(result.daily.length).toBe(1);
      expect(result.daily[0].date).toBe('2025-06-15');
    });

    it('correctly identifies top model by session count not message count', () => {
      const mockData: MetricsData = {
        sessions: [
          {
            sessionId: 's1',
            projectPath: '/project',
            startTime: '2025-01-15T10:00:00Z',
            endTime: '2025-01-15T11:00:00Z',
            totalTokens: 1000,
            cost: 1.0,
            messages: [
              {
                model: 'claude-haiku-4',
                inputTokens: 500,
                outputTokens: 500,
                cacheCreationTokens: 0,
                cacheReadTokens: 0,
                timestamp: '2025-01-15T10:30:00Z',
              },
            ],
          },
          {
            sessionId: 's2',
            projectPath: '/project',
            startTime: '2025-02-15T10:00:00Z',
            endTime: '2025-02-15T11:00:00Z',
            totalTokens: 2000,
            cost: 2.0,
            messages: [
              {
                model: 'claude-haiku-4',
                inputTokens: 1000,
                outputTokens: 1000,
                cacheCreationTokens: 0,
                cacheReadTokens: 0,
                timestamp: '2025-02-15T10:30:00Z',
              },
            ],
          },
          {
            sessionId: 's3',
            projectPath: '/project',
            startTime: '2025-03-15T10:00:00Z',
            endTime: '2025-03-15T11:00:00Z',
            totalTokens: 3000,
            cost: 3.0,
            messages: [
              {
                model: 'claude-sonnet-4',
                inputTokens: 500,
                outputTokens: 500,
                cacheCreationTokens: 0,
                cacheReadTokens: 0,
                timestamp: '2025-03-15T10:10:00Z',
              },
              {
                model: 'claude-sonnet-4',
                inputTokens: 500,
                outputTokens: 500,
                cacheCreationTokens: 0,
                cacheReadTokens: 0,
                timestamp: '2025-03-15T10:20:00Z',
              },
              {
                model: 'claude-sonnet-4',
                inputTokens: 500,
                outputTokens: 500,
                cacheCreationTokens: 0,
                cacheReadTokens: 0,
                timestamp: '2025-03-15T10:30:00Z',
              },
            ],
          },
        ],
        daily: [],
        byModel: [],
        byProject: [],
        summary: {
          totalSessions: 3,
          totalMessages: 5,
          totalInputTokens: 3000,
          totalOutputTokens: 3000,
          totalCacheCreationTokens: 0,
          totalCacheReadTokens: 0,
          totalTokens: 6000,
          totalCost: 6.0,
          daysActive: 3,
          topModel: 'claude-3-sonnet',
          averageCostPerSession: 2.0,
          cacheEfficiency: 0,
          dateRange: { start: '2025-01-15', end: '2025-03-15' },
        },
      };

      const result = filter2025Data(mockData);

      // Haiku has 2 sessions, Sonnet has 1 session (but 3 messages)
      // Top model should be Haiku (by session count, not message count)
      expect(result.summary.topModel).toBe('claude-haiku-4');
    });
  });

  describe('computeBadges', () => {
    const createMockSession = (overrides?: Partial<SessionWithCost>): SessionWithCost => ({
      sessionId: 's1',
      projectPath: '/project',
      startTime: '2025-06-15T10:00:00Z',
      endTime: '2025-06-15T11:00:00Z',
      totalTokens: 1000,
      cost: 1.0,
      messages: [
        {
          model: 'claude-3-sonnet',
          inputTokens: 500,
          outputTokens: 500,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          timestamp: '2025-06-15T10:30:00Z',
        },
      ],
      ...overrides,
    });

    it('awards Centurion badge for 100+ sessions', () => {
      const sessions: SessionWithCost[] = Array(100)
        .fill(null)
        .map((_, i) => createMockSession({ sessionId: `s${i}` }));

      const summary = {
        totalSessions: 100,
        totalMessages: 100,
        totalInputTokens: 50000,
        totalOutputTokens: 50000,
        totalCacheCreationTokens: 0,
        totalCacheReadTokens: 0,
        totalTokens: 100000,
        totalCost: 10,
        daysActive: 50,
        topModel: 'claude-3-sonnet',
        averageCostPerSession: 0.1,
        cacheEfficiency: 0,
        dateRange: { start: '2025-01-01', end: '2025-06-15' },
      };

      const daily: DailyStats[] = [];

      const badges = computeBadges(sessions, summary, daily);

      const centurion = badges.find((b) => b.id === 'centurion');
      expect(centurion?.earned).toBe(true);
    });

    it('awards Million Club badge for 1M+ tokens', () => {
      const sessions = [createMockSession()];
      const summary = {
        totalSessions: 1,
        totalMessages: 1,
        totalInputTokens: 500000,
        totalOutputTokens: 500000,
        totalCacheCreationTokens: 0,
        totalCacheReadTokens: 0,
        totalTokens: 1000000,
        totalCost: 10,
        daysActive: 1,
        topModel: 'claude-3-sonnet',
        averageCostPerSession: 10,
        cacheEfficiency: 0,
        dateRange: { start: '2025-06-15', end: '2025-06-15' },
      };

      const daily: DailyStats[] = [];

      const badges = computeBadges(sessions, summary, daily);

      const millionClub = badges.find((b) => b.id === 'million-club');
      expect(millionClub?.earned).toBe(true);
    });

    it('awards Cache Master badge for 50%+ cache efficiency', () => {
      const sessions = [createMockSession()];
      const summary = {
        totalSessions: 1,
        totalMessages: 1,
        totalInputTokens: 500,
        totalOutputTokens: 500,
        totalCacheCreationTokens: 1000,
        totalCacheReadTokens: 1000,
        totalTokens: 3000,
        totalCost: 1,
        daysActive: 1,
        topModel: 'claude-3-sonnet',
        averageCostPerSession: 1,
        cacheEfficiency: 50,
        dateRange: { start: '2025-06-15', end: '2025-06-15' },
      };

      const daily: DailyStats[] = [];

      const badges = computeBadges(sessions, summary, daily);

      const cacheMaster = badges.find((b) => b.id === 'cache-master');
      expect(cacheMaster?.earned).toBe(true);
    });

    it('does not award badges when thresholds are not met', () => {
      const sessions = [createMockSession()];
      const summary = {
        totalSessions: 1,
        totalMessages: 1,
        totalInputTokens: 500,
        totalOutputTokens: 500,
        totalCacheCreationTokens: 0,
        totalCacheReadTokens: 0,
        totalTokens: 1000,
        totalCost: 1,
        daysActive: 1,
        topModel: 'claude-3-sonnet',
        averageCostPerSession: 1,
        cacheEfficiency: 0,
        dateRange: { start: '2025-06-15', end: '2025-06-15' },
      };

      const daily: DailyStats[] = [];

      const badges = computeBadges(sessions, summary, daily);

      const centurion = badges.find((b) => b.id === 'centurion');
      expect(centurion?.earned).toBe(false);

      const millionClub = badges.find((b) => b.id === 'million-club');
      expect(millionClub?.earned).toBe(false);
    });
  });

  describe('computeFunFacts', () => {
    it('computes average messages per session', () => {
      const sessions: SessionWithCost[] = [
        {
          sessionId: 's1',
          projectPath: '/project',
          startTime: '2025-06-15T10:00:00Z',
          endTime: '2025-06-15T11:00:00Z',
          totalTokens: 1000,
          cost: 1.0,
          messages: [
            {
              model: 'claude-3-sonnet',
              inputTokens: 500,
              outputTokens: 500,
              cacheCreationTokens: 0,
              cacheReadTokens: 0,
              timestamp: '2025-06-15T10:30:00Z',
            },
          ],
        },
      ];

      const summary = {
        totalSessions: 1,
        totalMessages: 10,
        totalInputTokens: 5000,
        totalOutputTokens: 5000,
        totalCacheCreationTokens: 0,
        totalCacheReadTokens: 0,
        totalTokens: 10000,
        totalCost: 2.0,
        daysActive: 5,
        topModel: 'claude-3-sonnet',
        averageCostPerSession: 2.0,
        cacheEfficiency: 0,
        dateRange: { start: '2025-06-15', end: '2025-06-20' },
      };

      const funFacts = computeFunFacts(sessions, summary);

      const avgMessages = funFacts.find((f) => f.id === 'avg-messages');
      expect(avgMessages).toBeDefined();
      expect(avgMessages?.value).toBe('10.0');
    });

    it('includes cache savings when available', () => {
      const sessions: SessionWithCost[] = [
        {
          sessionId: 'session-1',
          projectPath: '/test/project',
          startTime: new Date('2025-06-01T10:00:00Z'),
          messages: [
            {
              model: 'claude-sonnet-4-5-20250929',
              inputTokens: 50000,
              outputTokens: 50000,
              cacheCreationTokens: 10000,
              cacheReadTokens: 100000, // Will save: 100K * $2.70 per MTok = $0.27
              timestamp: new Date('2025-06-01T10:00:00Z'),
            },
          ],
          cost: 2.0,
          totalTokens: 210000,
          cacheEfficiency: 90,
        },
      ];
      const summary = {
        totalSessions: 1,
        totalMessages: 1,
        totalInputTokens: 50000,
        totalOutputTokens: 50000,
        totalCacheCreationTokens: 10000,
        totalCacheReadTokens: 100000,
        totalTokens: 210000,
        totalCost: 2.0,
        daysActive: 1,
        topModel: 'claude-sonnet-4-5-20250929',
        averageCostPerSession: 2.0,
        cacheEfficiency: 90,
        dateRange: { start: '2025-06-01', end: '2025-06-01' },
      };

      const funFacts = computeFunFacts(sessions, summary);

      const cacheSavings = funFacts.find((f) => f.id === 'cache-savings');
      expect(cacheSavings).toBeDefined();
      // Should show savings: 100K tokens * $2.70/MTok = $0.27
      expect(cacheSavings?.value).toBe('$0.27');
    });
  });

  describe('computeShareStats', () => {
    it('formats share statistics correctly', () => {
      const summary = {
        totalSessions: 100,
        totalMessages: 500,
        totalInputTokens: 500000,
        totalOutputTokens: 500000,
        totalCacheCreationTokens: 0,
        totalCacheReadTokens: 0,
        totalTokens: 1000000,
        totalCost: 50.0,
        daysActive: 100,
        topModel: 'claude-3-sonnet-20240229',
        averageCostPerSession: 0.5,
        cacheEfficiency: 0,
        dateRange: { start: '2025-01-01', end: '2025-12-31' },
      };

      const activityStats = {
        peakMonth: null,
        peakDay: null,
        monthlyData: [],
        longestStreak: 15,
        totalDaysActive: 100,
      };

      const badges = [
        {
          id: 'centurion',
          name: 'Centurion',
          emoji: '💯',
          description: '100+ sessions',
          detail: '100 sessions',
          earned: true,
        },
        {
          id: 'million-club',
          name: 'Million Club',
          emoji: '🎰',
          description: '1M+ tokens',
          detail: '1M tokens',
          earned: true,
        },
      ];

      const byProject = [{ projectName: 'my-project' }];

      const shareStats = computeShareStats(summary, activityStats, badges, byProject);

      expect(shareStats.totalTokens).toBe(1000000);
      expect(shareStats.totalTokensFormatted).toBe('1.0M');
      expect(shareStats.totalCost).toBe(50.0);
      expect(shareStats.totalSessions).toBe(100);
      expect(shareStats.longestStreak).toBe(15);
      expect(shareStats.topModelShort).toBe('3 Sonnet');
      expect(shareStats.topProject).toBe('my-project');
      expect(shareStats.badgeCount).toBe(2);
    });
  });
});
