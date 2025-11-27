/**
 * Shared types for the Metrics system
 * Phase 0: MVP implementation with on-demand JSONL parsing
 */

export interface Message {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  timestamp: Date;
}

export interface Session {
  sessionId: string;
  projectPath: string;
  gitBranch?: string;
  claudeVersion?: string;
  startTime: Date;
  endTime?: Date;
  messages: Message[];
}

export interface SessionWithCost extends Session {
  cost: number;
  totalTokens: number;
  cacheEfficiency: number; // Percentage of cache reads vs total cache tokens
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  cost: number;
  sessionCount: number;
}

export interface ModelStats {
  model: string;
  messageCount: number;
  sessionCount: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  cost: number;
  percentage: number; // Percentage of total cost
}

export interface ProjectStats {
  projectPath: string;
  projectName: string;
  sessionCount: number;
  totalTokens: number;
  cost: number;
  lastActivity: Date;
  topModel: string;
}

export interface MetricsSummary {
  totalSessions: number;
  totalMessages: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreationTokens: number;
  totalCacheReadTokens: number;
  totalTokens: number;
  totalCost: number;
  daysActive: number;
  topModel: string;
  averageCostPerSession: number;
  cacheEfficiency: number; // Overall cache hit rate
  dateRange: {
    start: string;
    end: string;
  };
}

export interface MetricsData {
  sessions: SessionWithCost[];
  daily: DailyStats[];
  byModel: ModelStats[];
  byProject: ProjectStats[];
  summary: MetricsSummary;
}

export interface MetricsFilter {
  days?: 7 | 30 | 90 | 365; // Time range filter
  projectPath?: string; // Filter by specific project
  model?: string; // Filter by specific model
}
