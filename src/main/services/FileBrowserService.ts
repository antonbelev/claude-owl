/**
 * Service for browsing directory structures and reading file contents
 * Used for exploring plugin folders, command/agent files, etc.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  children?: FileNode[];
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
  extension: string;
}

export class FileBrowserService {
  /**
   * Read directory structure recursively up to a certain depth
   */
  async readDirectory(
    dirPath: string,
    maxDepth: number = 3,
    currentDepth: number = 0
  ): Promise<FileNode[]> {
    console.log('[FileBrowserService] Reading directory:', { dirPath, maxDepth, currentDepth });

    try {
      // Security: Validate path exists and is a directory
      const stats = await fs.stat(dirPath);
      if (!stats.isDirectory()) {
        throw new Error('Path is not a directory');
      }

      // Stop if we've reached max depth
      if (currentDepth >= maxDepth) {
        console.log('[FileBrowserService] Max depth reached');
        return [];
      }

      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const nodes: FileNode[] = [];

      for (const entry of entries) {
        // Skip hidden files and directories (starting with .)
        if (entry.name.startsWith('.')) {
          continue;
        }

        const fullPath = path.join(dirPath, entry.name);

        try {
          const stats = await fs.stat(fullPath);

          if (entry.isDirectory()) {
            // Recursively read subdirectory
            const children = await this.readDirectory(fullPath, maxDepth, currentDepth + 1);
            nodes.push({
              name: entry.name,
              path: fullPath,
              type: 'directory',
              children,
            });
          } else if (entry.isFile()) {
            const extension = path.extname(entry.name).slice(1).toLowerCase();
            nodes.push({
              name: entry.name,
              path: fullPath,
              type: 'file',
              size: stats.size,
              extension,
            });
          }
        } catch (error) {
          // Skip files/dirs we can't access
          console.warn(`[FileBrowserService] Cannot access ${fullPath}:`, error);
          continue;
        }
      }

      // Sort: directories first, then files, both alphabetically
      nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      console.log(`[FileBrowserService] Found ${nodes.length} entries in ${dirPath}`);
      return nodes;
    } catch (error) {
      console.error('[FileBrowserService] Failed to read directory:', error);
      throw error;
    }
  }

  /**
   * Read file content (text files only, with size limit)
   */
  async readFileContent(filePath: string, maxSize: number = 1024 * 1024): Promise<FileContent> {
    console.log('[FileBrowserService] Reading file:', filePath);

    try {
      // Security: Validate path exists and is a file
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        throw new Error('Path is not a file');
      }

      // Check file size
      if (stats.size > maxSize) {
        throw new Error(`File too large (${stats.size} bytes). Maximum size: ${maxSize} bytes`);
      }

      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');
      const extension = path.extname(filePath).slice(1).toLowerCase();

      console.log(`[FileBrowserService] Read ${stats.size} bytes from ${filePath}`);

      return {
        path: filePath,
        content,
        size: stats.size,
        extension,
      };
    } catch (error) {
      console.error('[FileBrowserService] Failed to read file:', error);
      throw error;
    }
  }

  /**
   * Get file or directory info
   */
  async getPathInfo(targetPath: string): Promise<{ exists: boolean; isDirectory: boolean; isFile: boolean; size?: number }> {
    try {
      const stats = await fs.stat(targetPath);
      return {
        exists: true,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        size: stats.size,
      };
    } catch (error) {
      return {
        exists: false,
        isDirectory: false,
        isFile: false,
      };
    }
  }

  /**
   * Check if path is within allowed directory (security check)
   */
  isPathAllowed(targetPath: string, allowedBasePath: string): boolean {
    const normalizedTarget = path.normalize(targetPath);
    const normalizedBase = path.normalize(allowedBasePath);
    return normalizedTarget.startsWith(normalizedBase);
  }
}
