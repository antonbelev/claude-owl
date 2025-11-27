import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetricsService } from '@/main/services/MetricsService';
import * as fs from 'fs';
import * as os from 'os';

// Mock the fs module
vi.mock('fs');
vi.mock('os');

describe('MetricsService', () => {
  let metricsService: MetricsService;

  beforeEach(() => {
    vi.clearAllMocks();
    metricsService = new MetricsService();

    // Mock homedir
    vi.mocked(os.homedir).mockReturnValue('/home/test');
  });

  describe('computeMetricsFromJSONL', () => {
    it('should return empty metrics when no JSONL files found', async () => {
      // Mock: no projects directory
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await metricsService.computeMetricsFromJSONL();

      expect(result.sessions).toEqual([]);
      expect(result.daily).toEqual([]);
      expect(result.byModel).toEqual([]);
      expect(result.byProject).toEqual([]);
      expect(result.summary.totalSessions).toBe(0);
      expect(result.summary.totalCost).toBe(0);
    });

    it('should parse JSONL files and compute metrics correctly', async () => {
      // Mock: projects directory exists
      vi.mocked(fs.existsSync).mockReturnValue(true);

      // Mock: directory structure
      vi.mocked(fs.readdirSync).mockImplementation((dirPath: string | Buffer) => {
        const pathStr = dirPath.toString();
        if (pathStr.endsWith('projects')) {
          return ['project1'] as unknown as fs.Dirent[];
        }
        if (pathStr.includes('project1')) {
          return ['session.jsonl'] as unknown as fs.Dirent[];
        }
        return [] as unknown as fs.Dirent[];
      });

      vi.mocked(fs.statSync).mockImplementation((filePath: string | Buffer) => {
        const pathStr = filePath.toString();
        return {
          isDirectory: () => !pathStr.endsWith('.jsonl'),
        } as fs.Stats;
      });

      // Mock: JSONL content with assistant messages
      const jsonlContent = `
{"type":"assistant","sessionId":"session1","cwd":"/home/test/project1","version":"1.0.0","gitBranch":"main","timestamp":"2025-01-01T10:00:00.000Z","message":{"model":"claude-sonnet-4-5-20250929","usage":{"input_tokens":1000,"output_tokens":500,"cache_creation_input_tokens":100,"cache_read_input_tokens":50}}}
{"type":"assistant","sessionId":"session1","cwd":"/home/test/project1","timestamp":"2025-01-01T10:05:00.000Z","message":{"model":"claude-sonnet-4-5-20250929","usage":{"input_tokens":2000,"output_tokens":1000,"cache_creation_input_tokens":200,"cache_read_input_tokens":100}}}
`.trim();

      vi.mocked(fs.readFileSync).mockReturnValue(jsonlContent);

      const result = await metricsService.computeMetricsFromJSONL();

      // Verify sessions
      expect(result.sessions.length).toBe(1);
      expect(result.sessions[0].sessionId).toBe('session1');
      expect(result.sessions[0].messages.length).toBe(2);

      // Verify summary
      expect(result.summary.totalSessions).toBe(1);
      expect(result.summary.totalMessages).toBe(2);
      expect(result.summary.totalInputTokens).toBe(3000);
      expect(result.summary.totalOutputTokens).toBe(1500);
      expect(result.summary.topModel).toBe('claude-sonnet-4-5-20250929');

      // Verify cost calculation (should be > 0)
      expect(result.summary.totalCost).toBeGreaterThan(0);
    });

    it('should handle multiple sessions across different projects', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      vi.mocked(fs.readdirSync).mockImplementation((dirPath: string | Buffer) => {
        const pathStr = dirPath.toString();
        if (pathStr.endsWith('projects')) {
          return ['project1', 'project2'] as unknown as fs.Dirent[];
        }
        return ['session.jsonl'] as unknown as fs.Dirent[];
      });

      vi.mocked(fs.statSync).mockImplementation((filePath: string | Buffer) => {
        const pathStr = filePath.toString();
        return {
          isDirectory: () => !pathStr.endsWith('.jsonl'),
        } as fs.Stats;
      });

      const jsonlContent = `
{"type":"assistant","sessionId":"session1","cwd":"/home/test/project1","timestamp":"2025-01-01T10:00:00.000Z","message":{"model":"claude-sonnet-4-5-20250929","usage":{"input_tokens":1000,"output_tokens":500,"cache_creation_input_tokens":0,"cache_read_input_tokens":0}}}
{"type":"assistant","sessionId":"session2","cwd":"/home/test/project2","timestamp":"2025-01-02T10:00:00.000Z","message":{"model":"claude-opus-4-20250514","usage":{"input_tokens":2000,"output_tokens":1000,"cache_creation_input_tokens":0,"cache_read_input_tokens":0}}}
`.trim();

      vi.mocked(fs.readFileSync).mockReturnValue(jsonlContent);

      const result = await metricsService.computeMetricsFromJSONL();

      expect(result.sessions.length).toBe(2);
      expect(result.byProject.length).toBe(2);
      expect(result.byModel.length).toBe(2);
    });

    it('should skip malformed JSON lines', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      vi.mocked(fs.readdirSync).mockImplementation((dirPath: string | Buffer) => {
        const pathStr = dirPath.toString();
        if (pathStr.endsWith('projects')) {
          return ['project1'] as unknown as fs.Dirent[];
        }
        return ['session.jsonl'] as unknown as fs.Dirent[];
      });

      vi.mocked(fs.statSync).mockImplementation((filePath: string | Buffer) => {
        const pathStr = filePath.toString();
        return {
          isDirectory: () => !pathStr.endsWith('.jsonl'),
        } as fs.Stats;
      });

      const jsonlContent = `
{"type":"assistant","sessionId":"session1","cwd":"/home/test/project1","timestamp":"2025-01-01T10:00:00.000Z","message":{"model":"claude-sonnet-4-5-20250929","usage":{"input_tokens":1000,"output_tokens":500,"cache_creation_input_tokens":0,"cache_read_input_tokens":0}}}
{INVALID JSON}
{"type":"assistant","sessionId":"session1","timestamp":"2025-01-01T10:05:00.000Z","message":{"model":"claude-sonnet-4-5-20250929","usage":{"input_tokens":2000,"output_tokens":1000,"cache_creation_input_tokens":0,"cache_read_input_tokens":0}}}
`.trim();

      vi.mocked(fs.readFileSync).mockReturnValue(jsonlContent);

      const result = await metricsService.computeMetricsFromJSONL();

      // Should parse valid lines and skip invalid ones
      expect(result.sessions.length).toBe(1);
      expect(result.sessions[0].messages.length).toBe(2);
    });

    it('should filter sessions by days', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      vi.mocked(fs.readdirSync).mockImplementation((dirPath: string | Buffer) => {
        const pathStr = dirPath.toString();
        if (pathStr.endsWith('projects')) {
          return ['project1'] as unknown as fs.Dirent[];
        }
        return ['session.jsonl'] as unknown as fs.Dirent[];
      });

      vi.mocked(fs.statSync).mockImplementation((filePath: string | Buffer) => {
        const pathStr = filePath.toString();
        return {
          isDirectory: () => !pathStr.endsWith('.jsonl'),
        } as fs.Stats;
      });

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5);

      const jsonlContent = `
{"type":"assistant","sessionId":"session1","cwd":"/home/test/project1","timestamp":"${oldDate.toISOString()}","message":{"model":"claude-sonnet-4-5-20250929","usage":{"input_tokens":1000,"output_tokens":500,"cache_creation_input_tokens":0,"cache_read_input_tokens":0}}}
{"type":"assistant","sessionId":"session2","cwd":"/home/test/project1","timestamp":"${recentDate.toISOString()}","message":{"model":"claude-sonnet-4-5-20250929","usage":{"input_tokens":2000,"output_tokens":1000,"cache_creation_input_tokens":0,"cache_read_input_tokens":0}}}
`.trim();

      vi.mocked(fs.readFileSync).mockReturnValue(jsonlContent);

      // Filter for last 30 days
      const result = await metricsService.computeMetricsFromJSONL({ days: 30 });

      // Should only include session2 (recent)
      expect(result.sessions.length).toBe(1);
      expect(result.sessions[0].sessionId).toBe('session2');
    });

    it('should calculate cache efficiency correctly', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      vi.mocked(fs.readdirSync).mockImplementation((dirPath: string | Buffer) => {
        const pathStr = dirPath.toString();
        if (pathStr.endsWith('projects')) {
          return ['project1'] as unknown as fs.Dirent[];
        }
        return ['session.jsonl'] as unknown as fs.Dirent[];
      });

      vi.mocked(fs.statSync).mockImplementation((filePath: string | Buffer) => {
        const pathStr = filePath.toString();
        return {
          isDirectory: () => !pathStr.endsWith('.jsonl'),
        } as fs.Stats;
      });

      const jsonlContent = `
{"type":"assistant","sessionId":"session1","cwd":"/home/test/project1","timestamp":"2025-01-01T10:00:00.000Z","message":{"model":"claude-sonnet-4-5-20250929","usage":{"input_tokens":1000,"output_tokens":500,"cache_creation_input_tokens":1000,"cache_read_input_tokens":3000}}}
`.trim();

      vi.mocked(fs.readFileSync).mockReturnValue(jsonlContent);

      const result = await metricsService.computeMetricsFromJSONL();

      // Cache efficiency = (cache reads / total cache tokens) * 100
      // = (3000 / (1000 + 3000)) * 100 = 75%
      expect(result.summary.cacheEfficiency).toBeCloseTo(75, 1);
    });
  });
});
