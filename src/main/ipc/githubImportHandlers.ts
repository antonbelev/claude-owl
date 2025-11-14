/**
 * GitHub Import IPC Handlers
 * Handles all GitHub import operations: discovery, security scanning, auto-fixing, and importing
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/types/ipc.common.types';
import type {
  ScanCommandSecurityRequest,
  ScanCommandSecurityResponse,
  AutoFixCommandRequest,
  AutoFixCommandResponse,
  ImportGitHubCommandsRequest,
  ImportGitHubCommandsResponse,
} from '../../shared/types/ipc.agents.types';
import { GitHubService } from '../services/GitHubService';
import { SecurityScanner } from '../services/SecurityScanner';
import { AutoFixEngine } from '../services/AutoFixEngine';
import { CommandsService } from '../services/CommandsService';

const commandsService = new CommandsService();

/**
 * Register all GitHub import IPC handlers
 */
export function registerGitHubImportHandlers() {
  console.log('[GitHubImportHandlers] Registering handlers...');

  // New lazy loading navigation handlers
  ipcMain.handle(IPC_CHANNELS.GITHUB_BROWSE_URL, handleBrowseUrl);
  ipcMain.handle(IPC_CHANNELS.GITHUB_NAVIGATE_FOLDER, handleNavigateFolder);

  // Existing handlers
  ipcMain.handle(IPC_CHANNELS.FETCH_GITHUB_FILES, handleFetchGitHubFiles);
  ipcMain.handle(IPC_CHANNELS.SCAN_COMMAND_SECURITY, handleScanCommandSecurity);
  ipcMain.handle(IPC_CHANNELS.AUTO_FIX_COMMAND, handleAutoFixCommand);
  ipcMain.handle(IPC_CHANNELS.IMPORT_GITHUB_COMMANDS, handleImportGitHubCommands);

  console.log('[GitHubImportHandlers] Handlers registered');
}

/**
 * Handler: Browse from GitHub URL (initial entry point)
 */
async function handleBrowseUrl(_: Electron.IpcMainInvokeEvent, request: unknown): Promise<unknown> {
  console.log('[GitHubImportHandlers] Browse from URL:', request);

  try {
    const { repoUrl } = request as { repoUrl: string };

    if (!repoUrl) {
      return {
        success: false,
        error: 'Repository URL is required',
      };
    }

    const folderContents = await GitHubService.browseFromUrl(repoUrl);

    if (!folderContents) {
      return {
        success: false,
        error: 'Failed to browse repository. Check the URL and try again.',
      };
    }

    console.log('[GitHubImportHandlers] Browse result:', {
      owner: folderContents.owner,
      repo: folderContents.repo,
      currentPath: folderContents.currentPath,
      fileCount: folderContents.files.length,
      mdFileCount: folderContents.mdFileCount,
    });

    return {
      success: true,
      data: folderContents,
    };
  } catch (error) {
    console.error('[GitHubImportHandlers] Error browsing URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to browse repository',
    };
  }
}

/**
 * Handler: Navigate to a specific folder
 */
async function handleNavigateFolder(
  _: Electron.IpcMainInvokeEvent,
  request: unknown
): Promise<unknown> {
  console.log('[GitHubImportHandlers] Navigate to folder:', request);

  try {
    const { owner, repo, branch, folderPath } = request as {
      owner: string;
      repo: string;
      branch: string;
      folderPath: string;
    };

    if (!owner || !repo || !branch || folderPath === undefined) {
      return {
        success: false,
        error: 'Owner, repo, branch, and folder path are required',
      };
    }

    const folderContents = await GitHubService.navigateToFolder(owner, repo, branch, folderPath);

    if (!folderContents) {
      return {
        success: false,
        error: 'Failed to navigate to folder. Path may not exist.',
      };
    }

    console.log('[GitHubImportHandlers] Navigate result:', {
      currentPath: folderContents.currentPath,
      fileCount: folderContents.files.length,
      mdFileCount: folderContents.mdFileCount,
    });

    return {
      success: true,
      data: folderContents,
    };
  } catch (error) {
    console.error('[GitHubImportHandlers] Error navigating to folder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to navigate to folder',
    };
  }
}

/**
 * Handler: Fetch specific files from GitHub
 */
