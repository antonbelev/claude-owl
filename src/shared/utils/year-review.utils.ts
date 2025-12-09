/**
 * Utility functions for the 2025 Year in Review feature
 *
 * NOTE: localStorage-related functions are in src/renderer/utils/year-review-storage.ts
 * since they can only run in the renderer process.
 */

import type {
  MetricsData,
  DailyStats,
  SessionWithCost,
  ModelStats,
  MetricsSummary,
  Badge,
  ActivityStats,
  ModelPersonality,
  FunFact,
  ShareStats,
  YearReviewData,
} from '../types';

/**
 * Check if the Year in Review feature should be active (Now through Jan 1, 2026)
 * Feature is always active from the current date until end of year
 */
export function isYearReviewActive(): boolean {
  const now = new Date();
  const endDate = new Date('2026-01-01T00:00:00');
  return now < endDate;
}

/**
 * Filter metrics data to only include 2025 data
 */
export function filter2025Data(data: MetricsData): MetricsData {
  const startOf2025 = new Date('2025-01-01T00:00:00');
  const endOf2025 = new Date('2025-12-31T23:59:59');

  const filteredSessions = data.sessions.filter((s) => {
    const date = new Date(s.startTime);
    return date >= startOf2025 && date <= endOf2025;
  });

  const filteredDaily = data.daily.filter((d) => {
    const date = new Date(d.date);
    return date >= startOf2025 && date <= endOf2025;
  });

  // Recompute summary for 2025 data
  const summary = recomputeSummary(filteredSessions, filteredDaily);

  // Recompute model stats
  const byModel = recomputeModelStats(filteredSessions);

  // Recompute project stats
  const byProject = recomputeProjectStats(filteredSessions);

  return {
    sessions: filteredSessions,
    daily: filteredDaily,
    byModel,
    byProject,
    summary,
  };
}

/**
 * Recompute summary from filtered sessions
 */
function recomputeSummary(sessions: SessionWithCost[], daily: DailyStats[]): MetricsSummary {
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheCreationTokens = 0;
  let totalCacheReadTokens = 0;
  let totalMessages = 0;
  let totalCost = 0;

  for (const session of sessions) {
    totalCost += session.cost;
    for (const msg of session.messages) {
      totalMessages++;
      totalInputTokens += msg.inputTokens;
      totalOutputTokens += msg.outputTokens;
      totalCacheCreationTokens += msg.cacheCreationTokens;
      totalCacheReadTokens += msg.cacheReadTokens;
    }
  }

  const totalTokens = totalInputTokens + totalOutputTokens + totalCacheCreationTokens + totalCacheReadTokens;
  const totalCacheTokens = totalCacheCreationTokens + totalCacheReadTokens;
  const cacheEfficiency = totalCacheTokens > 0 ? (totalCacheReadTokens / totalCacheTokens) * 100 : 0;

  // Find top model by total tokens (not session count)
  const modelTokenCounts = new Map<string, number>();
  for (const session of sessions) {
    for (const msg of session.messages) {
      // Filter out non-Claude models (synthetic, unknown, etc.)
      if (!msg.model || msg.model === 'unknown' || msg.model.includes('synthetic')) {
        continue;
      }
      const tokens = msg.inputTokens + msg.outputTokens + msg.cacheCreationTokens + msg.cacheReadTokens;
      modelTokenCounts.set(msg.model, (modelTokenCounts.get(msg.model) || 0) + tokens);
    }
  }
  let topModel = 'Unknown';
  let topModelTokens = 0;
  for (const [model, tokens] of modelTokenCounts) {
    if (tokens > topModelTokens) {
      topModel = model;
      topModelTokens = tokens;
    }
  }

  const dates = daily.map((d) => d.date).sort();
  const today = new Date().toISOString().split('T')[0] || new Date().toISOString().slice(0, 10);
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  const dateRange = {
    start: startDate !== undefined ? startDate : today,
    end: endDate !== undefined ? endDate : today,
  };

  return {
    totalSessions: sessions.length,
    totalMessages,
    totalInputTokens,
    totalOutputTokens,
    totalCacheCreationTokens,
    totalCacheReadTokens,
    totalTokens,
    totalCost,
    daysActive: daily.length,
    topModel,
    averageCostPerSession: sessions.length > 0 ? totalCost / sessions.length : 0,
    cacheEfficiency,
    dateRange,
  };
}

/**
 * Recompute model stats from filtered sessions
 */
