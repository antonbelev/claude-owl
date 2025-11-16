import { promises as fs } from 'fs';
import path from 'path';
import { homedir } from 'os';
import type { Skill, SkillFrontmatter } from '@/shared/types';

/**
 * Service for managing Claude Code skills
 * Skills are stored in:
 * - User level: ~/.claude/skills/
 * - Project level: .claude/skills/
 */
export class SkillsService {
  private userSkillsPath: string;
  private projectSkillsPath: string;

  constructor() {
    this.userSkillsPath = path.join(homedir(), '.claude', 'skills');
    this.projectSkillsPath = path.join(process.cwd(), '.claude', 'skills');
  }

  /**
   * Get the path for a specific location
   */
  private getSkillsPath(location: 'user' | 'project', projectPath?: string): string {
    if (location === 'user') {
      return this.userSkillsPath;
    }

    if (projectPath) {
      return path.join(projectPath, '.claude', 'skills');
    }

    // Fallback to process.cwd() for backwards compatibility
    return this.projectSkillsPath;
  }

  /**
   * Parse YAML frontmatter from a markdown file
   */
  private parseFrontmatter(content: string): { frontmatter: SkillFrontmatter; content: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match || !match[1] || match[2] === undefined) {
      throw new Error('Invalid skill file format: missing frontmatter');
    }

    const frontmatterText = match[1];
    const mainContent = match[2];

