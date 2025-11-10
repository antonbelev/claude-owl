/**
 * FileSystemService
 * Centralized service for all file system operations
 *
 * Handles reading, writing, and managing files with proper error handling,
 * logging, and type safety. All file operations in the application should
 * go through this service.
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

/**
 * Parsed markdown with frontmatter
 */
export interface ParsedMarkdown<T = Record<string, unknown>> {
  frontmatter: T;
  content: string;
  raw: string;
}

/**
 * File statistics
 */
export interface FileStats {
  exists: boolean;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  mtime: Date;
}

export class FileSystemService {
  /**
   * Read and parse JSON file
   * @throws Error if file doesn't exist or JSON is invalid
   */
  async readJSON<T = unknown>(filePath: string): Promise<T> {
    console.log('[FileSystemService] Reading JSON:', filePath);
    try {
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      console.log('[FileSystemService] JSON read successfully:', filePath);
      return data as T;
    } catch (error) {
      console.error('[FileSystemService] Failed to read JSON:', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Write data as JSON to file
   * @throws Error if write fails
   */
  async writeJSON<T = unknown>(filePath: string, data: T, options?: { pretty?: boolean }): Promise<void> {
    console.log('[FileSystemService] Writing JSON:', filePath);
    try {
      const content = options?.pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
      await this.ensureDirectory(path.dirname(filePath));
      await writeFile(filePath, content, 'utf-8');
      console.log('[FileSystemService] JSON written successfully:', filePath);
    } catch (error) {
      console.error('[FileSystemService] Failed to write JSON:', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Read file as plain text
   * @throws Error if file doesn't exist
   */
  async readText(filePath: string): Promise<string> {
    console.log('[FileSystemService] Reading text file:', filePath);
    try {
      const content = await readFile(filePath, 'utf-8');
      console.log('[FileSystemService] Text file read successfully:', filePath);
      return content;
    } catch (error) {
      console.error('[FileSystemService] Failed to read text file:', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Write plain text to file
   * @throws Error if write fails
   */
  async writeText(filePath: string, content: string): Promise<void> {
    console.log('[FileSystemService] Writing text file:', filePath);
    try {
      await this.ensureDirectory(path.dirname(filePath));
      await writeFile(filePath, content, 'utf-8');
      console.log('[FileSystemService] Text file written successfully:', filePath);
    } catch (error) {
      console.error('[FileSystemService] Failed to write text file:', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Read markdown file with YAML frontmatter
   * Expects format: ---\nYAML\n---\nContent
   * @throws Error if file doesn't exist or format is invalid
   */
  async readMarkdownWithFrontmatter<T = Record<string, unknown>>(filePath: string): Promise<ParsedMarkdown<T>> {
    console.log('[FileSystemService] Reading markdown with frontmatter:', filePath);
    try {
      const raw = await readFile(filePath, 'utf-8');

      // Parse frontmatter
      const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!frontmatterMatch || !frontmatterMatch[1] || frontmatterMatch[2] === undefined) {
        throw new Error('Invalid markdown format: missing frontmatter delimiters (---)');
      }

      const frontmatterStr = frontmatterMatch[1];
      const content = frontmatterMatch[2];

      // Parse YAML frontmatter (simple key: value parser)
      const frontmatter = this.parseYAML<T>(frontmatterStr);

      console.log('[FileSystemService] Markdown with frontmatter read successfully:', filePath);
      return { frontmatter, content, raw };
    } catch (error) {
      console.error('[FileSystemService] Failed to read markdown:', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Write markdown file with YAML frontmatter
   * @throws Error if write fails
   */
  async writeMarkdownWithFrontmatter<T extends Record<string, unknown> = Record<string, unknown>>(
    filePath: string,
    frontmatter: T,
    content: string
  ): Promise<void> {
    console.log('[FileSystemService] Writing markdown with frontmatter:', filePath);
    try {
      const frontmatterStr = this.stringifyYAML(frontmatter as Record<string, unknown>);
      const markdown = `---\n${frontmatterStr}\n---\n${content}`;

      await this.ensureDirectory(path.dirname(filePath));
      await writeFile(filePath, markdown, 'utf-8');
      console.log('[FileSystemService] Markdown with frontmatter written successfully:', filePath);
    } catch (error) {
      console.error('[FileSystemService] Failed to write markdown:', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await stat(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file statistics
   * @throws Error if file doesn't exist
   */
  async getStats(filePath: string): Promise<FileStats> {
    console.log('[FileSystemService] Getting file stats:', filePath);
    try {
      const stats = await stat(filePath);
      return {
        exists: true,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        size: stats.size,
        mtime: stats.mtime,
      };
    } catch (error) {
      console.error('[FileSystemService] Failed to get file stats:', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Ensure directory exists, create if needed
   */
  async ensureDirectory(dirPath: string): Promise<void> {
    try {
      const exists = await this.fileExists(dirPath);
      if (!exists) {
        console.log('[FileSystemService] Creating directory:', dirPath);
        await mkdir(dirPath, { recursive: true });
      }
    } catch (error) {
      console.error('[FileSystemService] Failed to ensure directory:', {
        dirPath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * List files in directory
   * @throws Error if directory doesn't exist
   */
  async listDirectory(dirPath: string): Promise<string[]> {
    console.log('[FileSystemService] Listing directory:', dirPath);
    try {
      const files = await readdir(dirPath);
      console.log('[FileSystemService] Directory listed successfully:', dirPath, `(${files.length} items)`);
      return files;
    } catch (error) {
      console.error('[FileSystemService] Failed to list directory:', {
        dirPath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete file
   * @throws Error if file doesn't exist or delete fails
   */
  async deleteFile(filePath: string): Promise<void> {
    console.log('[FileSystemService] Deleting file:', filePath);
    try {
      await unlink(filePath);
      console.log('[FileSystemService] File deleted successfully:', filePath);
    } catch (error) {
      console.error('[FileSystemService] Failed to delete file:', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete directory (non-recursive)
   * @throws Error if directory doesn't exist or is not empty
   */
  async deleteDirectory(dirPath: string): Promise<void> {
    console.log('[FileSystemService] Deleting directory:', dirPath);
    try {
      await rmdir(dirPath);
      console.log('[FileSystemService] Directory deleted successfully:', dirPath);
    } catch (error) {
      console.error('[FileSystemService] Failed to delete directory:', {
        dirPath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Parse simple YAML (key: value format)
   * For complex YAML, consider using yaml library
   */
  private parseYAML<T = Record<string, unknown>>(yamlStr: string): T {
    const obj: Record<string, unknown> = {};

    const lines = yamlStr.split('\n').filter((line) => line.trim());
    for (const line of lines) {
      const parts = line.split(':');
      const key = parts[0];
      const valueParts = parts.slice(1);
      const value = valueParts.join(':').trim();

      if (!key) continue;

      // Simple type detection
      if (value === 'true') obj[key.trim()] = true;
      else if (value === 'false') obj[key.trim()] = false;
      else if (!isNaN(Number(value)) && value !== '') obj[key.trim()] = Number(value);
      else obj[key.trim()] = value;
    }

    return obj as T;
  }

  /**
   * Convert object to simple YAML (key: value format)
   */
  private stringifyYAML(obj: Record<string, unknown>): string {
    return Object.entries(obj)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}: ${value}`;
        }
        return `${key}: ${String(value)}`;
      })
      .join('\n');
  }
}

// Export singleton instance
export const fileSystemService = new FileSystemService();
