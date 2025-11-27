import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type {
  MetricsData,
  Session,
  SessionWithCost,
  DailyStats,
  ModelStats,
  ProjectStats,
  MetricsSummary,
  Message,
  MetricsFilter,
} from '@/shared/types/metrics.types';
import { PricingService } from './PricingService';

interface JSONLEntry {
  type: string;
  sessionId?: string;
  cwd?: string;
  version?: string;
  gitBranch?: string;
  message?: {
    model?: string;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
  timestamp?: string;
}

/**
 * MetricsService - Parse JSONL files and compute usage metrics
 * Phase 0: On-demand parsing (no database persistence)
 */
export class MetricsService {
  private pricingService: PricingService;

  constructor() {
    this.pricingService = new PricingService();
  }

  /**
   * Get the Claude projects directory path
   */
  private getClaudeProjectsDir(): string {
    const homeDir = os.homedir();
    return path.join(homeDir, '.claude', 'projects');
  }

  /**
   * Find all JSONL files in the Claude projects directory
   */
  private async findAllJSONLFiles(): Promise<string[]> {
    const projectsDir = this.getClaudeProjectsDir();

    try {
      if (!fs.existsSync(projectsDir)) {
        console.log(`[MetricsService] Projects directory not found: ${projectsDir}`);
        return [];
      }

      const subdirs = fs.readdirSync(projectsDir);
      const jsonlFiles: string[] = [];

      for (const subdir of subdirs) {
        const subdirPath = path.join(projectsDir, subdir);
        const stat = fs.statSync(subdirPath);

        if (stat.isDirectory()) {
          const files = fs.readdirSync(subdirPath);
          for (const file of files) {
            if (file.endsWith('.jsonl')) {
              jsonlFiles.push(path.join(subdirPath, file));
            }
          }
        }
      }

      console.log(`[MetricsService] Found ${jsonlFiles.length} JSONL files`);
      return jsonlFiles;
    } catch (error) {
      console.error('[MetricsService] Error finding JSONL files:', error);
      return [];
    }
  }