    // Parse YAML frontmatter manually (simple parser for our use case)
    const frontmatter: Partial<SkillFrontmatter> = {};
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
      throw new Error('Invalid skill file: missing required fields (name or description)');
    }

    return {
      frontmatter: frontmatter as SkillFrontmatter,
      content: mainContent.trim(),
    };
  }

  /**
   * Set a value in the frontmatter object
   */
  private setFrontmatterValue(
    frontmatter: Partial<SkillFrontmatter>,
    key: string,
    value: string
  ): void {
    if (key === 'allowed-tools') {
      // Parse array values (can be JSON array or comma-separated)
      try {
        frontmatter['allowed-tools'] = JSON.parse(value);
      } catch {
        frontmatter['allowed-tools'] = value.split(',').map(s => s.trim());
      }
    } else {
      (frontmatter as Record<string, string>)[key] = value;
    }
  }

  /**
   * Generate YAML frontmatter string from a SkillFrontmatter object
   */
  private generateFrontmatter(frontmatter: SkillFrontmatter): string {
    let yaml = '---\n';
    yaml += `name: ${frontmatter.name}\n`;
    yaml += `description: ${frontmatter.description}\n`;

    if (frontmatter['allowed-tools'] && frontmatter['allowed-tools'].length > 0) {
      yaml += `allowed-tools: ${JSON.stringify(frontmatter['allowed-tools'])}\n`;
    }

    yaml += '---\n';
    return yaml;
  }

  /**
   * List all skills from a specific location
   */
  async listSkills(location: 'user' | 'project', projectPath?: string): Promise<Skill[]> {
    const skillsPath = this.getSkillsPath(location, projectPath);

    try {
      // Check if directory exists
      await fs.access(skillsPath);
    } catch {
      // Directory doesn't exist, return empty array
      return [];
    }

    const skills: Skill[] = [];
    const entries = await fs.readdir(skillsPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = path.join(skillsPath, entry.name, 'SKILL.md');

        try {
          // Check if SKILL.md exists
          const stat = await fs.stat(skillPath);
          const content = await fs.readFile(skillPath, 'utf-8');
          const parsed = this.parseFrontmatter(content);

          // List supporting files (all files except SKILL.md)
          const skillDirPath = path.join(skillsPath, entry.name);
          const allFiles = await fs.readdir(skillDirPath);
          const supportingFiles = allFiles.filter(f => f !== 'SKILL.md');

          const skillData: Skill = {
            frontmatter: parsed.frontmatter,
            content: parsed.content,
            filePath: skillPath,
            location,
            lastModified: stat.mtime,
            ...(location === 'project' && projectPath && { projectPath }),
          };

          if (supportingFiles.length > 0) {
            skillData.supportingFiles = supportingFiles;
          }

          skills.push(skillData);
        } catch (error) {
          // Skip invalid skills
          console.warn(`Skipping invalid skill at ${skillPath}:`, error);
        }
      }
    }

    return skills;
  }

  /**
   * List all skills from both user and project locations
   */
  async listAllSkills(): Promise<Skill[]> {
    const [userSkills, projectSkills] = await Promise.all([
      this.listSkills('user'),
      this.listSkills('project'),
    ]);

    return [...userSkills, ...projectSkills];
  }

  /**
   * Get a specific skill by name and location
   */
  async getSkill(name: string, location: 'user' | 'project', projectPath?: string): Promise<Skill> {
    const skillsPath = this.getSkillsPath(location, projectPath);
    const skillPath = path.join(skillsPath, name, 'SKILL.md');

    try {
      const stat = await fs.stat(skillPath);
      const content = await fs.readFile(skillPath, 'utf-8');
      const parsed = this.parseFrontmatter(content);

      // List supporting files
      const skillDirPath = path.join(skillsPath, name);
      const allFiles = await fs.readdir(skillDirPath);
      const supportingFiles = allFiles.filter(f => f !== 'SKILL.md');

      const skillData: Skill = {
        frontmatter: parsed.frontmatter,
        content: parsed.content,
        filePath: skillPath,
        location,
        lastModified: stat.mtime,
        ...(location === 'project' && projectPath && { projectPath }),
      };

      if (supportingFiles.length > 0) {
        skillData.supportingFiles = supportingFiles;
      }

      return skillData;
    } catch (error) {
      throw new Error(
        `Failed to read skill "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create or update a skill
   */
  async saveSkill(
    name: string,
    description: string,
    content: string,
    location: 'user' | 'project',
    allowedTools?: string[],
    projectPath?: string
  ): Promise<Skill> {
    // Validate projectPath for project-level skills
    if (location === 'project' && !projectPath) {
      throw new Error('projectPath is required when location is "project"');
    }

    // Validate skill name
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
      throw new Error('Invalid skill name: must be lowercase with hyphens only');
    }

    if (name.length > 64) {
      throw new Error('Invalid skill name: must be 64 characters or less');
    }

    if (description.length > 1024) {
      throw new Error('Invalid description: must be 1024 characters or less');
    }

    const skillsPath = this.getSkillsPath(location, projectPath);
    const skillDirPath = path.join(skillsPath, name);
    const skillFilePath = path.join(skillDirPath, 'SKILL.md');

    console.log('[SkillsService] Saving skill:', {
      name,
      location,
      projectPath,
      skillsPath,
    });

    // Create skills directory if it doesn't exist
    await fs.mkdir(skillsPath, { recursive: true });

    // Create skill directory
    await fs.mkdir(skillDirPath, { recursive: true });

    // Generate skill file content
    const frontmatter: SkillFrontmatter = {
      name,
      description,
      ...(allowedTools && allowedTools.length > 0 && { 'allowed-tools': allowedTools }),
    };

    const fileContent = this.generateFrontmatter(frontmatter) + '\n' + content;

    // Write skill file
    await fs.writeFile(skillFilePath, fileContent, 'utf-8');

    // Return the created skill
    return this.getSkill(name, location, projectPath);
  }

  /**
   * Delete a skill
   */
  async deleteSkill(name: string, location: 'user' | 'project', projectPath?: string): Promise<void> {
    const skillsPath = this.getSkillsPath(location, projectPath);
    const skillDirPath = path.join(skillsPath, name);

    try {
      // Remove the entire skill directory
      await fs.rm(skillDirPath, { recursive: true, force: true });
    } catch (error) {
      throw new Error(
        `Failed to delete skill "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate a skill's frontmatter and content
   */
  validateSkill(
    frontmatter: SkillFrontmatter,
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

    // Validate allowed-tools if present
    if (frontmatter['allowed-tools']) {
      if (!Array.isArray(frontmatter['allowed-tools'])) {
        errors.push('allowed-tools must be an array');
      } else if (frontmatter['allowed-tools'].some(tool => typeof tool !== 'string')) {
        errors.push('allowed-tools must contain only strings');
      }
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      errors.push('Content is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
