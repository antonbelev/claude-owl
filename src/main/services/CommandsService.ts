import { promises as fs } from 'fs';
import path from 'path';
import { homedir } from 'os';
import type {
  CommandFrontmatter,
  CommandWithMetadata,
  CommandCreateOptions,
  CommandUpdateOptions,
  CommandDeleteOptions,
  CommandMoveOptions,
  CommandFilter,
  CommandSortOptions,
  CommandMetadata,
} from '@/shared/types/command.types';

/**
 * Service for managing Claude Code slash commands
 * Commands are stored as .md files with YAML frontmatter in:
 * - User level: ~/.claude/commands/
 * - Project level: .claude/commands/
 * - Supports subdirectories for namespaces (e.g., workflows/, git/, tools/)
 */
export class CommandsService {
  private userCommandsPath: string;
  private projectCommandsPath: string;

  constructor(userBasePath?: string, projectBasePath?: string) {
    this.userCommandsPath = userBasePath
      ? path.join(userBasePath, 'commands')
      : path.join(homedir(), '.claude', 'commands');
    this.projectCommandsPath = projectBasePath
      ? path.join(projectBasePath, 'commands')
      : path.join(process.cwd(), '.claude', 'commands');
  }

  /**
   * Get the path for a specific location
   */
  private getCommandsPath(location: 'user' | 'project'): string {
    return location === 'user' ? this.userCommandsPath : this.projectCommandsPath;
  }