async function handleFetchGitHubFiles(
  _: Electron.IpcMainInvokeEvent,
  request: unknown
): Promise<unknown> {
  console.log('[GitHubImportHandlers] Fetch GitHub files:', request);

  try {
    const { repoUrl, filePaths } = request as { repoUrl: string; filePaths: string[] };

    if (!repoUrl || !filePaths || !Array.isArray(filePaths)) {
      return {
        success: false,
        error: 'Repository URL and file paths are required',
      };
    }

    const commands = await GitHubService.fetchFiles(repoUrl, filePaths);

    console.log('[GitHubImportHandlers] Fetched files:', {
      count: commands.length,
      commands: commands.map(c => c.name),
    });

    return {
      success: true,
      data: commands,
    };
  } catch (error) {
    console.error('[GitHubImportHandlers] Error fetching files:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch files',
    };
  }
}

/**
 * Handler: Scan commands for security issues
 */
async function handleScanCommandSecurity(
  _: Electron.IpcMainInvokeEvent,
  request: ScanCommandSecurityRequest
): Promise<ScanCommandSecurityResponse> {
  console.log('[GitHubImportHandlers] Scanning command security:', {
    count: request.commands.length,
    repoUrl: request.repoUrl,
  });

  try {
    const results = request.commands.map(cmd =>
      SecurityScanner.scanCommand(cmd.name, cmd.content, request.repoUrl)
    );

    console.log('[GitHubImportHandlers] Security scan complete:', {
      total: results.length,
      trusted: results.filter(r => r.trustLevel === 'trusted').length,
      curated: results.filter(r => r.trustLevel === 'curated').length,
      unknown: results.filter(r => r.trustLevel === 'unknown').length,
      dangerous: results.filter(r => r.trustLevel === 'dangerous').length,
    });

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    console.error('[GitHubImportHandlers] Error scanning security:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scan command security',
    };
  }
}

/**
 * Handler: Auto-fix a command
 */
async function handleAutoFixCommand(
  _: Electron.IpcMainInvokeEvent,
  request: AutoFixCommandRequest
): Promise<AutoFixCommandResponse> {
  console.log('[GitHubImportHandlers] Auto-fixing command:', request.commandName);

  try {
    const result = AutoFixEngine.fixCommand(request.commandName, request.content);

    console.log('[GitHubImportHandlers] Auto-fix complete:', {
      commandName: result.commandName,
      changesApplied: result.changesApplied.length,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[GitHubImportHandlers] Error auto-fixing command:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to auto-fix command',
    };
  }
}

/**
 * Handler: Import commands from GitHub
 */
async function handleImportGitHubCommands(
  _: Electron.IpcMainInvokeEvent,
  request: ImportGitHubCommandsRequest
): Promise<ImportGitHubCommandsResponse> {
  console.log('[GitHubImportHandlers] Importing GitHub commands:', {
    count: request.commands.length,
    location: request.location,
    repoUrl: request.repoUrl,
  });

  try {
    const imported: string[] = [];
    const failed: Array<{ name: string; reason: string }> = [];

    // Import each command
    for (const cmd of request.commands) {
      try {
        console.log('[GitHubImportHandlers] Saving command:', cmd.name);

        // Normalize command name (lowercase, hyphens only)
        const normalizedName = cmd.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

        // Add import metadata to frontmatter
        const contentWithMetadata = addImportMetadata(cmd.content, request.repoUrl);

        // Save the command using commandsService instance
        const filePath = await commandsService.createCommand({
          name: normalizedName,
          location: request.location,
          content: contentWithMetadata,
          frontmatter: {
            description: `Imported from ${request.repoUrl}`,
          },
        });

        imported.push(normalizedName);
        console.log('[GitHubImportHandlers] Command saved:', normalizedName, 'at', filePath);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error';
        failed.push({ name: cmd.name, reason });
        console.error('[GitHubImportHandlers] Failed to save command:', cmd.name, reason);
      }
    }

    console.log('[GitHubImportHandlers] Import complete:', {
      imported: imported.length,
      failed: failed.length,
    });

    return {
      success: true,
      data: {
        imported,
        failed,
      },
    };
  } catch (error) {
    console.error('[GitHubImportHandlers] Error importing commands:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import commands',
    };
  }
}

/**
 * Add import metadata to command content
 */
function addImportMetadata(content: string, repoUrl: string): string {
  // If content already has frontmatter, add to it
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (frontmatterMatch) {
    // Content has frontmatter, add importedFrom
    const frontmatter = frontmatterMatch[1];
    const updatedFrontmatter =
      frontmatter + `\nimportedFrom: "${repoUrl}"\nimportedAt: "${new Date().toISOString()}"`;
    return content.replace(/^---\n[\s\S]*?\n---/, `---\n${updatedFrontmatter}\n---`);
  } else {
    // No frontmatter, add one
    const now = new Date().toISOString();
    const metadata = `---\nimportedFrom: "${repoUrl}"\nimportedAt: "${now}"\n---\n`;
    return metadata + content;
  }
}
