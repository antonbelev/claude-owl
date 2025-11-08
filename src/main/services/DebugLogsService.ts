import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import type { DebugLog } from '../../shared/types/ipc.types';

export class DebugLogsService {
  private debugLogsDir: string;

  constructor() {
    this.debugLogsDir = path.join(os.homedir(), '.claude', 'debug');
    console.log('[DebugLogsService] Initialized with debug directory:', this.debugLogsDir);
  }

  /**
   * List all debug logs ordered by timestamp (newest first)
   */
  async listDebugLogs(): Promise<DebugLog[]> {
    console.log('[DebugLogsService] Listing debug logs from:', this.debugLogsDir);

    try {
      const files = await fs.readdir(this.debugLogsDir, { withFileTypes: true });
      const logs: DebugLog[] = [];

      for (const file of files) {
        // Only process .txt files
        if (!file.isFile() || !file.name.endsWith('.txt')) {
          continue;
        }

        try {
          const fullPath = path.join(this.debugLogsDir, file.name);
          const stats = await fs.stat(fullPath);

          logs.push({
            id: file.name.replace('.txt', ''),
            filename: file.name,
            path: fullPath,
            size: stats.size,
            timestamp: stats.mtimeMs,
          });
        } catch (error) {
          console.warn('[DebugLogsService] Failed to get stats for file:', file.name, error);
        }
      }

      // Sort by timestamp (newest first)
      logs.sort((a, b) => b.timestamp - a.timestamp);

      console.log('[DebugLogsService] Found', logs.length, 'debug logs');
      return logs;
    } catch (error) {
      console.error('[DebugLogsService] Failed to list debug logs:', error);
      throw error;
    }
  }

  /**
   * Get a single debug log with its content
   */
  async getDebugLog(filename: string): Promise<DebugLog> {
    console.log('[DebugLogsService] Getting debug log:', filename);

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new Error('Invalid filename');
    }

    try {
      const fullPath = path.join(this.debugLogsDir, filename);
      const stats = await fs.stat(fullPath);
      const content = await fs.readFile(fullPath, 'utf-8');

      const log: DebugLog = {
        id: filename.replace('.txt', ''),
        filename,
        path: fullPath,
        size: stats.size,
        timestamp: stats.mtimeMs,
        content,
      };

      console.log('[DebugLogsService] Successfully loaded log:', filename);
      return log;
    } catch (error) {
      console.error('[DebugLogsService] Failed to get debug log:', filename, error);
      throw error;
    }
  }

  /**
   * Delete a debug log
   */
  async deleteDebugLog(filename: string): Promise<void> {
    console.log('[DebugLogsService] Deleting debug log:', filename);

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new Error('Invalid filename');
    }

    try {
      const fullPath = path.join(this.debugLogsDir, filename);
      await fs.unlink(fullPath);
      console.log('[DebugLogsService] Successfully deleted log:', filename);
    } catch (error) {
      console.error('[DebugLogsService] Failed to delete debug log:', filename, error);
      throw error;
    }
  }

  /**
   * Search debug logs by content
   */
  async searchDebugLogs(query: string): Promise<DebugLog[]> {
    console.log('[DebugLogsService] Searching debug logs with query:', query);

    try {
      const allLogs = await this.listDebugLogs();
      const results: DebugLog[] = [];
      const queryLower = query.toLowerCase();

      for (const log of allLogs) {
        try {
          const content = await fs.readFile(log.path, 'utf-8');
          if (content.toLowerCase().includes(queryLower)) {
            results.push({
              ...log,
              content, // Include content in search results for preview
            });
          }
        } catch (error) {
          console.warn('[DebugLogsService] Failed to search log:', log.filename, error);
        }
      }

      console.log('[DebugLogsService] Search found', results.length, 'matching logs');
      return results;
    } catch (error) {
      console.error('[DebugLogsService] Search failed:', error);
      throw error;
    }
  }

  /**
   * Get debug logs directory path
   */
  getDebugLogsDir(): string {
    return this.debugLogsDir;
  }

  /**
   * Check if debug logs directory exists
   */
  async debugLogsDirExists(): Promise<boolean> {
    try {
      const stats = await fs.stat(this.debugLogsDir);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const debugLogsService = new DebugLogsService();
