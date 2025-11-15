import { promises as fs } from 'fs';
import path from 'path';
import { homedir } from 'os';
import type { ClaudeConfig, ClaudeProjectData, ProjectInfo } from '@/shared/types/project.types';
import type { MCPServerConfig } from '@/shared/types/mcp.types';

/**
 * Service for discovering projects from .claude.json
 *
 * IMPORTANT: This service only READS .claude.json (never writes)
 * .claude.json is CLI-managed and we use it only for project discovery
 */
export class ProjectDiscoveryService {
  private claudeConfigPath: string;

  constructor() {
    // Path to .claude.json (user's home directory)
    this.claudeConfigPath = path.join(homedir(), '.claude.json');
    console.log('[ProjectDiscoveryService] Initialized with path:', this.claudeConfigPath);
  }

  /**
   * Get path to .claude.json
   */
  getClaudeConfigPath(): string {
    return this.claudeConfigPath;
  }

  /**
   * Check if .claude.json exists and is readable
   */
  async checkClaudeConfig(): Promise<{
    exists: boolean;
    path: string;
    readable: boolean;
    projectCount: number;
  }> {
    console.log('[ProjectDiscoveryService] Checking Claude config at:', this.claudeConfigPath);

    try {
      await fs.access(this.claudeConfigPath, fs.constants.R_OK);
      const config = await this.readClaudeConfig();
      const projectCount = Object.keys(config.projects || {}).length;

      console.log('[ProjectDiscoveryService] Config exists and is readable:', {
        projectCount,
      });

      return {
        exists: true,
        path: this.claudeConfigPath,
        readable: true,
        projectCount,
      };
    } catch (error) {
      console.warn('[ProjectDiscoveryService] Config not accessible:', {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        exists: false,
        path: this.claudeConfigPath,
        readable: false,
        projectCount: 0,
      };
    }
  }

  /**
   * Read and parse .claude.json
   * Returns the full config object
   */
  async readClaudeConfig(): Promise<ClaudeConfig> {
    console.log('[ProjectDiscoveryService] Reading Claude config');

    try {
      const content = await fs.readFile(this.claudeConfigPath, 'utf-8');
      const config = JSON.parse(content) as ClaudeConfig;

      console.log('[ProjectDiscoveryService] Config read successfully:', {
        hasProjects: !!config.projects,
        projectCount: Object.keys(config.projects || {}).length,
      });

      return config;
    } catch (error) {
      console.error('[ProjectDiscoveryService] Failed to read config:', {
        error: error instanceof Error ? error.message : String(error),
      });

      throw new Error(
        `Failed to read .claude.json: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get list of all projects from .claude.json
   */
  async getProjects(): Promise<ProjectInfo[]> {
    console.log('[ProjectDiscoveryService] Getting projects list');

    try {
      const config = await this.readClaudeConfig();
      const projects = config.projects || {};

      console.log('[ProjectDiscoveryService] Found projects:', {
        count: Object.keys(projects).length,
      });

      const projectInfos: ProjectInfo[] = [];

      for (const [projectPath, projectData] of Object.entries(projects)) {
        const projectInfo = this.parseProjectInfo(projectPath, projectData);
        projectInfos.push(projectInfo);
      }

      // Sort by last modified (most recent first)
      projectInfos.sort((a, b) => {
        if (!a.lastModified || !b.lastModified) return 0;
        return b.lastModified.getTime() - a.lastModified.getTime();
      });

      console.log('[ProjectDiscoveryService] Parsed project infos:', {
        count: projectInfos.length,
      });

      return projectInfos;
    } catch (error) {
      console.error('[ProjectDiscoveryService] Failed to get projects:', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Return empty array if .claude.json doesn't exist or is invalid
      return [];
    }
  }

  /**
   * Get detailed information about a specific project
   */
  async getProjectInfo(projectPath: string): Promise<{
    projectInfo: ProjectInfo;
    projectData: ClaudeProjectData;
  }> {
    console.log('[ProjectDiscoveryService] Getting project info:', { projectPath });

    const config = await this.readClaudeConfig();
    const projectData = config.projects?.[projectPath];

    if (!projectData) {
      throw new Error(`Project not found in .claude.json: ${projectPath}`);
    }

    const projectInfo = this.parseProjectInfo(projectPath, projectData);

    console.log('[ProjectDiscoveryService] Project info retrieved:', {
      name: projectInfo.name,
      mcpServerCount: projectInfo.mcpServerCount,
    });

    return {
      projectInfo,
      projectData,
    };
  }

  /**
   * Get MCP servers for a specific project
   * Reads from .claude.json only (not .mcp.json)
   */
  async getProjectMCPServers(
    projectPath: string
  ): Promise<Array<{ name: string; config: MCPServerConfig; source: 'claude-json' | 'mcp-json' }>> {
    console.log('[ProjectDiscoveryService] Getting MCP servers for project:', { projectPath });

    const config = await this.readClaudeConfig();
    const projectData = config.projects?.[projectPath];

    if (!projectData) {
      console.warn('[ProjectDiscoveryService] Project not found:', { projectPath });
      return [];
    }

    const servers: Array<{
      name: string;
      config: MCPServerConfig;
      source: 'claude-json' | 'mcp-json';
    }> = [];

    // Extract MCP servers from .claude.json
    if (projectData.mcpServers) {
      for (const [name, config] of Object.entries(projectData.mcpServers)) {
        servers.push({
          name,
          config,
          source: 'claude-json',
        });
      }
    }

    console.log('[ProjectDiscoveryService] Found MCP servers:', {
      count: servers.length,
      names: servers.map(s => s.name),
    });

    return servers;
  }

  /**
   * Parse project path and data into ProjectInfo
   */
  private parseProjectInfo(projectPath: string, projectData: ClaudeProjectData): ProjectInfo {
    // Extract project name from path (last segment)
    const name = path.basename(projectPath);

    // Count MCP servers
    const mcpServerCount = Object.keys(projectData.mcpServers || {}).length;
    const mcpServerNames = Object.keys(projectData.mcpServers || {});

    // Determine last modified (use lastSessionId timestamp if available)
    let lastModified: Date | undefined;
    if (projectData.lastSessionId) {
      // Try to parse timestamp from session ID if it contains one
      // Session IDs often have timestamps, but format may vary
      // For now, we'll leave this undefined and sort alphabetically
      lastModified = undefined;
    }

    return {
      path: projectPath,
      name,
      lastSessionId: projectData.lastSessionId,
      hasTrustAccepted: projectData.hasTrustDialogAccepted || false,
      mcpServerCount,
      mcpServerNames,
      lastModified,
    };
  }

  /**
   * Check if a project directory exists on the file system
   */
  async projectDirectoryExists(projectPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(projectPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check if a project has .claude directory
   */
  async hasClaudeDirectory(projectPath: string): Promise<boolean> {
    try {
      const claudeDir = path.join(projectPath, '.claude');
      const stat = await fs.stat(claudeDir);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
}