function recomputeModelStats(sessions: SessionWithCost[]): ModelStats[] {
  const modelMap = new Map<
    string,
    {
      messageCount: number;
      sessionIds: Set<string>;
      inputTokens: number;
      outputTokens: number;
      cacheCreationTokens: number;
      cacheReadTokens: number;
      cost: number;
    }
  >();

  for (const session of sessions) {
    for (const msg of session.messages) {
      // Filter out non-Claude models (synthetic, unknown, etc.)
      if (!msg.model || msg.model === 'unknown' || msg.model.includes('synthetic')) {
        continue;
      }

      const existing = modelMap.get(msg.model) || {
        messageCount: 0,
        sessionIds: new Set<string>(),
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        cost: 0,
      };

      existing.messageCount++;
      existing.sessionIds.add(session.sessionId);
      existing.inputTokens += msg.inputTokens;
      existing.outputTokens += msg.outputTokens;
      existing.cacheCreationTokens += msg.cacheCreationTokens;
      existing.cacheReadTokens += msg.cacheReadTokens;

      // Estimate cost per message (simplified)
      const msgCost = session.messages.length > 0 ? session.cost / session.messages.length : 0;
      existing.cost += msgCost;

      modelMap.set(msg.model, existing);
    }
  }

  // Calculate total tokens for percentage
  const allTokens = Array.from(modelMap.values()).reduce(
    (sum, stats) =>
      sum + stats.inputTokens + stats.outputTokens + stats.cacheCreationTokens + stats.cacheReadTokens,
    0
  );

  return Array.from(modelMap.entries())
    .map(([model, stats]) => {
      const totalTokens =
        stats.inputTokens + stats.outputTokens + stats.cacheCreationTokens + stats.cacheReadTokens;
      return {
        model,
        messageCount: stats.messageCount,
        sessionCount: stats.sessionIds.size,
        inputTokens: stats.inputTokens,
        outputTokens: stats.outputTokens,
        cacheCreationTokens: stats.cacheCreationTokens,
        cacheReadTokens: stats.cacheReadTokens,
        totalTokens,
        cost: stats.cost,
        // Percentage now based on total tokens
        percentage: allTokens > 0 ? (totalTokens / allTokens) * 100 : 0,
      };
    })
    .sort((a, b) => b.totalTokens - a.totalTokens); // Sort by total tokens
}

/**
 * Recompute project stats from filtered sessions
 */
function recomputeProjectStats(sessions: SessionWithCost[]) {
  const projectMap = new Map<
    string,
    {
      sessionCount: number;
      totalTokens: number;
      cost: number;
      lastActivity: Date;
      modelCounts: Map<string, number>;
    }
  >();

  for (const session of sessions) {
    const existing = projectMap.get(session.projectPath) || {
      sessionCount: 0,
      totalTokens: 0,
      cost: 0,
      lastActivity: new Date(0),
      modelCounts: new Map<string, number>(),
    };

    existing.sessionCount++;
    existing.totalTokens += session.totalTokens;
    existing.cost += session.cost;

    const sessionDate = new Date(session.startTime);
    if (sessionDate > existing.lastActivity) {
      existing.lastActivity = sessionDate;
    }

    for (const msg of session.messages) {
      existing.modelCounts.set(msg.model, (existing.modelCounts.get(msg.model) || 0) + 1);
    }

    projectMap.set(session.projectPath, existing);
  }

  return Array.from(projectMap.entries())
    .map(([projectPath, stats]) => {
      // Find top model
      let topModel = 'Unknown';
      let topCount = 0;
      for (const [model, count] of stats.modelCounts) {
        if (count > topCount) {
          topModel = model;
          topCount = count;
        }
      }

      // Extract project name from path
      const projectName = projectPath.split('/').pop() || projectPath;

      return {
        projectPath,
        projectName,
        sessionCount: stats.sessionCount,
        totalTokens: stats.totalTokens,
        cost: stats.cost,
        lastActivity: stats.lastActivity,
        topModel,
      };
    })
    .sort((a, b) => b.totalTokens - a.totalTokens); // Sort by total tokens
}

/**
 * Compute activity statistics from daily data
 */