  /**
   * Parse YAML frontmatter from a markdown file
   * Handles command-specific fields: description, argument-hint, allowed-tools, model, disable-model-invocation
   */
  private parseFrontmatter(content: string): {
    frontmatter: CommandFrontmatter;
    content: string;
    metadata?: CommandMetadata;
  } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match || !match[1] || match[2] === undefined) {
      // Commands can have empty frontmatter
      return {
        frontmatter: {},
        content: content.trim(),
      };
    }

    const frontmatterText = match[1];
    let mainContent = match[2];

    // Check for metadata comment at the end
    const metadataRegex = /<!--\s*metadata:\s*([\s\S]*?)\s*-->/;
    const metadataMatch = mainContent.match(metadataRegex);
    let metadata: CommandMetadata | undefined;

    if (metadataMatch && metadataMatch[1]) {
      try {
        metadata = this.parseMetadataComment(metadataMatch[1]);
        // Remove metadata comment from content
        mainContent = mainContent.replace(metadataRegex, '').trim();
      } catch (error) {
        console.warn('[CommandsService] Failed to parse metadata comment:', error);
      }
    }

    // Parse YAML frontmatter manually
    const frontmatter: Partial<CommandFrontmatter> = {};
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

    const result: { frontmatter: CommandFrontmatter; content: string; metadata?: CommandMetadata } =
      {
        frontmatter: frontmatter as CommandFrontmatter,
        content: mainContent.trim(),
      };

    if (metadata) {
      result.metadata = metadata;
    }

    return result;
  }

  /**
   * Parse metadata from HTML comment
   */
  private parseMetadataComment(metadataText: string): CommandMetadata {
    const lines = metadataText.trim().split('\n');
    const metadata: Record<string, string> = {};

    for (const line of lines) {
      const match = line.trim().match(/^([a-z-]+):\s*(.*)$/);
      if (match && match[1] && match[2]) {
        metadata[match[1]] = match[2];
      }
    }

    const result: CommandMetadata = {
      source: {
        type:
          (metadata['source'] as 'builtin' | 'curated' | 'github' | 'file' | 'clipboard') || 'file',
        trustLevel:
          (metadata['trust-level'] as 'trusted' | 'curated' | 'unknown' | 'dangerous') || 'unknown',
      },
      importedAt: metadata['imported'] ? new Date(metadata['imported']) : new Date(),
      trustScoreAtImport: metadata['trust-score'] ? parseInt(metadata['trust-score'], 10) : 0,
      userEdited: metadata['edited'] === 'true',
    };

    // Add optional properties only if they exist
    if (metadata['url']) {
      result.source.url = metadata['url'];
      result.originalUrl = metadata['url'];
    }
    if (metadata['author']) {
      result.source.author = metadata['author'];
    }
    if (metadata['repo']) {
      result.source.repo = metadata['repo'];
    }

    return result;
  }

  /**
   * Set a value in the frontmatter object
   */
  private setFrontmatterValue(
    frontmatter: Partial<CommandFrontmatter>,
    key: string,
    value: string
  ): void {
    if (key === 'allowed-tools') {
      // Parse comma-separated tools list
      frontmatter['allowed-tools'] = value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    } else if (key === 'model') {
      // Validate model value
      const validModels = ['sonnet', 'opus', 'haiku'];
      if (validModels.includes(value)) {
        frontmatter.model = value as 'sonnet' | 'opus' | 'haiku';
      }
    } else if (key === 'disable-model-invocation') {
      frontmatter['disable-model-invocation'] = value === 'true';
    } else {
      (frontmatter as Record<string, string>)[key] = value;
    }
  }

  /**
   * Quote YAML string value if needed
   */
  private quoteYamlValue(value: string): string {
    // Quote if value contains special YAML characters or starts with [
    if (value.match(/^[[{}&*!|>%@`]/)) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }

  /**
   * Generate YAML frontmatter string from a CommandFrontmatter object
   */
  private generateFrontmatter(frontmatter: CommandFrontmatter): string {
    let yaml = '---\n';

    if (frontmatter.description) {
      yaml += `description: ${this.quoteYamlValue(frontmatter.description)}\n`;
    }

    if (frontmatter['argument-hint']) {
      yaml += `argument-hint: ${this.quoteYamlValue(frontmatter['argument-hint'])}\n`;
    }

    if (frontmatter['allowed-tools'] && frontmatter['allowed-tools'].length > 0) {
      yaml += `allowed-tools: ${frontmatter['allowed-tools'].join(', ')}\n`;
    }

    if (frontmatter.model) {
      yaml += `model: ${frontmatter.model}\n`;
    }

    if (frontmatter['disable-model-invocation'] !== undefined) {
      yaml += `disable-model-invocation: ${frontmatter['disable-model-invocation']}\n`;
    }

    yaml += '---\n';
    return yaml;
  }

  /**
   * Generate metadata comment for provenance tracking
   */
  private generateMetadataComment(metadata: CommandMetadata): string {
    let comment = '\n\n<!--\nmetadata:\n';
    comment += `  source: ${metadata.source.type}\n`;

    if (metadata.source.url) {
      comment += `  url: ${metadata.source.url}\n`;
    }

    if (metadata.source.author) {
      comment += `  author: ${metadata.source.author}\n`;
    }

    if (metadata.source.repo) {
      comment += `  repo: ${metadata.source.repo}\n`;
    }

    comment += `  trust-level: ${metadata.source.trustLevel}\n`;
    comment += `  imported: ${metadata.importedAt.toISOString()}\n`;
    comment += `  trust-score: ${metadata.trustScoreAtImport}\n`;
    comment += `  edited: ${metadata.userEdited}\n`;
    comment += '-->';

    return comment;
  }

  /**
   * Extract namespace from file path
   */
  private extractNamespace(filePath: string, baseDir: string): string | undefined {
    const relativePath = path.relative(baseDir, path.dirname(filePath));
    return relativePath && relativePath !== '.' ? relativePath : undefined;
  }

  /**
   * List all commands recursively from a directory
   */
  private async listCommandsRecursive(
    dir: string,
    location: 'user' | 'project' | 'plugin',
    baseDir: string
  ): Promise<CommandWithMetadata[]> {
    const commands: CommandWithMetadata[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recursively scan subdirectories for namespaced commands
          const subCommands = await this.listCommandsRecursive(fullPath, location, baseDir);
          commands.push(...subCommands);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          try {
            const stat = await fs.stat(fullPath);
            const content = await fs.readFile(fullPath, 'utf-8');
            const parsed = this.parseFrontmatter(content);
            const namespace = this.extractNamespace(fullPath, baseDir);
            const name = path.basename(entry.name, '.md');

            const command: CommandWithMetadata = {
              name,
              frontmatter: parsed.frontmatter,
              content: parsed.content,
              filePath: fullPath,
              location,
              lastModified: stat.mtime,
            };

            // Add optional properties only if they exist
            if (namespace) {
              command.namespace = namespace;
            }
            if (parsed.metadata) {
              command.metadata = parsed.metadata;
            }

            commands.push(command);
          } catch (error) {
            // Skip invalid commands
            console.warn(`[CommandsService] Skipping invalid command at ${fullPath}:`, error);
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
      console.log(`[CommandsService] Directory not accessible: ${dir}`);
    }

    return commands;
  }

  /**
   * List all commands from a specific location
   */
  async listCommands(location: 'user' | 'project'): Promise<CommandWithMetadata[]> {
    console.log(`[CommandsService] Listing commands from ${location}`);
    const commandsPath = this.getCommandsPath(location);

    try {
      await fs.access(commandsPath);
    } catch {
      // Directory doesn't exist, return empty array
      console.log(`[CommandsService] Commands directory doesn't exist: ${commandsPath}`);
      return [];
    }

    return this.listCommandsRecursive(commandsPath, location, commandsPath);
  }

  /**
   * List all commands from both user and project locations
   */
  async listAllCommands(
    filter?: CommandFilter,
    sort?: CommandSortOptions
  ): Promise<CommandWithMetadata[]> {
    console.log('[CommandsService] Listing all commands', { filter, sort });

    const [userCommands, projectCommands] = await Promise.all([
      this.listCommands('user'),
      this.listCommands('project'),
    ]);

    let allCommands = [...userCommands, ...projectCommands];

    // Apply filters
    if (filter) {
      if (filter.location) {
        allCommands = allCommands.filter(cmd => filter.location?.includes(cmd.location));
      }

      if (filter.namespace) {
        allCommands = allCommands.filter(
          cmd => cmd.namespace && filter.namespace?.includes(cmd.namespace)
        );
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        allCommands = allCommands.filter(
          cmd =>
            cmd.name.toLowerCase().includes(searchLower) ||
            cmd.frontmatter.description?.toLowerCase().includes(searchLower) ||
            cmd.content.toLowerCase().includes(searchLower)
        );
      }
    }

    // Apply sorting
    if (sort) {
      allCommands.sort((a, b) => {
        let comparison = 0;

        switch (sort.field) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'lastModified':
            comparison = a.lastModified.getTime() - b.lastModified.getTime();
            break;
          case 'namespace':
            comparison = (a.namespace || '').localeCompare(b.namespace || '');
            break;
          case 'trustScore':
            comparison =
              (a.metadata?.trustScoreAtImport || 0) - (b.metadata?.trustScoreAtImport || 0);
            break;
        }

        return sort.direction === 'desc' ? -comparison : comparison;
      });
    }

    return allCommands;
  }

  /**
   * Get a specific command by file path
   */
  async getCommand(filePath: string): Promise<CommandWithMetadata> {
    console.log('[CommandsService] Getting command:', filePath);

    try {
      const stat = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = this.parseFrontmatter(content);

      // Determine location based on path
      let location: 'user' | 'project' | 'plugin' = 'user';
      let baseDir = this.userCommandsPath;

      if (filePath.includes(this.projectCommandsPath)) {
        location = 'project';
        baseDir = this.projectCommandsPath;
      } else if (!filePath.includes(this.userCommandsPath)) {
        location = 'plugin';
        // For plugin commands, try to determine base directory from file path
        baseDir = path.dirname(filePath);
      }

      const namespace = this.extractNamespace(filePath, baseDir);
      const name = path.basename(filePath, '.md');

      const command: CommandWithMetadata = {
        name,
        frontmatter: parsed.frontmatter,
        content: parsed.content,
        filePath,
        location,
        lastModified: stat.mtime,
      };

      // Add optional properties only if they exist
      if (namespace) {
        command.namespace = namespace;
      }
      if (parsed.metadata) {
        command.metadata = parsed.metadata;
      }

      return command;
    } catch (error) {
      console.error('[CommandsService] Failed to read command:', error);
      throw new Error(
        `Failed to read command: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a new command
   */
  async createCommand(options: CommandCreateOptions): Promise<string> {
    console.log('[CommandsService] Creating command:', {
      name: options.name,
      location: options.location,
      projectPath: options.projectPath,
    });

    const { name, location, projectPath, namespace, frontmatter, content } = options;

    // Validate project path when location is 'project'
    if (location === 'project' && !projectPath) {
      throw new Error('projectPath is required when location is "project"');
    }

    // Validate command name
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
      throw new Error('Invalid command name: must be lowercase with hyphens only');
    }

    if (name.length > 64) {
      throw new Error('Invalid command name: must be 64 characters or less');
    }

    // Determine commands path based on location and projectPath
    const commandsPath =
      location === 'user' ? this.userCommandsPath : path.join(projectPath!, '.claude', 'commands');

    const targetDir = namespace ? path.join(commandsPath, namespace) : commandsPath;
    const commandFilePath = path.join(targetDir, `${name}.md`);

    // Check if command already exists
    try {
      await fs.access(commandFilePath);
      throw new Error(`Command '${name}' already exists at this location`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, continue with creation
    }

    // Create directory if it doesn't exist
    await fs.mkdir(targetDir, { recursive: true });

    // Generate command file content
    const fileContent = this.generateFrontmatter(frontmatter) + '\n' + content;

    // Write command file
    await fs.writeFile(commandFilePath, fileContent, 'utf-8');

    console.log('[CommandsService] Command created successfully:', commandFilePath);
    return commandFilePath;
  }

  /**
   * Update an existing command
   */
  async updateCommand(options: CommandUpdateOptions): Promise<void> {
    console.log('[CommandsService] Updating command:', options.filePath);

    const { filePath, frontmatter, content, namespace } = options;

    // Get current command
    const currentCommand = await this.getCommand(filePath);

    // Determine the actual file path (may change if namespace changed)
    let actualFilePath = filePath;

    // If namespace changed, move the file
    if (namespace !== undefined && namespace !== currentCommand.namespace) {
      actualFilePath = await this.moveCommand({ filePath, newNamespace: namespace });
    }

    // Update frontmatter and/or content
    const updatedFrontmatter = frontmatter || currentCommand.frontmatter;
    const updatedContent = content !== undefined ? content : currentCommand.content;

    // Generate updated file content
    const fileContent = this.generateFrontmatter(updatedFrontmatter) + '\n' + updatedContent;

    // If metadata exists, preserve it
    if (currentCommand.metadata) {
      const metadataComment = this.generateMetadataComment({
        ...currentCommand.metadata,
        userEdited: true, // Mark as edited
      });
      await fs.writeFile(actualFilePath, fileContent + metadataComment, 'utf-8');
    } else {
      await fs.writeFile(actualFilePath, fileContent, 'utf-8');
    }

    console.log('[CommandsService] Command updated successfully');
  }

  /**
   * Delete a command
   */
  async deleteCommand(options: CommandDeleteOptions): Promise<void> {
    console.log('[CommandsService] Deleting command:', options.filePath);

    try {
      await fs.unlink(options.filePath);
      console.log('[CommandsService] Command deleted successfully');
    } catch (error) {
      console.error('[CommandsService] Failed to delete command:', error);
      throw new Error(
        `Failed to delete command: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Move command to different namespace (subdirectory)
   */
  async moveCommand(options: CommandMoveOptions): Promise<string> {
    console.log(
      '[CommandsService] Moving command:',
      options.filePath,
      'to namespace:',
      options.newNamespace
    );

    const { filePath, newNamespace } = options;

    // Get current command
    const command = await this.getCommand(filePath);

    // Determine new path
    const commandsPath = this.getCommandsPath(command.location as 'user' | 'project');
    const targetDir = newNamespace ? path.join(commandsPath, newNamespace) : commandsPath;
    const newFilePath = path.join(targetDir, path.basename(filePath));

    // Check if target already exists
    try {
      await fs.access(newFilePath);
      throw new Error(`Command '${command.name}' already exists at target location`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist at target, continue with move
    }

    // Create target directory if needed
    await fs.mkdir(targetDir, { recursive: true });

    // Move file
    await fs.rename(filePath, newFilePath);

    // Try to remove old directory if empty
    const oldDir = path.dirname(filePath);
    if (oldDir !== commandsPath) {
      try {
        const entries = await fs.readdir(oldDir);
        if (entries.length === 0) {
          await fs.rmdir(oldDir);
        }
      } catch {
        // Directory not empty or other error, ignore
      }
    }

    console.log('[CommandsService] Command moved successfully to:', newFilePath);
    return newFilePath;
  }

  /**
   * Validate a command's name and frontmatter
   */
  validateCommand(
    name: string,
    frontmatter: CommandFrontmatter
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate name
    if (!name) {
      errors.push('Name is required');
    } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
      errors.push('Name must be lowercase with hyphens only');
    } else if (name.length > 64) {
      errors.push('Name must be 64 characters or less');
    }

    // Validate description (recommended but not required)
    if (frontmatter.description && frontmatter.description.length > 1024) {
      errors.push('Description must be 1024 characters or less');
    }

    // Validate model if present
    if (frontmatter.model) {
      const validModels = ['sonnet', 'opus', 'haiku'];
      if (!validModels.includes(frontmatter.model)) {
        errors.push('Model must be one of: sonnet, opus, haiku');
      }
    }

    // Validate allowed-tools if present
    if (frontmatter['allowed-tools']) {
      if (!Array.isArray(frontmatter['allowed-tools'])) {
        errors.push('allowed-tools must be an array');
      } else if (frontmatter['allowed-tools'].some(tool => typeof tool !== 'string')) {
        errors.push('allowed-tools must contain only strings');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
