import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { FileSystemService } from '@/main/services/core/FileSystemService';
import { MOCK_FULL_MARKDOWN, MOCK_JSON_DATA } from '../../fixtures/coreServicesFixtures';

describe('FileSystemService', () => {
  let fileSystemService: FileSystemService;
  let testDir: string;

  beforeEach(async () => {
    fileSystemService = new FileSystemService();
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `claude-test-${Date.now()}`);
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  describe('readJSON', () => {
    it('should read and parse valid JSON file', async () => {
      const filePath = path.join(testDir, 'test.json');
      await fs.writeJSON(filePath, MOCK_JSON_DATA);

      const result = await fileSystemService.readJSON(filePath);
      expect(result).toEqual(MOCK_JSON_DATA);
    });

    it('should throw error for non-existent file', async () => {
      const filePath = path.join(testDir, 'nonexistent.json');
      await expect(fileSystemService.readJSON(filePath)).rejects.toThrow();
    });

    it('should throw error for invalid JSON', async () => {
      const filePath = path.join(testDir, 'invalid.json');
      await fs.writeFile(filePath, '{invalid json}');

      await expect(fileSystemService.readJSON(filePath)).rejects.toThrow();
    });
  });

  describe('writeJSON', () => {
    it('should write JSON data to file', async () => {
      const filePath = path.join(testDir, 'output.json');
      await fileSystemService.writeJSON(filePath, MOCK_JSON_DATA);

      const content = await fs.readJSON(filePath);
      expect(content).toEqual(MOCK_JSON_DATA);
    });

    it('should create directory if it does not exist', async () => {
      const filePath = path.join(testDir, 'nested', 'dir', 'output.json');
      await fileSystemService.writeJSON(filePath, MOCK_JSON_DATA);

      const content = await fs.readJSON(filePath);
      expect(content).toEqual(MOCK_JSON_DATA);
    });

    it('should format JSON with indentation when specified', async () => {
      const filePath = path.join(testDir, 'formatted.json');
      await fileSystemService.writeJSON(filePath, MOCK_JSON_DATA, { pretty: true });

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('\n');
      expect(content).toContain('  ');
    });
  });

  describe('readText', () => {
    it('should read text file content', async () => {
      const filePath = path.join(testDir, 'test.txt');
      const content = 'Hello, World!';
      await fs.writeFile(filePath, content);

      const result = await fileSystemService.readText(filePath);
      expect(result).toBe(content);
    });

    it('should throw error for non-existent file', async () => {
      const filePath = path.join(testDir, 'nonexistent.txt');
      await expect(fileSystemService.readText(filePath)).rejects.toThrow();
    });
  });

  describe('writeText', () => {
    it('should write text content to file', async () => {
      const filePath = path.join(testDir, 'output.txt');
      const content = 'Test content';
      await fileSystemService.writeText(filePath, content);

      const result = await fs.readFile(filePath, 'utf-8');
      expect(result).toBe(content);
    });

    it('should overwrite existing file', async () => {
      const filePath = path.join(testDir, 'test.txt');
      await fs.writeFile(filePath, 'original');

      await fileSystemService.writeText(filePath, 'updated');

      const result = await fs.readFile(filePath, 'utf-8');
      expect(result).toBe('updated');
    });
  });

  describe('readMarkdownWithFrontmatter', () => {
    it('should parse markdown with YAML frontmatter', async () => {
      const filePath = path.join(testDir, 'test.md');
      await fs.writeFile(filePath, MOCK_FULL_MARKDOWN);

      const result = await fileSystemService.readMarkdownWithFrontmatter(filePath);
      expect(result.frontmatter).toEqual({
        name: 'Test Skill',
        description: 'A test skill for testing',
        version: '1.0.0',
      });
      expect(result.content).toContain('# Test Skill');
    });

    it('should throw error when frontmatter delimiters are missing', async () => {
      const filePath = path.join(testDir, 'test.md');
      const content = '# Heading\n\nSome content';
      await fs.writeFile(filePath, content);

      await expect(fileSystemService.readMarkdownWithFrontmatter(filePath)).rejects.toThrow(
        'Invalid markdown format: missing frontmatter delimiters'
      );
    });

    it('should throw error for non-existent file', async () => {
      const filePath = path.join(testDir, 'nonexistent.md');
      await expect(fileSystemService.readMarkdownWithFrontmatter(filePath)).rejects.toThrow();
    });
  });

  describe('writeMarkdownWithFrontmatter', () => {
    it('should write markdown with YAML frontmatter', async () => {
      const filePath = path.join(testDir, 'output.md');
      const frontmatter = {
        name: 'Test',
        version: '1.0.0',
      };
      const content = '# Test\n\nContent here';

      await fileSystemService.writeMarkdownWithFrontmatter(filePath, frontmatter, content);

      const result = await fs.readFile(filePath, 'utf-8');
      expect(result).toContain('---');
      expect(result).toContain('name: Test');
      expect(result).toContain('version: 1.0.0');
      expect(result).toContain('# Test');
      expect(result).toContain('Content here');
    });

    it('should handle empty frontmatter', async () => {
      const filePath = path.join(testDir, 'output.md');
      const content = '# Test\n\nContent';

      await fileSystemService.writeMarkdownWithFrontmatter(filePath, {}, content);

      const result = await fs.readFile(filePath, 'utf-8');
      expect(result).toContain('# Test');
      expect(result).toContain('Content');
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = path.join(testDir, 'test.txt');
      await fs.writeFile(filePath, 'content');

      const result = await fileSystemService.fileExists(filePath);
      expect(result).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const filePath = path.join(testDir, 'nonexistent.txt');
      const result = await fileSystemService.fileExists(filePath);
      expect(result).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return file stats', async () => {
      const filePath = path.join(testDir, 'test.txt');
      const content = 'test content';
      await fs.writeFile(filePath, content);

      const stats = await fileSystemService.getStats(filePath);
      expect(stats.size).toBe(content.length);
      expect(stats.isFile).toBe(true);
      expect(stats.isDirectory).toBe(false);
    });

    it('should return directory stats', async () => {
      const stats = await fileSystemService.getStats(testDir);
      expect(stats.isDirectory).toBe(true);
      expect(stats.isFile).toBe(false);
    });

    it('should throw error for non-existent file', async () => {
      const filePath = path.join(testDir, 'nonexistent.txt');
      await expect(fileSystemService.getStats(filePath)).rejects.toThrow();
    });
  });

  describe('ensureDirectory', () => {
    it('should create directory if it does not exist', async () => {
      const dirPath = path.join(testDir, 'newdir');
      await fileSystemService.ensureDirectory(dirPath);

      const exists = await fs.pathExists(dirPath);
      expect(exists).toBe(true);
    });

    it('should not fail if directory already exists', async () => {
      const dirPath = path.join(testDir, 'existing');
      await fs.ensureDir(dirPath);

      await expect(fileSystemService.ensureDirectory(dirPath)).resolves.not.toThrow();
    });

    it('should create nested directories', async () => {
      const dirPath = path.join(testDir, 'nested', 'deep', 'dir');
      await fileSystemService.ensureDirectory(dirPath);

      const exists = await fs.pathExists(dirPath);
      expect(exists).toBe(true);
    });
  });

  describe('listDirectory', () => {
    it('should list directory contents', async () => {
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(testDir, 'file2.txt'), 'content2');
      await fs.ensureDir(path.join(testDir, 'subdir'));

      const contents = await fileSystemService.listDirectory(testDir);
      expect(contents).toContain('file1.txt');
      expect(contents).toContain('file2.txt');
      expect(contents).toContain('subdir');
    });

    it('should return empty array for empty directory', async () => {
      const contents = await fileSystemService.listDirectory(testDir);
      expect(contents).toEqual([]);
    });

    it('should throw error for non-existent directory', async () => {
      const dirPath = path.join(testDir, 'nonexistent');
      await expect(fileSystemService.listDirectory(dirPath)).rejects.toThrow();
    });
  });

  describe('deleteFile', () => {
    it('should delete existing file', async () => {
      const filePath = path.join(testDir, 'test.txt');
      await fs.writeFile(filePath, 'content');

      await fileSystemService.deleteFile(filePath);

      const exists = await fs.pathExists(filePath);
      expect(exists).toBe(false);
    });

    it('should throw error for non-existent file', async () => {
      const filePath = path.join(testDir, 'nonexistent.txt');
      await expect(fileSystemService.deleteFile(filePath)).rejects.toThrow();
    });
  });

  describe('deleteDirectory', () => {
    it('should delete empty directory', async () => {
      const dirPath = path.join(testDir, 'empty');
      await fs.ensureDir(dirPath);

      await fileSystemService.deleteDirectory(dirPath);

      const exists = await fs.pathExists(dirPath);
      expect(exists).toBe(false);
    });

    it('should throw error for non-empty directory', async () => {
      const dirPath = path.join(testDir, 'nonempty');
      await fs.ensureDir(dirPath);
      await fs.writeFile(path.join(dirPath, 'file.txt'), 'content');

      await expect(fileSystemService.deleteDirectory(dirPath)).rejects.toThrow();
    });

    it('should throw error for non-existent directory', async () => {
      const dirPath = path.join(testDir, 'nonexistent');
      await expect(fileSystemService.deleteDirectory(dirPath)).rejects.toThrow();
    });
  });
});
