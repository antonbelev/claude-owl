/**
 * PathService
 * Centralized service for path construction and validation
 *
 * Handles all path operations related to Claude configuration files,
 * ensuring consistent path resolution across the application.
 * All path construction should go through this service.
 */

import path from 'path';
import { homedir, platform } from 'os';

export class PathService {
  /**
   * Get the user-level Claude directory (~/.claude/)
   */
  getUserClaudeDir(): string {
    return path.join(homedir(), '.claude');
  }

  /**
   * Get the project-level Claude directory (.claude/ in given path)
   * @param projectPath - Explicit project path (required)
   * @throws Error if projectPath is not provided
   *
   * IMPORTANT: Claude Owl is a standalone desktop app without project context.
   * We MUST NOT use process.cwd() as it returns the app's installation directory,
   * not the user's project. See ADR-007 for details.
   */
  getProjectClaudeDir(projectPath: string): string {
    if (!projectPath) {
      throw new Error(
        'projectPath is required. Claude Owl is a standalone app without project context awareness. ' +
          'You must provide an explicit project path instead of relying on process.cwd().'
      );
    }
    return path.join(projectPath, '.claude');
  }

  /**
   * Get the path to skills directory
   * @param location - 'user' for ~/.claude/skills or 'project' for .claude/skills
   * @param projectPath - Project path (required if location is 'project')
   */
  getSkillsPath(location: 'user', projectPath?: never): string;
  getSkillsPath(location: 'project', projectPath: string): string;
  getSkillsPath(location: 'user' | 'project', projectPath?: string): string {
    const baseDir =
      location === 'user' ? this.getUserClaudeDir() : this.getProjectClaudeDir(projectPath!);
    return path.join(baseDir, 'skills');
  }

  /**
   * Get the path to a specific skill file
   */
  getSkillPath(name: string, location: 'user', projectPath?: never): string;
  getSkillPath(name: string, location: 'project', projectPath: string): string;
  getSkillPath(name: string, location: 'user' | 'project', projectPath?: string): string {
    const baseDir = this.getSkillsPath(location as any, projectPath as any);
    return path.join(baseDir, `${name}.md`);
  }

  /**
   * Get the path to agents directory
   */
  getAgentsPath(location: 'user', projectPath?: never): string;
  getAgentsPath(location: 'project', projectPath: string): string;
  getAgentsPath(location: 'user' | 'project', projectPath?: string): string {
    const baseDir =
      location === 'user' ? this.getUserClaudeDir() : this.getProjectClaudeDir(projectPath!);
    return path.join(baseDir, 'agents');
  }

  /**
   * Get the path to a specific agent file
   */
  getAgentPath(name: string, location: 'user', projectPath?: never): string;
  getAgentPath(name: string, location: 'project', projectPath: string): string;
  getAgentPath(name: string, location: 'user' | 'project', projectPath?: string): string {
    const baseDir = this.getAgentsPath(location as any, projectPath as any);
    return path.join(baseDir, `${name}.md`);
  }

  /**
   * Get the path to commands directory
   */
  getCommandsPath(location: 'user', projectPath?: never): string;
  getCommandsPath(location: 'project', projectPath: string): string;
  getCommandsPath(location: 'user' | 'project', projectPath?: string): string {
    const baseDir =
      location === 'user' ? this.getUserClaudeDir() : this.getProjectClaudeDir(projectPath!);
    return path.join(baseDir, 'commands');
  }

  /**
   * Get the path to a specific command file
   */
  getCommandPath(name: string, location: 'user', projectPath?: never): string;
  getCommandPath(name: string, location: 'project', projectPath: string): string;
  getCommandPath(name: string, location: 'user' | 'project', projectPath?: string): string {
    const baseDir = this.getCommandsPath(location as any, projectPath as any);
    return path.join(baseDir, `${name}.md`);
  }

