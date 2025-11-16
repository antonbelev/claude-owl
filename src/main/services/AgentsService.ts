import { promises as fs } from 'fs';
import path from 'path';
import { homedir } from 'os';
import type { Agent, AgentFrontmatter } from '@/shared/types';

/**
 * Service for managing Claude Code subagents
 * Agents are stored as .md files with YAML frontmatter in:
 * - User level: ~/.claude/agents/
 * - Project level: .claude/agents/
 */
export class AgentsService {
  private userAgentsPath: string;
  private projectAgentsPath: string;

  constructor() {
    this.userAgentsPath = path.join(homedir(), '.claude', 'agents');
    this.projectAgentsPath = path.join(process.cwd(), '.claude', 'agents');
  }

  /**
   * Get the path for a specific location
   */
  private getAgentsPath(location: 'user' | 'project', projectPath?: string): string {
    if (location === 'user') {
      return this.userAgentsPath;
    }

    if (projectPath) {
      return path.join(projectPath, '.claude', 'agents');
    }

    // Fallback to process.cwd() for backwards compatibility
    return this.projectAgentsPath;
  }

  /**
   * Parse YAML frontmatter from a markdown file
   */
  private parseFrontmatter(content: string): { frontmatter: AgentFrontmatter; content: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match || !match[1] || match[2] === undefined) {
      throw new Error('Invalid agent file format: missing frontmatter');
    }

    const frontmatterText = match[1];
    const mainContent = match[2];

    // Parse YAML frontmatter manually (simple parser for our use case)
    const frontmatter: Partial<AgentFrontmatter> = {};
    const lines = frontmatterText.split('\n');

    let currentKey: string = '';
    let currentValue: string = '';

    for (const line of lines) {
      // Check if this is a key-value pair
      const keyValueMatch = line.match(/^([a-z-]+):\s*(.*)$/);
      if (keyValueMatch && keyValueMatch[1]) {
        // Save previous key-value if exists
        if (currentKey) {
          this.setFrontmatterValue(frontmatter, currentKey, currentValue.trim());
        }
        currentKey = keyValueMatch[1];
        currentValue = keyValueMatch[2] ?? '';
      } else if (currentKey) {
        // Continuation of previous value
        currentValue += '\n' + line;
      }
    }

    // Save last key-value pair
    if (currentKey) {
      this.setFrontmatterValue(frontmatter, currentKey, currentValue.trim());
    }

    // Validate required fields
    if (!frontmatter.name || !frontmatter.description) {
      throw new Error('Invalid agent file: missing required fields (name or description)');
    }

