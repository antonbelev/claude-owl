/**
 * GitHubService - Refactored for lazy loading navigation
 * Handles browsing GitHub repositories and fetching slash commands
 * Supports: repo root, folders, single files, custom branches
 */

interface GitHubRepoInfo {
  owner: string;
  repo: string;
  branch: string;
  path?: string;
  preSelectedFile?: string; // For single file URLs
}

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  sha?: string;
  hasMdFiles?: boolean; // Approximate: does this folder contain .md files?
}

export interface GitHubFolderContents {
  owner: string;
  repo: string;
  branch: string;
  currentPath: string;
  parentPath: string | null;
  files: GitHubFile[];
  mdFileCount: number; // Count of .md files in current folder only
  preSelectedFile?: string; // If URL pointed to specific file
}

export interface DiscoveredCommand {
  name: string;
  path: string;
  content: string;
  hash: string;
  size: number;
  lastModified: Date;
}

export interface DiscoveryResult {
  found: number;
  commands: DiscoveredCommand[];
  error?: string;
}

export class GitHubService {
  private static readonly GITHUB_API_BASE = 'https://api.github.com';
  private static readonly COMMAND_DIRS = ['.claude/commands', 'commands', 'slash-commands'];

  /**
   * Parse GitHub URL to extract owner, repo, branch, path, and pre-selected file
   * Supports:
   * - https://github.com/owner/repo (repo root)
   * - https://github.com/owner/repo/tree/branch/path (folder)
   * - https://github.com/owner/repo/blob/branch/path/file.md (single file)
   */
  static parseGitHubUrl(url: string): GitHubRepoInfo | null {
    try {
      const urlObj = new URL(url.trim());
      if (urlObj.hostname !== 'github.com') {
        return null;
      }

      const parts = urlObj.pathname.split('/').filter(p => p.length > 0);
      if (parts.length < 2) {
        return null;
      }

      const owner = parts[0] || '';
      const repoWithGit = parts[1] || '';
      const repo = repoWithGit.replace('.git', '');

      let branch = 'main';
      let path: string | undefined;
      let preSelectedFile: string | undefined;

      // Parse tree or blob paths: /tree/branch/path or /blob/branch/path
      if (parts.length >= 4) {
        const type = parts[2]; // 'tree' or 'blob'
        if (type === 'tree' || type === 'blob') {
          branch = parts[3] || 'main';
          // Remaining parts are the path
          if (parts.length > 4) {
            const fullPath = parts.slice(4).join('/');

            // If it's a blob URL (single file), extract parent directory and file name
            if (type === 'blob' && fullPath.endsWith('.md')) {
              const pathParts = fullPath.split('/');
              pathParts.pop(); // Remove file name
              path = pathParts.join('/') || undefined;
              preSelectedFile = fullPath; // Store full path to pre-select
            } else {
              path = fullPath;
            }
          }
        }
      }

      // Build result object conditionally
      const result: GitHubRepoInfo = {
        owner,
        repo,
        branch,
      };

      if (path !== undefined) {
        result.path = path;
      }

      if (preSelectedFile !== undefined) {
        result.preSelectedFile = preSelectedFile;
      }

      return result;
    } catch {
      return null;
    }
  }

