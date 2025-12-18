/**
 * File Browser IPC type definitions
 */

import type { IPCResponse } from './ipc.common.types';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  children?: FileNode[];
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
  extension: string;
}

/**
 * Request/response types
 */

export interface ReadDirectoryRequest {
  path: string;
  maxDepth?: number; // Default: 3
}

export interface ReadDirectoryResponse extends IPCResponse<FileNode[]> {}

export interface ReadFileContentRequest {
  path: string;
  maxSize?: number; // Default: 1MB
}

export interface ReadFileContentResponse extends IPCResponse<FileContent> {}

/**
 * IPC channels
 */
export const FILEBROWSER_CHANNELS = {
  READ_DIRECTORY: 'filebrowser:read-directory',
  READ_FILE_CONTENT: 'filebrowser:read-file-content',
} as const;
