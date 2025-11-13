import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitHubService } from '../../../src/main/services/GitHubService';

describe('GitHubService', () => {
  describe('parseGitHubUrl', () => {
    it('should parse repo root URL', () => {
      const result = GitHubService.parseGitHubUrl('https://github.com/owner/repo');

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
      });
    });

    it('should parse repo root URL with .git extension', () => {
      const result = GitHubService.parseGitHubUrl('https://github.com/owner/repo.git');

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
      });
    });

    it('should parse folder URL with tree', () => {
      const result = GitHubService.parseGitHubUrl(
        'https://github.com/owner/repo/tree/main/tools'
      );

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
        path: 'tools',
      });
    });

    it('should parse folder URL with custom branch', () => {
      const result = GitHubService.parseGitHubUrl(
        'https://github.com/owner/repo/tree/develop/src/commands'
      );

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        branch: 'develop',
        path: 'src/commands',
      });
    });

    it('should parse nested folder URL', () => {
      const result = GitHubService.parseGitHubUrl(
        'https://github.com/owner/repo/tree/main/path/to/folder'
      );

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
        path: 'path/to/folder',
      });
    });

    it('should parse single file URL (blob)', () => {
      const result = GitHubService.parseGitHubUrl(
        'https://github.com/owner/repo/blob/main/tools/help.md'
      );

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
        path: 'tools',
        preSelectedFile: 'tools/help.md',
      });
    });

    it('should parse single file URL in repo root', () => {
      const result = GitHubService.parseGitHubUrl(
        'https://github.com/owner/repo/blob/main/README.md'
      );

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
        preSelectedFile: 'README.md',
      });
    });

    it('should parse single file URL with custom branch', () => {
      const result = GitHubService.parseGitHubUrl(
        'https://github.com/owner/repo/blob/develop/tools/command.md'
      );

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        branch: 'develop',
        path: 'tools',
        preSelectedFile: 'tools/command.md',
      });
    });

    it('should handle owner and repo with special characters', () => {
      const result = GitHubService.parseGitHubUrl(
        'https://github.com/my-org/my.repo_name/tree/main/folder'
      );

      expect(result).toEqual({
        owner: 'my-org',
        repo: 'my.repo_name',
        branch: 'main',
        path: 'folder',
      });
    });

    it('should return null for non-GitHub URLs', () => {
      expect(GitHubService.parseGitHubUrl('https://gitlab.com/owner/repo')).toBeNull();
      expect(GitHubService.parseGitHubUrl('https://bitbucket.org/owner/repo')).toBeNull();
      expect(GitHubService.parseGitHubUrl('not-a-url')).toBeNull();
    });

    it('should return null for invalid GitHub URLs', () => {
      expect(GitHubService.parseGitHubUrl('https://github.com')).toBeNull();
      expect(GitHubService.parseGitHubUrl('https://github.com/owner')).toBeNull();
    });

    it('should only pre-select .md files', () => {
      const result = GitHubService.parseGitHubUrl(
        'https://github.com/owner/repo/blob/main/tools/script.js'
      );

      // Should not have preSelectedFile for non-.md files
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
        path: 'tools/script.js',
      });
    });
  });

  describe('navigateToFolder', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch folder contents successfully', async () => {
      const mockResponse = [
        { name: 'folder1', path: 'folder1', type: 'dir', size: 0, sha: 'abc123' },
        { name: 'command.md', path: 'command.md', type: 'file', size: 1024, sha: 'def456' },
        { name: 'README.md', path: 'README.md', type: 'file', size: 2048, sha: 'ghi789' },
      ];

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await GitHubService.navigateToFolder('owner', 'repo', 'main', '');

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
        currentPath: '',
        parentPath: null,
        files: [
          {
            name: 'folder1',
            path: 'folder1',
            type: 'dir',
            size: 0,
            sha: 'abc123',
            hasMdFiles: true,
          },
          { name: 'command.md', path: 'command.md', type: 'file', size: 1024, sha: 'def456' },
          { name: 'README.md', path: 'README.md', type: 'file', size: 2048, sha: 'ghi789' },
        ],
        mdFileCount: 2,
      });
    });

    it('should calculate parent path correctly', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);

      const result = await GitHubService.navigateToFolder('owner', 'repo', 'main', 'path/to/folder');

      expect(result?.parentPath).toBe('path/to');
    });

    it('should handle root folder (no parent)', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);

      const result = await GitHubService.navigateToFolder('owner', 'repo', 'main', '');

      expect(result?.parentPath).toBeNull();
    });

    it('should filter out non-.md files', async () => {
      const mockResponse = [
        { name: 'command.md', path: 'command.md', type: 'file', size: 1024, sha: 'abc123' },
        { name: 'README.txt', path: 'README.txt', type: 'file', size: 512, sha: 'def456' },
        { name: 'script.js', path: 'script.js', type: 'file', size: 2048, sha: 'ghi789' },
      ];

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await GitHubService.navigateToFolder('owner', 'repo', 'main', '');

      expect(result?.files).toHaveLength(1);
      expect(result?.mdFileCount).toBe(1);
      expect(result?.files[0].name).toBe('command.md');
    });

    it('should return null for 404 errors', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await GitHubService.navigateToFolder('owner', 'repo', 'main', 'nonexistent');

      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      fetchSpy.mockRejectedValueOnce(new Error('Network error'));

      const result = await GitHubService.navigateToFolder('owner', 'repo', 'main', '');

      expect(result).toBeNull();
    });

    it('should include preSelectedFile when provided', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);

      const result = await GitHubService.navigateToFolder(
        'owner',
        'repo',
        'main',
        'tools',
        'tools/help.md'
      );

      expect(result?.preSelectedFile).toBe('tools/help.md');
    });

    it('should use correct branch in API URL', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);

      await GitHubService.navigateToFolder('owner', 'repo', 'develop', 'src');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('?ref=develop')
      );
    });
  });

  describe('browseFromUrl', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should navigate to repo root for repo URL', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);

      const result = await GitHubService.browseFromUrl('https://github.com/owner/repo');

      expect(result?.currentPath).toBe('');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/repos/owner/repo/contents/?ref=main')
      );
    });

    it('should navigate to specific folder for tree URL', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);

      const result = await GitHubService.browseFromUrl(
        'https://github.com/owner/repo/tree/main/tools'
      );

      expect(result?.currentPath).toBe('tools');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/repos/owner/repo/contents/tools?ref=main')
      );
    });

    it('should navigate to parent folder and pre-select file for blob URL', async () => {
      const mockResponse = [
        { name: 'help.md', path: 'tools/help.md', type: 'file', size: 1024, sha: 'abc123' },
      ];

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await GitHubService.browseFromUrl(
        'https://github.com/owner/repo/blob/main/tools/help.md'
      );

      expect(result?.currentPath).toBe('tools');
      expect(result?.preSelectedFile).toBe('tools/help.md');
    });

    it('should return null for invalid URLs', async () => {
      const result = await GitHubService.browseFromUrl('https://gitlab.com/owner/repo');

      expect(result).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should use custom branch from URL', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);

      await GitHubService.browseFromUrl('https://github.com/owner/repo/tree/develop/src');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('?ref=develop')
      );
    });
  });
});
