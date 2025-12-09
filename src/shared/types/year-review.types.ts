/**
 * Types for the 2025 Year in Review feature
 */

import type { MetricsData, DailyStats, ModelStats, ProjectStats, MetricsSummary } from './metrics.types';

/**
 * Year Review configuration constants
 */
export const YEAR_REVIEW_CONFIG = {
  year: 2025,
  startDate: '2025-12-15T00:00:00',
  endDate: '2026-01-01T00:00:00',
  dataYearStart: '2025-01-01T00:00:00',
  dataYearEnd: '2025-12-31T23:59:59',
} as const;

/**
 * Badge definition for Year in Review achievements
 */
export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  detail: string;
  earned: boolean;
}

/**
 * Activity statistics computed from daily data
 */
export interface ActivityStats {
  peakMonth: {
    name: string;
    monthIndex: number;
    sessions: number;
    tokens: number;
    cost: number;
  } | null;
  peakDay: {
    date: string;
    dayOfWeek: string;
    sessions: number;
  } | null;
  monthlyData: Array<{ month: string; monthName: string; sessions: number; tokens: number; cost: number }>;
  longestStreak: number;
  totalDaysActive: number;
}

/**
 * Model personality for fun display
 */
export interface ModelPersonality {
  title: string;
  description: string;
  emoji: string;
}

/**
 * Fun fact computed from metrics
 */
export interface FunFact {
  id: string;
  icon: string;
  title: string;
  value: string;
  detail: string;
}

/**
 * Stats optimized for sharing
 */
export interface ShareStats {
  totalTokens: number;
  totalTokensFormatted: string;
  totalCost: number;
  totalSessions: number;
  longestStreak: number;
  topModel: string;
  topModelShort: string;
  topProject: string;
  cacheEfficiency: number;
  badgeCount: number;
}

/**
 * Complete Year in Review data
 */
export interface YearReviewData {
  metrics: MetricsData;
  summary: MetricsSummary;
  daily: DailyStats[];
  byModel: ModelStats[];
  byProject: ProjectStats[];
  badges: Badge[];
  activityStats: ActivityStats;
  shareStats: ShareStats;
  funFacts: FunFact[];
  tokenComparison: string;
  costComparison: string;
  modelPersonality: ModelPersonality;
}

/**
 * Notification state stored in localStorage
 */
export interface YearReviewNotificationState {
  hasSeenNotification: boolean;
  hasDismissedPermanently: boolean;
  lastShownAt: string | null;
}

/**
 * Card types for the review flow
 */
export type ReviewCardType =
  | 'welcome'
  | 'tokens'
  | 'cost'
  | 'activity'
  | 'model'
  | 'projects'
  | 'badges'
  | 'funfacts'
  | 'share';

/**
 * Props for individual review cards
 */
export interface ReviewCardProps {
  data: YearReviewData;
}
