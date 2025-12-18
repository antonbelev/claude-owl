/**
 * IPC handlers for file browser operations
 */

import { ipcMain } from 'electron';
import { FileBrowserService } from '../services/FileBrowserService';
import type {
  ReadDirectoryRequest,
  ReadFileContentRequest,
} from '@/shared/types/ipc.filebrowser.types';
import { FILEBROWSER_CHANNELS } from '@/shared/types/ipc.filebrowser.types';
import * as os from 'os';
import * as path from 'path';

const fileBrowserService = new FileBrowserService();

// Security: Define allowed base paths
const ALLOWED_BASE_PATHS = [
  path.join(os.homedir(), '.claude'),
  // Add more allowed paths if needed in the future
];

/**
 * Check if path is within allowed directories
 */
function isPathAllowed(targetPath: string): boolean {
  return ALLOWED_BASE_PATHS.some(basePath =>
    fileBrowserService.isPathAllowed(targetPath, basePath)
  );
}

export function registerFileBrowserHandlers(): void {
  console.log('[FileBrowserHandlers] Registering file browser IPC handlers');

  // Read directory structure
  ipcMain.handle(
    FILEBROWSER_CHANNELS.READ_DIRECTORY,
    async (_, request: ReadDirectoryRequest) => {
      console.log('[FileBrowserHandlers] READ_DIRECTORY request:', request);

      try {
        // Security check
        if (!isPathAllowed(request.path)) {
          console.error('[FileBrowserHandlers] Path not allowed:', request.path);
          return {
            success: false,
            error: 'Access denied: Path is outside allowed directories',
          };
        }

        const nodes = await fileBrowserService.readDirectory(
          request.path,
          request.maxDepth || 3
        );

        console.log('[FileBrowserHandlers] READ_DIRECTORY success:', { count: nodes.length });
        return { success: true, data: nodes };
      } catch (error) {
        console.error('[FileBrowserHandlers] READ_DIRECTORY failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to read directory',
        };
      }
    }
  );

  // Read file content
  ipcMain.handle(
    FILEBROWSER_CHANNELS.READ_FILE_CONTENT,
    async (_, request: ReadFileContentRequest) => {
      console.log('[FileBrowserHandlers] READ_FILE_CONTENT request:', request.path);

      try {
        // Security check
        if (!isPathAllowed(request.path)) {
          console.error('[FileBrowserHandlers] Path not allowed:', request.path);
          return {
            success: false,
            error: 'Access denied: Path is outside allowed directories',
          };
        }

        const content = await fileBrowserService.readFileContent(
          request.path,
          request.maxSize || 1024 * 1024 // 1MB default
        );

        console.log('[FileBrowserHandlers] READ_FILE_CONTENT success:', {
          path: request.path,
          size: content.size,
        });
        return { success: true, data: content };
      } catch (error) {
        console.error('[FileBrowserHandlers] READ_FILE_CONTENT failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to read file',
        };
      }
    }
  );
}