  /**
   * Navigate to a specific folder in the repository (lazy loading)
   * Returns folder contents with .md file count and parent path for breadcrumbs
   */
  static async navigateToFolder(
    owner: string,
    repo: string,
    branch: string,
    folderPath: string = '',
    preSelectedFile?: string
  ): Promise<GitHubFolderContents | null> {
    console.log('[GitHubService] Navigating to folder:', {
      owner,
      repo,
      branch,
      folderPath,
      preSelectedFile,
    });

    try {
      const contentsUrl = `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${folderPath}?ref=${branch}`;
      console.log('[GitHubService] Fetching folder contents:', contentsUrl);

      const response = await fetch(contentsUrl);

      if (response.status === 404) {
        console.warn('[GitHubService] Folder not found:', folderPath);
        return null;
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const contents = (await response.json()) as Array<{
        name: string;
        path: string;
        type: string;
        size: number;
        sha: string;
      }>;

      if (!Array.isArray(contents)) {
        console.warn('[GitHubService] Unexpected response format');
        return null;
      }

      // Separate files and folders, count .md files
      const files: GitHubFile[] = [];
      let mdFileCount = 0;

      for (const item of contents) {
        if (item.type === 'dir') {
          // For folders, we'll show approximate indicator (hasMdFiles)
          files.push({
            name: item.name,
            path: item.path,
            type: 'dir',
            size: item.size,
            sha: item.sha,
            hasMdFiles: true, // Approximate - we assume folders might have .md files
          });
        } else if (item.type === 'file' && item.name.endsWith('.md')) {
          files.push({
            name: item.name,
            path: item.path,
            type: 'file',
            size: item.size,
            sha: item.sha,
          });
          mdFileCount++;
        }
      }

      // Calculate parent path for breadcrumbs
      const parentPath =
        folderPath === ''
          ? null
          : folderPath.split('/').slice(0, -1).join('/');

      console.log('[GitHubService] Folder contents loaded:', {
        fileCount: files.length,
        mdFileCount,
        parentPath,
      });

      // Build result object conditionally for exactOptionalPropertyTypes
      const result: GitHubFolderContents = {
        owner,
        repo,
        branch,
        currentPath: folderPath,
        parentPath,
        files,
        mdFileCount,
      };

      if (preSelectedFile !== undefined) {
        result.preSelectedFile = preSelectedFile;
      }

      return result;
    } catch (error) {
      console.error('[GitHubService] Error navigating to folder:', error);
      return null;
    }
  }

  /**
   * Initial browse - parses URL and navigates to starting point
   */
  static async browseFromUrl(repoUrl: string): Promise<GitHubFolderContents | null> {
    console.log('[GitHubService] Browsing from URL:', repoUrl);

    const repoInfo = this.parseGitHubUrl(repoUrl);
    if (!repoInfo) {
      console.error('[GitHubService] Invalid GitHub URL:', repoUrl);
      return null;
    }

    return this.navigateToFolder(
      repoInfo.owner,
      repoInfo.repo,
      repoInfo.branch,
      repoInfo.path || '',
      repoInfo.preSelectedFile
    );
  }

  /**
   * Fetch specific files from GitHub repository
   */
  static async fetchFiles(
    repoUrl: string,
    filePaths: string[]
  ): Promise<DiscoveredCommand[]> {
    console.log('[GitHubService] Fetching files:', {
      repoUrl,
      fileCount: filePaths.length,
    });

    const repoInfo = this.parseGitHubUrl(repoUrl);
    if (!repoInfo) {
      console.error('[GitHubService] Invalid GitHub URL:', repoUrl);
      return [];
    }

    const commands: DiscoveredCommand[] = [];

    for (const filePath of filePaths) {
      try {
        const downloadUrl = `https://raw.githubusercontent.com/${repoInfo.owner}/${repoInfo.repo}/${repoInfo.branch}/${filePath}`;
        const content = await this.fetchFileContent(downloadUrl);

        const fileName = filePath.split('/').pop() || filePath;
        const commandName = fileName.replace('.md', '');

        commands.push({
          name: commandName,
          path: filePath,
          content,
          hash: '',
          size: content.length,
          lastModified: new Date(),
        });

        console.log('[GitHubService] Fetched file:', fileName);
      } catch (error) {
        console.warn('[GitHubService] Failed to fetch file:', filePath, error);
        // Continue with other files
      }
    }

    return commands;
  }

  /**
   * Discover all commands in a GitHub repository
   */
  static async discoverCommands(repoUrl: string): Promise<DiscoveryResult> {
    console.log('[GitHubService] Discovering commands from:', repoUrl);

    const repoInfo = this.parseGitHubUrl(repoUrl);
    if (!repoInfo) {
      console.error('[GitHubService] Invalid GitHub URL:', repoUrl);
      return {
        found: 0,
        commands: [],
        error: 'Invalid GitHub URL format',
      };
    }

    try {
      // Try to find commands in known directories
      for (const commandDir of this.COMMAND_DIRS) {
        console.log(
          `[GitHubService] Checking for commands in: ${repoInfo.owner}/${repoInfo.repo}/${commandDir}`
        );

        const commands = await this.fetchCommandsFromDir(
          repoInfo.owner,
          repoInfo.repo,
          repoInfo.branch,
          commandDir
        );

        if (commands.length > 0) {
          console.log(`[GitHubService] Found ${commands.length} commands in ${commandDir}`);
          return {
            found: commands.length,
            commands,
          };
        }
      }

      console.warn('[GitHubService] No commands directory found in repository');
      return {
        found: 0,
        commands: [],
        error: 'No .claude/commands directory found in repository',
      };
    } catch (error) {
      console.error('[GitHubService] Error discovering commands:', error);
      return {
        found: 0,
        commands: [],
        error: error instanceof Error ? error.message : 'Failed to discover commands',
      };
    }
  }

  /**
   * Fetch commands from a specific directory in the repo
   */
  private static async fetchCommandsFromDir(
    owner: string,
    repo: string,
    branch: string,
    dir: string
  ): Promise<DiscoveredCommand[]> {
    const commands: DiscoveredCommand[] = [];

    try {
      // Get directory contents from GitHub API
      const contentsUrl = `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${dir}?ref=${branch}`;
      console.log('[GitHubService] Fetching from:', contentsUrl);

      const response = await fetch(contentsUrl);

      if (response.status === 404) {
        console.log('[GitHubService] Directory not found:', dir);
        return [];
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const contents = (await response.json()) as Array<{
        name: string;
        path: string;
        type: string;
        download_url: string;
        sha: string;
        size: number;
      }>;

      if (!Array.isArray(contents)) {
        console.warn('[GitHubService] Unexpected response format');
        return [];
      }

      // Filter for .md files (slash commands are markdown files)
      const mdFiles = contents.filter(
        item => item.type === 'file' && item.name.endsWith('.md')
      );

      console.log(
        `[GitHubService] Found ${mdFiles.length} markdown files in ${dir}:`,
        mdFiles.map(f => f.name)
      );

      // Fetch content of each markdown file
      for (const file of mdFiles) {
        try {
          const content = await this.fetchFileContent(file.download_url);
          const commandName = file.name.replace('.md', '');

          commands.push({
            name: commandName,
            path: file.path,
            content,
            hash: file.sha,
            size: file.size,
            lastModified: new Date(), // GitHub API doesn't provide this easily
          });
        } catch (error) {
          console.warn('[GitHubService] Failed to fetch file:', file.name, error);
          // Continue with other files
        }
      }

      return commands;
    } catch (error) {
      console.error('[GitHubService] Error fetching directory:', error);
      throw error;
    }
  }

  /**
   * Fetch raw file content from GitHub
   */
  private static async fetchFileContent(downloadUrl: string): Promise<string> {
    console.log('[GitHubService] Fetching file content from:', downloadUrl);

    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const content = await response.text();
    return content;
  }

  /**
   * Verify that a repository is public and accessible
   */
  static async verifyRepositoryAccess(repoUrl: string): Promise<boolean> {
    console.log('[GitHubService] Verifying repository access:', repoUrl);

    const repoInfo = this.parseGitHubUrl(repoUrl);
    if (!repoInfo) {
      return false;
    }

    try {
      const repoApiUrl = `${this.GITHUB_API_BASE}/repos/${repoInfo.owner}/${repoInfo.repo}`;
      const response = await fetch(repoApiUrl);

      if (response.ok) {
        const repo = (await response.json()) as { private: boolean };
        const isPublic = !repo.private;
        console.log(
          '[GitHubService] Repository is',
          isPublic ? 'public' : 'private'
        );
        return isPublic;
      }

      console.warn('[GitHubService] Failed to verify repository:', response.statusText);
      return false;
    } catch (error) {
      console.error('[GitHubService] Error verifying repository:', error);
      return false;
    }
  }
}
