/**
 * React hook for file browser operations
 */

import { useState, useCallback } from 'react';
import type {
  FileNode,
  FileContent,
  ReadDirectoryRequest,
  ReadDirectoryResponse,
  ReadFileContentRequest,
  ReadFileContentResponse,
} from '@/shared/types/ipc.filebrowser.types';

interface FileBrowserState {
  loading: boolean;
  error: string | null;
  currentPath: string | null;
  nodes: FileNode[];
  selectedFile: FileContent | null;
  loadingFile: boolean;
}

export function useFileBrowser() {
  const [state, setState] = useState<FileBrowserState>({
    loading: false,
    error: null,
    currentPath: null,
    nodes: [],
    selectedFile: null,
    loadingFile: false,
  });

  /**
   * Read directory structure
   */
  const readDirectory = useCallback(async (path: string, maxDepth: number = 3): Promise<boolean> => {
    if (!window.electronAPI) {
      console.error('[useFileBrowser] electronAPI not available');
      return false;
    }

    console.log('[useFileBrowser] Reading directory:', path);
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const request: ReadDirectoryRequest = { path, maxDepth };
      const response = (await window.electronAPI.readDirectory(request)) as ReadDirectoryResponse;

      console.log('[useFileBrowser] Directory read response:', response);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          loading: false,
          currentPath: path,
          nodes: response.data!,
          error: null,
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error || 'Failed to read directory',
        }));
        return false;
      }
    } catch (error) {
      console.error('[useFileBrowser] Exception reading directory:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      return false;
    }
  }, []);

  /**
   * Read file content
   */
  const readFileContent = useCallback(async (path: string): Promise<boolean> => {
    if (!window.electronAPI) {
      console.error('[useFileBrowser] electronAPI not available');
      return false;
    }

    console.log('[useFileBrowser] Reading file:', path);
    setState(prev => ({ ...prev, loadingFile: true, error: null }));

    try {
      const request: ReadFileContentRequest = { path };
      const response = (await window.electronAPI.readFileContent(request)) as ReadFileContentResponse;

      console.log('[useFileBrowser] File read response:', {
        success: response.success,
        size: response.data?.size,
      });

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          loadingFile: false,
          selectedFile: response.data!,
          error: null,
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          loadingFile: false,
          error: response.error || 'Failed to read file',
        }));
        return false;
      }
    } catch (error) {
      console.error('[useFileBrowser] Exception reading file:', error);
      setState(prev => ({
        ...prev,
        loadingFile: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      return false;
    }
  }, []);

  /**
   * Clear selected file
   */
  const clearSelectedFile = useCallback(() => {
    setState(prev => ({ ...prev, selectedFile: null }));
  }, []);

  /**
   * Clear all state
   */
  const clear = useCallback(() => {
    setState({
      loading: false,
      error: null,
      currentPath: null,
      nodes: [],
      selectedFile: null,
      loadingFile: false,
    });
  }, []);

  return {
    ...state,
    readDirectory,
    readFileContent,
    clearSelectedFile,
    clear,
  };
}