    return {
      frontmatter: frontmatter as AgentFrontmatter,
      content: mainContent.trim(),
    };
  }

  /**
   * Set a value in the frontmatter object
   */
  private setFrontmatterValue(
    frontmatter: Partial<AgentFrontmatter>,
    key: string,
    value: string
  ): void {
    if (key === 'tools') {
      // Parse comma-separated tools list
      frontmatter.tools = value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    } else if (key === 'model') {
      // Validate model value
      const validModels = ['sonnet', 'opus', 'haiku', 'inherit'];
      if (validModels.includes(value)) {
        frontmatter.model = value as 'sonnet' | 'opus' | 'haiku' | 'inherit';
      }
    } else {
      (frontmatter as Record<string, string>)[key] = value;
    }
  }

  /**
   * Generate YAML frontmatter string from an AgentFrontmatter object
   */
  private generateFrontmatter(frontmatter: AgentFrontmatter): string {
    let yaml = '---\n';
    yaml += `name: ${frontmatter.name}\n`;
    yaml += `description: ${frontmatter.description}\n`;

    if (frontmatter.tools && frontmatter.tools.length > 0) {
      yaml += `tools: ${frontmatter.tools.join(', ')}\n`;
    }

    if (frontmatter.model) {
      yaml += `model: ${frontmatter.model}\n`;
    }

    yaml += '---\n';
    return yaml;
  }

  /**
   * List all agents from a specific location
   */
  async listAgents(location: 'user' | 'project'): Promise<Agent[]> {
    const agentsPath = this.getAgentsPath(location);

    try {
      // Check if directory exists
      await fs.access(agentsPath);
    } catch {
      // Directory doesn't exist, return empty array
      return [];
    }

    const agents: Agent[] = [];
    const entries = await fs.readdir(agentsPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const agentPath = path.join(agentsPath, entry.name);

        try {
          const stat = await fs.stat(agentPath);
          const content = await fs.readFile(agentPath, 'utf-8');
          const parsed = this.parseFrontmatter(content);

          agents.push({
            frontmatter: parsed.frontmatter,
            content: parsed.content,
            filePath: agentPath,
            location,
            lastModified: stat.mtime,
          });
        } catch (error) {
          // Skip invalid agents
          console.warn(`Skipping invalid agent at ${agentPath}:`, error);
        }
      }
    }

    return agents;
  }

  /**
   * List all agents from both user and project locations
   */
  async listAllAgents(): Promise<Agent[]> {
    const [userAgents, projectAgents] = await Promise.all([
      this.listAgents('user'),
      this.listAgents('project'),
    ]);

    return [...userAgents, ...projectAgents];
  }

  /**
   * Get a specific agent by file path
   */
  async getAgent(filePath: string): Promise<Agent> {
    try {
      const stat = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = this.parseFrontmatter(content);

      // Determine location based on path
      const location = filePath.includes(this.userAgentsPath) ? 'user' : 'project';

      return {
        frontmatter: parsed.frontmatter,
        content: parsed.content,
        filePath,
        location,
        lastModified: stat.mtime,
      };
    } catch (error) {
      throw new Error(
        `Failed to read agent: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create or update an agent
   */
  async saveAgent(agent: Omit<Agent, 'lastModified'>): Promise<Agent> {
    const { frontmatter, content, location, projectPath } = agent;

    // Plugin agents cannot be saved
    if (location === 'plugin') {
      throw new Error('Cannot save plugin agents');
    }

    // Validate projectPath for project-level agents
    if (location === 'project' && !projectPath) {
      throw new Error('projectPath is required when location is "project"');
    }

    // Validate agent name
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(frontmatter.name)) {
      throw new Error('Invalid agent name: must be lowercase with hyphens only');
    }

    if (frontmatter.name.length > 64) {
      throw new Error('Invalid agent name: must be 64 characters or less');
    }

    if (frontmatter.description.length > 1024) {
      throw new Error('Invalid description: must be 1024 characters or less');
    }

    const agentsPath = this.getAgentsPath(location, projectPath);
    const agentFilePath = path.join(agentsPath, `${frontmatter.name}.md`);

    console.log('[AgentsService] Saving agent:', {
      name: frontmatter.name,
      location,
      projectPath,
      agentsPath,
    });

    // Create agents directory if it doesn't exist
    await fs.mkdir(agentsPath, { recursive: true });

    // Generate agent file content
    const fileContent = this.generateFrontmatter(frontmatter) + '\n' + content;

    // Write agent file
    await fs.writeFile(agentFilePath, fileContent, 'utf-8');

    // Return the created/updated agent
    return this.getAgent(agentFilePath);
  }

  /**
   * Delete an agent
   */
  async deleteAgent(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      throw new Error(
        `Failed to delete agent: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate an agent's frontmatter and content
   */
  validateAgent(
    frontmatter: AgentFrontmatter,
    content: string
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate name
    if (!frontmatter.name) {
      errors.push('Name is required');
    } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(frontmatter.name)) {
      errors.push('Name must be lowercase with hyphens only');
    } else if (frontmatter.name.length > 64) {
      errors.push('Name must be 64 characters or less');
    }

    // Validate description
    if (!frontmatter.description) {
      errors.push('Description is required');
    } else if (frontmatter.description.length > 1024) {
      errors.push('Description must be 1024 characters or less');
    }

    // Validate model if present
    if (frontmatter.model) {
      const validModels = ['sonnet', 'opus', 'haiku', 'inherit'];
      if (!validModels.includes(frontmatter.model)) {
        errors.push('Model must be one of: sonnet, opus, haiku, inherit');
      }
    }

    // Validate tools if present
    if (frontmatter.tools) {
      if (!Array.isArray(frontmatter.tools)) {
        errors.push('Tools must be an array');
      } else if (frontmatter.tools.some(tool => typeof tool !== 'string')) {
        errors.push('Tools must contain only strings');
      }
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      errors.push('Content (system prompt) is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