export function computeActivityStats(daily: DailyStats[]): ActivityStats {
  // Group by month
  const monthlyMap = new Map<string, { sessions: number; tokens: number; cost: number }>();

  for (const day of daily) {
    const month = day.date.slice(0, 7); // YYYY-MM
    const existing = monthlyMap.get(month) || { sessions: 0, tokens: 0, cost: 0 };
    monthlyMap.set(month, {
      sessions: existing.sessions + day.sessionCount,
      tokens: existing.tokens + day.totalTokens,
      cost: existing.cost + day.cost,
    });
  }

  // Find peak month
  let peakMonth: ActivityStats['peakMonth'] = null;
  for (const [month, data] of monthlyMap) {
    if (!peakMonth || data.sessions > peakMonth.sessions) {
      const date = new Date(month + '-01');
      peakMonth = {
        name: date.toLocaleString('default', { month: 'long' }),
        monthIndex: date.getMonth(),
        ...data,
      };
    }
  }

  // Find peak day
  let peakDay: ActivityStats['peakDay'] = null;
  for (const day of daily) {
    if (!peakDay || day.sessionCount > peakDay.sessions) {
      const date = new Date(day.date);
      peakDay = {
        date: day.date,
        dayOfWeek: date.toLocaleString('default', { weekday: 'long' }),
        sessions: day.sessionCount,
      };
    }
  }

  // Compute monthly data array
  const monthlyData = Array.from(monthlyMap.entries())
    .map(([month, data]) => {
      const date = new Date(month + '-01');
      return {
        month,
        monthName: date.toLocaleString('default', { month: 'short' }),
        ...data,
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  // Compute longest streak
  const longestStreak = computeLongestStreak(daily);

  return {
    peakMonth,
    peakDay,
    monthlyData,
    longestStreak,
    totalDaysActive: daily.length,
  };
}

/**
 * Compute the longest consecutive coding streak
 */
export function computeLongestStreak(daily: DailyStats[]): number {
  if (daily.length === 0) return 0;

  const sortedDays = [...daily].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const prevDay = sortedDays[i - 1];
    const currDay = sortedDays[i];
    if (!prevDay || !currDay) continue;

    const prevDate = new Date(prevDay.date);
    const currDate = new Date(currDay.date);
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

/**
 * Badge definitions and computation
 */
const BADGE_DEFINITIONS = [
  {
    id: 'early-bird',
    name: 'Early Bird',
    emoji: '🌅',
    description: '20+ sessions before 8am',
    check: (sessions: SessionWithCost[], _summary: MetricsSummary, _daily: DailyStats[]) => {
      const earlyCount = sessions.filter((s) => new Date(s.startTime).getHours() < 8).length;
      return { earned: earlyCount >= 20, detail: `${earlyCount} sessions before 8am` };
    },
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    emoji: '🦉',
    description: '20+ sessions after 10pm',
    check: (sessions: SessionWithCost[], _summary: MetricsSummary, _daily: DailyStats[]) => {
      const lateCount = sessions.filter((s) => new Date(s.startTime).getHours() >= 22).length;
      return { earned: lateCount >= 20, detail: `${lateCount} sessions after 10pm` };
    },
  },
  {
    id: 'cache-master',
    name: 'Cache Master',
    emoji: '💎',
    description: '50%+ cache efficiency',
    check: (_sessions: SessionWithCost[], summary: MetricsSummary, _daily: DailyStats[]) => {
      return {
        earned: summary.cacheEfficiency >= 50,
        detail: `${Math.round(summary.cacheEfficiency)}% cache efficiency`,
      };
    },
  },
  {
    id: 'hot-streak',
    name: 'Hot Streak',
    emoji: '🔥',
    description: '10+ consecutive coding days',
    check: (_sessions: SessionWithCost[], _summary: MetricsSummary, daily: DailyStats[]) => {
      const streak = computeLongestStreak(daily);
      return { earned: streak >= 10, detail: `${streak}-day coding streak` };
    },
  },
  {
    id: 'million-club',
    name: 'Million Club',
    emoji: '🎰',
    description: '1M+ tokens generated',
    check: (_sessions: SessionWithCost[], summary: MetricsSummary, _daily: DailyStats[]) => {
      return {
        earned: summary.totalTokens >= 1_000_000,
        detail: `${formatNumber(summary.totalTokens)} tokens`,
      };
    },
  },
  {
    id: 'project-hopper',
    name: 'Project Hopper',
    emoji: '🐰',
    description: '10+ different projects',
    check: (sessions: SessionWithCost[], _summary: MetricsSummary, _daily: DailyStats[]) => {
      const projects = new Set(sessions.map((s) => s.projectPath));
      return { earned: projects.size >= 10, detail: `${projects.size} different projects` };
    },
  },
  {
    id: 'opus-lover',
    name: 'Opus Lover',
    emoji: '👑',
    description: '50+ Opus sessions',
    check: (sessions: SessionWithCost[], _summary: MetricsSummary, _daily: DailyStats[]) => {
      let opusCount = 0;
      for (const session of sessions) {
        if (session.messages.some((m) => m.model.toLowerCase().includes('opus'))) {
          opusCount++;
        }
      }
      return { earned: opusCount >= 50, detail: `${opusCount} Opus sessions` };
    },
  },
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    emoji: '⚔️',
    description: '30+ weekend sessions',
    check: (sessions: SessionWithCost[], _summary: MetricsSummary, _daily: DailyStats[]) => {
      const weekendCount = sessions.filter((s) => {
        const day = new Date(s.startTime).getDay();
        return day === 0 || day === 6;
      }).length;
      return { earned: weekendCount >= 30, detail: `${weekendCount} weekend sessions` };
    },
  },
  {
    id: 'centurion',
    name: 'Centurion',
    emoji: '💯',
    description: '100+ total sessions',
    check: (sessions: SessionWithCost[], _summary: MetricsSummary, _daily: DailyStats[]) => {
      return { earned: sessions.length >= 100, detail: `${sessions.length} total sessions` };
    },
  },
  {
    id: 'big-spender',
    name: 'Big Spender',
    emoji: '💸',
    description: '$50+ invested in AI',
    check: (_sessions: SessionWithCost[], summary: MetricsSummary, _daily: DailyStats[]) => {
      return { earned: summary.totalCost >= 50, detail: `$${summary.totalCost.toFixed(2)} invested` };
    },
  },
];

/**
 * Compute badges earned based on metrics
 */
export function computeBadges(
  sessions: SessionWithCost[],
  summary: MetricsSummary,
  daily: DailyStats[]
): Badge[] {
  return BADGE_DEFINITIONS.map((def) => {
    const result = def.check(sessions, summary, daily);
    return {
      id: def.id,
      name: def.name,
      emoji: def.emoji,
      description: def.description,
      detail: result.detail,
      earned: result.earned,
    };
  });
}

/**
 * Get model personality based on most used model
 */
export function getModelPersonality(topModel: string): ModelPersonality {
  const lowerModel = topModel.toLowerCase();

  if (lowerModel.includes('opus')) {
    return {
      title: 'The Perfectionist',
      description: 'You demand the best. Quality over everything!',
      emoji: '👑',
    };
  }
  if (lowerModel.includes('sonnet')) {
    return {
      title: 'The Balanced Genius',
      description: 'You appreciate quality AND speed. Smart choice!',
      emoji: '🎯',
    };
  }
  if (lowerModel.includes('haiku')) {
    return {
      title: 'The Speed Demon',
      description: 'Fast and efficient - you value your time!',
      emoji: '⚡',
    };
  }
  return {
    title: 'The Explorer',
    description: 'Always trying new things!',
    emoji: '🧭',
  };
}

/**
 * Format large numbers for display
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

/**
 * Get a fun comparison for token count
 */
export function getTokenComparison(totalTokens: number): string {
  const warAndPeace = 580_000;
  const harryPotterSeries = 1_084_000;
  const bible = 783_000;
  const tweets = 280;

  if (totalTokens >= 10_000_000) {
    const count = Math.round(totalTokens / warAndPeace);
    return `That's like reading War & Peace... ${count} times!`;
  } else if (totalTokens >= 5_000_000) {
    const count = Math.round(totalTokens / harryPotterSeries);
    return `Enough to read the entire Harry Potter series ${count}x!`;
  } else if (totalTokens >= 1_000_000) {
    const count = Math.round(totalTokens / bible);
    return `That's ${count}x the length of the Bible!`;
  } else if (totalTokens >= 100_000) {
    const count = Math.round(totalTokens / tweets);
    return `You could have written ${count.toLocaleString()} tweets!`;
  } else if (totalTokens >= 10_000) {
    return `That's a solid novel worth of content!`;
  } else {
    return `A great start to your AI journey!`;
  }
}

/**
 * Get a fun comparison for cost
 */
export function getCostComparison(totalCost: number): string {
  const coffees = totalCost / 5;
  const netflixMonths = totalCost / 15.49;
  const avocadoToasts = totalCost / 12;

  if (totalCost >= 500) {
    return `That's ${Math.round(coffees)} lattes - but way more productive!`;
  } else if (totalCost >= 100) {
    return `About ${Math.round(netflixMonths)} months of Netflix`;
  } else if (totalCost >= 20) {
    return `Or ${Math.round(avocadoToasts)} avocado toasts`;
  } else if (totalCost >= 5) {
    return `Less than a fancy dinner!`;
  } else {
    return `Pocket change for AI superpowers!`;
  }
}

/**
 * Compute fun facts from metrics
 */
export function computeFunFacts(
  sessions: SessionWithCost[],
  summary: MetricsSummary
): FunFact[] {
  const funFacts: FunFact[] = [];

  // Average session duration (estimated)
  const avgMessagesPerSession = summary.totalMessages / Math.max(summary.totalSessions, 1);
  funFacts.push({
    id: 'avg-messages',
    icon: '💬',
    title: 'Messages per Session',
    value: avgMessagesPerSession.toFixed(1),
    detail: `You exchanged ${summary.totalMessages.toLocaleString()} messages with Claude`,
  });

  // Messages per day
  const messagesPerDay = summary.totalMessages / Math.max(summary.daysActive, 1);
  funFacts.push({
    id: 'messages-per-day',
    icon: '📅',
    title: 'Daily Average',
    value: `${messagesPerDay.toFixed(1)} msgs`,
    detail: `That's ${messagesPerDay.toFixed(1)} messages per active day`,
  });

  // Most productive day of week
  const dayOfWeekCounts = new Map<number, number>();
  for (const session of sessions) {
    const day = new Date(session.startTime).getDay();
    dayOfWeekCounts.set(day, (dayOfWeekCounts.get(day) || 0) + 1);
  }
  let topDayOfWeek = 0;
  let topDayCount = 0;
  for (const [day, count] of dayOfWeekCounts) {
    if (count > topDayCount) {
      topDayOfWeek = day;
      topDayCount = count;
    }
  }
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const topDayName = dayNames[topDayOfWeek] ?? 'Unknown';
  funFacts.push({
    id: 'top-day',
    icon: '📊',
    title: 'Favorite Day',
    value: topDayName,
    detail: `${topDayCount} sessions on ${topDayName}s`,
  });

  // Longest session
  let longestSession = 0;
  for (const session of sessions) {
    if (session.messages.length > longestSession) {
      longestSession = session.messages.length;
    }
  }
  funFacts.push({
    id: 'longest-session',
    icon: '⏱️',
    title: 'Longest Session',
    value: `${longestSession} msgs`,
    detail: `Your marathon session had ${longestSession} messages`,
  });

  // Projects count
  const uniqueProjects = new Set(sessions.map((s) => s.projectPath));
  funFacts.push({
    id: 'projects',
    icon: '📁',
    title: 'Projects',
    value: uniqueProjects.size.toString(),
    detail: `You worked on ${uniqueProjects.size} different projects`,
  });

  // Cache savings estimate
  const cacheReadTokens = summary.totalCacheReadTokens;
  const estimatedSavings = (cacheReadTokens / 1_000_000) * 2.7; // Rough estimate
  if (estimatedSavings > 0.01) {
    funFacts.push({
      id: 'cache-savings',
      icon: '💰',
      title: 'Cache Savings',
      value: `~$${estimatedSavings.toFixed(2)}`,
      detail: `Estimated savings from prompt caching`,
    });
  }

  return funFacts;
}

/**
 * Compute share stats for social sharing
 */
export function computeShareStats(
  summary: MetricsSummary,
  activityStats: ActivityStats,
  badges: Badge[],
  byProject: { projectName: string }[]
): ShareStats {
  // Get short model name
  const topModelShort = summary.topModel
    .replace('claude-', '')
    .replace(/-\d{8}$/, '')
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');

  return {
    totalTokens: summary.totalTokens,
    totalTokensFormatted: formatNumber(summary.totalTokens),
    totalCost: summary.totalCost,
    totalSessions: summary.totalSessions,
    longestStreak: activityStats.longestStreak,
    topModel: summary.topModel,
    topModelShort,
    topProject: byProject[0]?.projectName ?? 'Various',
    cacheEfficiency: summary.cacheEfficiency,
    badgeCount: badges.filter((b) => b.earned).length,
  };
}

/**
 * Build complete Year in Review data from metrics
 */
export function buildYearReviewData(metricsData: MetricsData): YearReviewData {
  // Filter to 2025 data
  const filtered = filter2025Data(metricsData);

  // Compute activity stats
  const activityStats = computeActivityStats(filtered.daily);

  // Compute badges
  const badges = computeBadges(filtered.sessions, filtered.summary, filtered.daily);

  // Get model personality
  const modelPersonality = getModelPersonality(filtered.summary.topModel);

  // Compute fun facts
  const funFacts = computeFunFacts(filtered.sessions, filtered.summary);

  // Compute share stats
  const shareStats = computeShareStats(filtered.summary, activityStats, badges, filtered.byProject);

  // Get comparisons
  const tokenComparison = getTokenComparison(filtered.summary.totalTokens);
  const costComparison = getCostComparison(filtered.summary.totalCost);

  return {
    metrics: filtered,
    summary: filtered.summary,
    daily: filtered.daily,
    byModel: filtered.byModel,
    byProject: filtered.byProject,
    badges,
    activityStats,
    shareStats,
    funFacts,
    tokenComparison,
    costComparison,
    modelPersonality,
  };
}