  /**
   * Parse all JSONL files and extract sessions
   */
  private async parseAllSessions(files: string[]): Promise<Session[]> {
    const sessions = new Map<string, Session>();

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const entry: JSONLEntry = JSON.parse(line);

            // We're interested in assistant messages with usage data
            if (entry.type === 'assistant' && entry.message?.usage && entry.sessionId) {
              const sessionId = entry.sessionId;

              // Create session if it doesn't exist
              if (!sessions.has(sessionId)) {
                const session: Session = {
                  sessionId,
                  projectPath: entry.cwd || 'unknown',
                  startTime: new Date(entry.timestamp || Date.now()),
                  messages: [],
                };
                if (entry.gitBranch) session.gitBranch = entry.gitBranch;
                if (entry.version) session.claudeVersion = entry.version;
                sessions.set(sessionId, session);
              }

              const session = sessions.get(sessionId)!;

              // Add message to session
              const message: Message = {
                model: entry.message.model || 'unknown',
                inputTokens: entry.message.usage.input_tokens || 0,
                outputTokens: entry.message.usage.output_tokens || 0,
                cacheCreationTokens: entry.message.usage.cache_creation_input_tokens || 0,
                cacheReadTokens: entry.message.usage.cache_read_input_tokens || 0,
                timestamp: new Date(entry.timestamp || Date.now()),
              };

              session.messages.push(message);

              // Update session end time
              if (!session.endTime || message.timestamp > session.endTime) {
                session.endTime = message.timestamp;
              }
            }
          } catch (parseError) {
            // Skip malformed lines
            continue;
          }
        }
      } catch (fileError) {
        console.error(`[MetricsService] Error reading file ${file}:`, fileError);
        continue;
      }
    }

    return Array.from(sessions.values());
  }

  /**
   * Calculate session-level metrics (cost, total tokens, cache efficiency)
   */
  private enrichSessionsWithMetrics(sessions: Session[]): SessionWithCost[] {
    return sessions.map(session => {
      let totalCost = 0;
      let totalTokens = 0;
      let totalCacheCreationTokens = 0;
      let totalCacheReadTokens = 0;

      for (const message of session.messages) {
        totalCost += this.pricingService.calculateMessageCost(message);
        totalTokens +=
          message.inputTokens +
          message.outputTokens +
          message.cacheCreationTokens +
          message.cacheReadTokens;
        totalCacheCreationTokens += message.cacheCreationTokens;
        totalCacheReadTokens += message.cacheReadTokens;
      }

      // Calculate cache efficiency (percentage of cache reads vs total cache tokens)
      const totalCacheTokens = totalCacheCreationTokens + totalCacheReadTokens;
      const cacheEfficiency =
        totalCacheTokens > 0 ? (totalCacheReadTokens / totalCacheTokens) * 100 : 0;

      return {
        ...session,
        cost: totalCost,
        totalTokens,
        cacheEfficiency,
      };
    });
  }

  /**
   * Aggregate metrics by day
   */
  private aggregateByDay(sessions: SessionWithCost[]): DailyStats[] {
    const dailyMap = new Map<string, DailyStats>();

    for (const session of sessions) {
      for (const message of session.messages) {
        const date = message.timestamp.toISOString().split('T')[0] || '';

        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            date,
            inputTokens: 0,
            outputTokens: 0,
            cacheCreationTokens: 0,
            cacheReadTokens: 0,
            totalTokens: 0,
            cost: 0,
            sessionCount: 0,
          });
        }

        const daily = dailyMap.get(date)!;
        daily.inputTokens += message.inputTokens;
        daily.outputTokens += message.outputTokens;
        daily.cacheCreationTokens += message.cacheCreationTokens;
        daily.cacheReadTokens += message.cacheReadTokens;
        daily.totalTokens +=
          message.inputTokens +
          message.outputTokens +
          message.cacheCreationTokens +
          message.cacheReadTokens;
        daily.cost += this.pricingService.calculateMessageCost(message);
      }
    }

    // Count unique sessions per day
    for (const session of sessions) {
      const date = session.startTime.toISOString().split('T')[0] || '';
      if (dailyMap.has(date)) {
        const dailyEntry = dailyMap.get(date);
        if (dailyEntry) {
          dailyEntry.sessionCount++;
        }
      }
    }

    return Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  /**
   * Aggregate metrics by model
   */
  private aggregateByModel(sessions: SessionWithCost[]): ModelStats[] {
    const modelMap = new Map<string, ModelStats>();
    const sessionsByModel = new Map<string, Set<string>>();

    for (const session of sessions) {
      for (const message of session.messages) {
        if (!modelMap.has(message.model)) {
          modelMap.set(message.model, {
            model: message.model,
            messageCount: 0,
            sessionCount: 0,
            inputTokens: 0,
            outputTokens: 0,
            cacheCreationTokens: 0,
            cacheReadTokens: 0,
            totalTokens: 0,
            cost: 0,
            percentage: 0,
          });
          sessionsByModel.set(message.model, new Set());
        }

        const model = modelMap.get(message.model)!;
        model.messageCount++;
        model.inputTokens += message.inputTokens;
        model.outputTokens += message.outputTokens;
        model.cacheCreationTokens += message.cacheCreationTokens;
        model.cacheReadTokens += message.cacheReadTokens;
        model.totalTokens +=
          message.inputTokens +
          message.outputTokens +
          message.cacheCreationTokens +
          message.cacheReadTokens;
        model.cost += this.pricingService.calculateMessageCost(message);

        // Track unique sessions per model
        sessionsByModel.get(message.model)!.add(session.sessionId);
      }
    }

    // Update session counts
    for (const [modelName, sessions] of sessionsByModel.entries()) {
      const model = modelMap.get(modelName);
      if (model) {
        model.sessionCount = sessions.size;
      }
    }

    // Calculate percentages
    const totalCost = Array.from(modelMap.values()).reduce((sum, m) => sum + m.cost, 0);
    const modelsWithPercentage: ModelStats[] = Array.from(modelMap.values()).map(model => ({
      ...model,
      percentage: totalCost > 0 ? (model.cost / totalCost) * 100 : 0,
    }));

    return modelsWithPercentage.sort((a, b) => b.cost - a.cost);
  }

  /**
   * Aggregate metrics by project
   */
  private aggregateByProject(sessions: SessionWithCost[]): ProjectStats[] {
    const projectMap = new Map<string, ProjectStats>();

    for (const session of sessions) {
      if (!projectMap.has(session.projectPath)) {
        // Extract project name from path (last segment)
        const projectName = session.projectPath.split('/').pop() || 'unknown';

        projectMap.set(session.projectPath, {
          projectPath: session.projectPath,
          projectName,
          sessionCount: 0,
          totalTokens: 0,
          cost: 0,
          lastActivity: session.startTime,
          topModel: 'unknown',
        });
      }

      const project = projectMap.get(session.projectPath)!;
      project.sessionCount++;
      project.totalTokens += session.totalTokens;
      project.cost += session.cost;

      if (session.endTime && session.endTime > project.lastActivity) {
        project.lastActivity = session.endTime;
      }
    }

    // Determine top model for each project
    for (const [projectPath, project] of projectMap.entries()) {
      const projectSessions = sessions.filter(s => s.projectPath === projectPath);
      const modelCounts = new Map<string, number>();

      for (const session of projectSessions) {
        for (const message of session.messages) {
          modelCounts.set(message.model, (modelCounts.get(message.model) || 0) + 1);
        }
      }

      const topModel = Array.from(modelCounts.entries()).sort((a, b) => b[1] - a[1])[0];
      if (topModel) {
        project.topModel = topModel[0];
      }
    }

    return Array.from(projectMap.values()).sort((a, b) => b.cost - a.cost);
  }

  /**
   * Compute overall summary metrics
   */
  private computeSummary(
    sessions: SessionWithCost[],
    daily: DailyStats[],
    byModel: ModelStats[]
  ): MetricsSummary {
    const totalSessions = sessions.length;
    const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0);

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheCreationTokens = 0;
    let totalCacheReadTokens = 0;
    let totalCost = 0;

    for (const session of sessions) {
      totalCost += session.cost;
      for (const message of session.messages) {
        totalInputTokens += message.inputTokens;
        totalOutputTokens += message.outputTokens;
        totalCacheCreationTokens += message.cacheCreationTokens;
        totalCacheReadTokens += message.cacheReadTokens;
      }
    }

    const totalTokens =
      totalInputTokens + totalOutputTokens + totalCacheCreationTokens + totalCacheReadTokens;

    const totalCacheTokens = totalCacheCreationTokens + totalCacheReadTokens;
    const cacheEfficiency =
      totalCacheTokens > 0 ? (totalCacheReadTokens / totalCacheTokens) * 100 : 0;

    const today = new Date().toISOString().split('T')[0] || '';
    const firstDaily = daily[0];
    const lastDaily = daily[daily.length - 1];
    const dateRange = {
      start: firstDaily?.date || today,
      end: lastDaily?.date || today,
    };

    const firstModel = byModel[0];

    return {
      totalSessions,
      totalMessages,
      totalInputTokens,
      totalOutputTokens,
      totalCacheCreationTokens,
      totalCacheReadTokens,
      totalTokens,
      totalCost,
      daysActive: daily.length,
      topModel: firstModel?.model || 'unknown',
      averageCostPerSession: totalSessions > 0 ? totalCost / totalSessions : 0,
      cacheEfficiency,
      dateRange,
    };
  }

  /**
   * Apply filters to sessions
   */
  private applyFilters(sessions: SessionWithCost[], filter: MetricsFilter): SessionWithCost[] {
    let filtered = [...sessions];

    // Filter by days
    if (filter.days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filter.days);
      filtered = filtered.filter(s => s.startTime >= cutoffDate);
    }

    // Filter by project
    if (filter.projectPath) {
      filtered = filtered.filter(s => s.projectPath === filter.projectPath);
    }

    // Filter by model (sessions that used this model)
    if (filter.model) {
      filtered = filtered.filter(s => s.messages.some(m => m.model === filter.model));
    }

    return filtered;
  }

  /**
   * Main entry point: Compute all metrics from JSONL files
   */
  async computeMetricsFromJSONL(filter: MetricsFilter = {}): Promise<MetricsData> {
    console.log('[MetricsService] Starting metrics computation...');
    const startTime = Date.now();

    // Step 1: Find all JSONL files
    const jsonlFiles = await this.findAllJSONLFiles();

    if (jsonlFiles.length === 0) {
      console.log('[MetricsService] No JSONL files found, returning empty metrics');
      const today = new Date().toISOString().split('T')[0] || '';
      return {
        sessions: [],
        daily: [],
        byModel: [],
        byProject: [],
        summary: {
          totalSessions: 0,
          totalMessages: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCacheCreationTokens: 0,
          totalCacheReadTokens: 0,
          totalTokens: 0,
          totalCost: 0,
          daysActive: 0,
          topModel: 'unknown',
          averageCostPerSession: 0,
          cacheEfficiency: 0,
          dateRange: {
            start: today,
            end: today,
          },
        },
      };
    }

    // Step 2: Parse all sessions
    const sessions = await this.parseAllSessions(jsonlFiles);
    console.log(`[MetricsService] Parsed ${sessions.length} sessions`);

    // Step 3: Enrich with costs and metrics
    const enrichedSessions = this.enrichSessionsWithMetrics(sessions);

    // Step 4: Apply filters
    const filteredSessions = this.applyFilters(enrichedSessions, filter);
    console.log(`[MetricsService] After filters: ${filteredSessions.length} sessions`);

    // Step 5: Compute aggregates
    const daily = this.aggregateByDay(filteredSessions);
    const byModel = this.aggregateByModel(filteredSessions);
    const byProject = this.aggregateByProject(filteredSessions);
    const summary = this.computeSummary(filteredSessions, daily, byModel);

    const elapsedTime = Date.now() - startTime;
    console.log(`[MetricsService] Metrics computation completed in ${elapsedTime}ms`);

    return {
      sessions: filteredSessions,
      daily,
      byModel,
      byProject,
      summary,
    };
  }
}