  /**
   * Get the path to hooks configuration file
   * @param location - 'user' for ~/.claude/settings.json or 'project' for .claude/settings.json
   */
  getSettingsPath(location: 'user', projectPath?: never): string;
  getSettingsPath(location: 'project', projectPath: string): string;
  getSettingsPath(location: 'user' | 'project', projectPath?: string): string {
    const baseDir =
      location === 'user' ? this.getUserClaudeDir() : this.getProjectClaudeDir(projectPath!);
    return path.join(baseDir, 'settings.json');
  }

  /**
   * Get the path to local settings file (per project or user)
   * This file is typically gitignored
   */
  getLocalSettingsPath(location: 'user', projectPath?: never): string;
  getLocalSettingsPath(location: 'project', projectPath: string): string;
  getLocalSettingsPath(location: 'user' | 'project', projectPath?: string): string {
    const baseDir =
      location === 'user' ? this.getUserClaudeDir() : this.getProjectClaudeDir(projectPath!);
    return path.join(baseDir, 'settings.local.json');
  }

  /**
   * Get the path to managed settings file
   * This file is managed by the system/app
   */
  getManagedSettingsPath(): string {
    // Managed settings are always at user level
    return path.join(this.getUserClaudeDir(), 'settings.managed.json');
  }

  /**
   * Get the path to plugins directory
   */
  getPluginsPath(location: 'user', projectPath?: never): string;
  getPluginsPath(location: 'project', projectPath: string): string;
  getPluginsPath(location: 'user' | 'project', projectPath?: string): string {
    const baseDir =
      location === 'user' ? this.getUserClaudeDir() : this.getProjectClaudeDir(projectPath!);
    return path.join(baseDir, 'plugins');
  }

  /**
   * Get the path to a specific plugin
   */
  getPluginPath(pluginId: string, location: 'user', projectPath?: never): string;
  getPluginPath(pluginId: string, location: 'project', projectPath: string): string;
  getPluginPath(pluginId: string, location: 'user' | 'project', projectPath?: string): string {
    const baseDir = this.getPluginsPath(location as any, projectPath as any);
    return path.join(baseDir, pluginId);
  }

  /**
   * Get the path to debug logs directory
   * Platform-specific: %APPDATA% on Windows, ~/.cache on Linux, ~/Library/Caches on macOS
   */
  getDebugLogsPath(): string {
    const osType = platform();

    if (osType === 'win32') {
      // Windows: %APPDATA%\claude-owl\logs
      const appData = process.env.APPDATA;
      if (!appData) {
        console.warn('[PathService] APPDATA environment variable not found, using fallback');
      }
      const basePath = appData || path.join(homedir(), 'AppData', 'Roaming');
      const logsPath = path.join(basePath, 'claude-owl', 'logs');

      console.log('[PathService] Windows debug logs path:', logsPath);
      return logsPath;
    } else if (osType === 'darwin') {
      // macOS: ~/Library/Caches/claude-owl/logs
      return path.join(homedir(), 'Library', 'Caches', 'claude-owl', 'logs');
    } else {
      // Linux: ~/.cache/claude-owl/logs
      return path.join(homedir(), '.cache', 'claude-owl', 'logs');
    }
  }

  /**
   * Validate that a path is within expected directory
   * Prevents directory traversal attacks
   */
  validatePath(filePath: string, allowedBaseDir?: string): boolean {
    try {
      const resolved = path.resolve(filePath);
      const base = allowedBaseDir ? path.resolve(allowedBaseDir) : null;

      // Check if path escapes the base directory
      if (base) {
        const relative = path.relative(base, resolved);
        if (relative.startsWith('..')) {
          console.warn('[PathService] Path traversal attempt detected:', filePath);
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Normalize a path to ensure consistency
   */
  normalizePath(filePath: string): string {
    return path.normalize(filePath);
  }

  /**
   * Get relative path from one directory to another
   */
  getRelativePath(from: string, to: string): string {
    return path.relative(from, to);
  }

  /**
   * Join path segments
   */
  join(...segments: string[]): string {
    return path.join(...segments);
  }

  /**
   * Get directory name from path
   */
  dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * Get base name from path
   */
  basename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  /**
   * Get file extension
   */
  extname(filePath: string): string {
    return path.extname(filePath);
  }
}

// Export singleton instance
export const pathService = new PathService();
