import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { CommandsService } from '@/main/services/CommandsService';
import type { CommandFrontmatter } from '@/shared/types/agent.types';
import type {
  CommandFilter,
  CommandSortOptions,
  CommandCreateOptions,
  CommandUpdateOptions,
  CommandDeleteOptions,
  CommandMoveOptions,
} from '@/shared/types/command.types';

describe('CommandsService', () => {
  let commandsService: CommandsService;
  let testUserDir: string;
  let testProjectDir: string;

  beforeEach(async () => {
    // Create temporary test directories
    testUserDir = path.join(os.tmpdir(), `claude-test-user-${Date.now()}`);
    testProjectDir = path.join(os.tmpdir(), `claude-test-project-${Date.now()}`);

    await fs.ensureDir(testUserDir);
    await fs.ensureDir(testProjectDir);

    // Initialize service with test directories
    commandsService = new CommandsService(testUserDir, testProjectDir);
  });

  afterEach(async () => {
    // Clean up test directories
    if (await fs.pathExists(testUserDir)) {
      await fs.remove(testUserDir);
    }
    if (await fs.pathExists(testProjectDir)) {
      await fs.remove(testProjectDir);
    }
  });

  describe('listAllCommands', () => {
    it('should return empty array when no commands exist', async () => {
      const commands = await commandsService.listAllCommands();
      expect(commands).toEqual([]);
    });

    it('should list user commands', async () => {
      const commandsDir = path.join(testUserDir, 'commands');
      await fs.ensureDir(commandsDir);

      const commandContent = `---
description: Test command
---

Test content`;

      await fs.writeFile(path.join(commandsDir, 'test-cmd.md'), commandContent);

      const commands = await commandsService.listAllCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0].name).toBe('test-cmd');
      expect(commands[0].location).toBe('user');
      expect(commands[0].frontmatter.description).toBe('Test command');
      expect(commands[0].content).toBe('Test content');
    });

    it('should list project commands', async () => {
      const commandsDir = path.join(testProjectDir, 'commands');
      await fs.ensureDir(commandsDir);

      const commandContent = `---
description: Project command
argument-hint: "[arg]"
---

Project content`;

      await fs.writeFile(path.join(commandsDir, 'project-cmd.md'), commandContent);

      const commands = await commandsService.listAllCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0].name).toBe('project-cmd');
      expect(commands[0].location).toBe('project');
      // Note: The value is stored as a quoted string in YAML but parsed back without quotes
      expect(commands[0].frontmatter['argument-hint']).toMatch(/\[arg\]/);
    });

    it('should list commands with namespaces', async () => {
      const commandsDir = path.join(testUserDir, 'commands');
      const workflowDir = path.join(commandsDir, 'workflows');
      await fs.ensureDir(workflowDir);

      const commandContent = `---
description: Workflow command
---

Workflow content`;

      await fs.writeFile(path.join(workflowDir, 'deploy.md'), commandContent);

      const commands = await commandsService.listAllCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0].name).toBe('deploy');
      expect(commands[0].namespace).toBe('workflows');
    });

    it('should filter commands by location', async () => {
      // Create user command
      const userDir = path.join(testUserDir, 'commands');
      await fs.ensureDir(userDir);
      await fs.writeFile(path.join(userDir, 'user-cmd.md'), '---\ndescription: User\n---\nContent');

      // Create project command
      const projectDir = path.join(testProjectDir, 'commands');
      await fs.ensureDir(projectDir);
      await fs.writeFile(
        path.join(projectDir, 'project-cmd.md'),
        '---\ndescription: Project\n---\nContent'
      );

      const filter: CommandFilter = { location: ['user'] };
      const commands = await commandsService.listAllCommands(filter);

      expect(commands).toHaveLength(1);
      expect(commands[0].location).toBe('user');
    });

    it('should filter commands by namespace', async () => {
      const commandsDir = path.join(testUserDir, 'commands');
      const gitDir = path.join(commandsDir, 'git');
      await fs.ensureDir(commandsDir);
      await fs.ensureDir(gitDir);

      await fs.writeFile(
        path.join(commandsDir, 'root-cmd.md'),
        '---\ndescription: Root\n---\nContent'
      );
      await fs.writeFile(path.join(gitDir, 'git-cmd.md'), '---\ndescription: Git\n---\nContent');

      const filter: CommandFilter = { namespace: ['git'] };
      const commands = await commandsService.listAllCommands(filter);

      expect(commands).toHaveLength(1);
      expect(commands[0].namespace).toBe('git');
    });

    it('should search commands by name and description', async () => {
      const commandsDir = path.join(testUserDir, 'commands');
      await fs.ensureDir(commandsDir);

      await fs.writeFile(
        path.join(commandsDir, 'deploy.md'),
        '---\ndescription: Deploy application\n---\nContent'
      );
      await fs.writeFile(
        path.join(commandsDir, 'test.md'),
        '---\ndescription: Run tests\n---\nContent'
      );

      const filter: CommandFilter = { search: 'deploy' };
      const commands = await commandsService.listAllCommands(filter);

      expect(commands).toHaveLength(1);
      expect(commands[0].name).toBe('deploy');
    });

    it('should sort commands by name', async () => {
      const commandsDir = path.join(testUserDir, 'commands');
      await fs.ensureDir(commandsDir);

      await fs.writeFile(path.join(commandsDir, 'zebra.md'), '---\ndescription: Z\n---\nContent');
      await fs.writeFile(path.join(commandsDir, 'alpha.md'), '---\ndescription: A\n---\nContent');

      const sort: CommandSortOptions = { field: 'name', direction: 'asc' };
      const commands = await commandsService.listAllCommands(undefined, sort);

      expect(commands).toHaveLength(2);
      expect(commands[0].name).toBe('alpha');
      expect(commands[1].name).toBe('zebra');
    });

    it('should parse metadata comments from imported commands', async () => {
      const commandsDir = path.join(testUserDir, 'commands');
      await fs.ensureDir(commandsDir);

      // Metadata comment comes AFTER the content
      const commandContent = `---
description: Imported command
---

Content

<!--
metadata:
source: github
url: https://github.com/test/repo
author: test
repo: repo
trust-level: curated
imported: 2024-01-01T00:00:00.000Z
trust-score: 85
edited: false
-->`;

      await fs.writeFile(path.join(commandsDir, 'imported.md'), commandContent);

      const commands = await commandsService.listAllCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0].metadata).toBeDefined();
      expect(commands[0].metadata?.source.type).toBe('github');
      expect(commands[0].metadata?.source.author).toBe('test');
      expect(commands[0].metadata?.trustScoreAtImport).toBe(85);
    });
  });

  describe('getCommand', () => {
    it('should get command by file path', async () => {
      const commandsDir = path.join(testUserDir, 'commands');
      await fs.ensureDir(commandsDir);

      const filePath = path.join(commandsDir, 'test.md');
      const commandContent = `---
description: Test command
model: sonnet
---

Test content`;

      await fs.writeFile(filePath, commandContent);

      const command = await commandsService.getCommand(filePath);
      expect(command.name).toBe('test');
      expect(command.frontmatter.description).toBe('Test command');
      expect(command.frontmatter.model).toBe('sonnet');
      expect(command.content).toBe('Test content');
    });

    it('should throw error for non-existent command', async () => {
      const filePath = path.join(testUserDir, 'commands', 'nonexistent.md');
      await expect(commandsService.getCommand(filePath)).rejects.toThrow();
    });
  });

  describe('createCommand', () => {
    it('should create user command', async () => {
      const frontmatter: CommandFrontmatter = {
        description: 'New command',
        'argument-hint': '[arg]',
      };

      const options: CommandCreateOptions = {
        name: 'new-cmd',
        location: 'user',
        frontmatter,
        content: 'New content',
      };

      const filePath = await commandsService.createCommand(options);

      expect(filePath).toMatch(/commands[\\/]new-cmd\.md$/);
      expect(await fs.pathExists(filePath)).toBe(true);

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('description: New command');
      expect(content).toContain('argument-hint: "[arg]"');
      expect(content).toContain('New content');
    });

    it('should create command with namespace', async () => {
      const frontmatter: CommandFrontmatter = {
        description: 'Git command',
      };

      const options: CommandCreateOptions = {
        name: 'git-status',
        location: 'user',
        namespace: 'git',
        frontmatter,
        content: 'Git status content',
      };

      const filePath = await commandsService.createCommand(options);

      expect(filePath).toMatch(/commands[\\/]git[\\/]git-status\.md$/);
      expect(await fs.pathExists(filePath)).toBe(true);
    });

    it('should throw error when command already exists', async () => {
      const commandsDir = path.join(testUserDir, 'commands');
      await fs.ensureDir(commandsDir);
      await fs.writeFile(
        path.join(commandsDir, 'existing.md'),
        '---\ndescription: Existing\n---\nContent'
      );

      const frontmatter: CommandFrontmatter = {
        description: 'New',
      };

      const options: CommandCreateOptions = {
        name: 'existing',
        location: 'user',
        frontmatter,
        content: 'Content',
      };

      await expect(commandsService.createCommand(options)).rejects.toThrow(/already exists/);
    });

    it('should create project command', async () => {
      const frontmatter: CommandFrontmatter = {
        description: 'Project command',
      };

      const options: CommandCreateOptions = {
        name: 'proj-cmd',
        location: 'project',
        projectPath: testProjectDir,
        frontmatter,
        content: 'Project content',
      };

      const filePath = await commandsService.createCommand(options);

      expect(filePath).toContain(testProjectDir);
      expect(await fs.pathExists(filePath)).toBe(true);
    });
  });

  describe('updateCommand', () => {
    it('should update command frontmatter', async () => {
      const commandsDir = path.join(testUserDir, 'commands');
      await fs.ensureDir(commandsDir);

      const filePath = path.join(commandsDir, 'test.md');
      await fs.writeFile(filePath, '---\ndescription: Old description\n---\nOriginal content');

      const newFrontmatter: CommandFrontmatter = {
        description: 'New description',
        model: 'haiku',
      };

      const options: CommandUpdateOptions = {
        filePath,
        frontmatter: newFrontmatter,
      };

      await commandsService.updateCommand(options);

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('description: New description');
      expect(content).toContain('model: haiku');
      expect(content).toContain('Original content');
    });

    it('should update command content', async () => {
      const commandsDir = path.join(testUserDir, 'commands');
      await fs.ensureDir(commandsDir);

      const filePath = path.join(commandsDir, 'test.md');
      await fs.writeFile(filePath, '---\ndescription: Test\n---\nOld content');

      const options: CommandUpdateOptions = {
        filePath,
        content: 'New content',
      };

      await commandsService.updateCommand(options);

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('New content');
      expect(content).not.toContain('Old content');
    });

    it('should move command to different namespace', async () => {
      const commandsDir = path.join(testUserDir, 'commands');
      await fs.ensureDir(commandsDir);

      const oldPath = path.join(commandsDir, 'test.md');
      await fs.writeFile(oldPath, '---\ndescription: Test\n---\nContent');

      const options: CommandUpdateOptions = {
        filePath: oldPath,
        namespace: 'workflows',
      };

      await commandsService.updateCommand(options);

      const newPath = path.join(commandsDir, 'workflows', 'test.md');
      expect(await fs.pathExists(newPath)).toBe(true);
      expect(await fs.pathExists(oldPath)).toBe(false);
    });

    it('should throw error for non-existent command', async () => {
      const filePath = path.join(testUserDir, 'commands', 'nonexistent.md');

      const options: CommandUpdateOptions = {
        filePath,
        content: 'New content',
      };

      await expect(commandsService.updateCommand(options)).rejects.toThrow();
    });
  });

  describe('deleteCommand', () => {
    it('should delete user command', async () => {
      const commandsDir = path.join(testUserDir, 'commands');
      await fs.ensureDir(commandsDir);

      const filePath = path.join(commandsDir, 'test.md');
      await fs.writeFile(filePath, '---\ndescription: Test\n---\nContent');

      const options: CommandDeleteOptions = {
        filePath,
        location: 'user',
      };

      await commandsService.deleteCommand(options);

      expect(await fs.pathExists(filePath)).toBe(false);
    });

    it('should delete project command', async () => {
      const commandsDir = path.join(testProjectDir, 'commands');
      await fs.ensureDir(commandsDir);

      const filePath = path.join(commandsDir, 'test.md');
      await fs.writeFile(filePath, '---\ndescription: Test\n---\nContent');

      const options: CommandDeleteOptions = {
        filePath,
        location: 'project',
      };

      await commandsService.deleteCommand(options);

      expect(await fs.pathExists(filePath)).toBe(false);
    });

    it('should throw error for non-existent command', async () => {
      const filePath = path.join(testUserDir, 'commands', 'nonexistent.md');

      const options: CommandDeleteOptions = {
        filePath,
        location: 'user',
      };

      await expect(commandsService.deleteCommand(options)).rejects.toThrow();
    });
  });

  describe('moveCommand', () => {
    it('should move command to namespace', async () => {
      const commandsDir = path.join(testUserDir, 'commands');
      await fs.ensureDir(commandsDir);

      const oldPath = path.join(commandsDir, 'test.md');
      await fs.writeFile(oldPath, '---\ndescription: Test\n---\nContent');

      const options: CommandMoveOptions = {
        filePath: oldPath,
        newNamespace: 'git',
      };

      const newPath = await commandsService.moveCommand(options);

      expect(newPath).toMatch(/commands[\\/]git[\\/]test\.md$/);
      expect(await fs.pathExists(newPath)).toBe(true);
      expect(await fs.pathExists(oldPath)).toBe(false);
    });

    it('should move command from namespace to root', async () => {
      const commandsDir = path.join(testUserDir, 'commands');
      const gitDir = path.join(commandsDir, 'git');
      await fs.ensureDir(gitDir);

      const oldPath = path.join(gitDir, 'test.md');
      await fs.writeFile(oldPath, '---\ndescription: Test\n---\nContent');

      const options: CommandMoveOptions = {
        filePath: oldPath,
        newNamespace: undefined,
      };

      const newPath = await commandsService.moveCommand(options);

      expect(newPath).toMatch(/commands[\\/]test\.md$/);
      expect(newPath).not.toContain('git');
      expect(await fs.pathExists(newPath)).toBe(true);
      expect(await fs.pathExists(oldPath)).toBe(false);
    });

    it('should throw error for non-existent command', async () => {
      const filePath = path.join(testUserDir, 'commands', 'nonexistent.md');

      const options: CommandMoveOptions = {
        filePath,
        newNamespace: 'git',
      };

      await expect(commandsService.moveCommand(options)).rejects.toThrow();
    });

    it('should throw error when target already exists', async () => {
      const commandsDir = path.join(testUserDir, 'commands');
      const gitDir = path.join(commandsDir, 'git');
      await fs.ensureDir(commandsDir);
      await fs.ensureDir(gitDir);

      const sourcePath = path.join(commandsDir, 'test.md');
      const targetPath = path.join(gitDir, 'test.md');

      await fs.writeFile(sourcePath, '---\ndescription: Source\n---\nContent');
      await fs.writeFile(targetPath, '---\ndescription: Target\n---\nContent');

      const options: CommandMoveOptions = {
        filePath: sourcePath,
        newNamespace: 'git',
      };

      await expect(commandsService.moveCommand(options)).rejects.toThrow(/already exists/);
    });
  });
});
