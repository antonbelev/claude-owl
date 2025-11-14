import React, { useState, useEffect } from 'react';
import './FolderNavigator.css';

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  hasMdFiles?: boolean;
}

interface FolderContents {
  owner: string;
  repo: string;
  branch: string;
  currentPath: string;
  parentPath: string | null;
  files: GitHubFile[];
  mdFileCount: number;
  preSelectedFile?: string;
}

interface FolderNavigatorProps {
  initialContents: FolderContents;
  onSelectionChange: (selectedFiles: Map<string, string>) => void;
}

export function FolderNavigator({ initialContents, onSelectionChange }: FolderNavigatorProps) {
  const [currentContents, setCurrentContents] = useState<FolderContents>(initialContents);
  const [selectedFiles, setSelectedFiles] = useState<Map<string, string>>(new Map());
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState('');

  // Pre-select file if URL pointed to a specific file
  useEffect(() => {
    if (currentContents.preSelectedFile) {
      console.log('[FolderNavigator] Pre-selecting file:', currentContents.preSelectedFile);
      console.log(
        '[FolderNavigator] Available files:',
        currentContents.files.map(f => f.path)
      );

      // Check if the pre-selected file actually exists in the current folder
      const fileExists = currentContents.files.some(
        f => f.path === currentContents.preSelectedFile && f.type === 'file'
      );

      if (fileExists) {
        const newSelection = new Map<string, string>();
        newSelection.set(currentContents.preSelectedFile, currentContents.preSelectedFile);
        setSelectedFiles(newSelection);
        onSelectionChange(newSelection);
      } else {
        // File doesn't exist - show error
        const fileName = currentContents.preSelectedFile.split('/').pop() || 'file';
        setError(
          `The file "${fileName}" does not exist in this folder. It may have been moved or deleted.`
        );
        console.warn(
          '[FolderNavigator] Pre-selected file not found:',
          currentContents.preSelectedFile
        );
      }
    }
  }, [currentContents.preSelectedFile, currentContents.files]);

  // Navigate to a folder
  const handleNavigateToFolder = async (folderPath: string) => {
    setIsNavigating(true);
    setError('');

    try {
      const response = (await window.electronAPI.navigateGitHubFolder({
        owner: currentContents.owner,
        repo: currentContents.repo,
        branch: currentContents.branch,
        folderPath,
      })) as { success: boolean; error?: string; data?: FolderContents };

      if (!response.success || !response.data) {
        setError(response.error || 'Failed to navigate to folder');
        return;
      }

      setCurrentContents(response.data);
    } catch (err) {
      console.error('[FolderNavigator] Navigation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to navigate');
    } finally {
      setIsNavigating(false);
    }
  };

  // Toggle file selection
  const handleFileToggle = (file: GitHubFile) => {
    const newSelection = new Map(selectedFiles);

    if (newSelection.has(file.path)) {
      newSelection.delete(file.path);
    } else {
      newSelection.set(file.path, file.path);
    }

    setSelectedFiles(newSelection);
    onSelectionChange(newSelection);
  };

  // Select all files in current folder
  const handleSelectAllInFolder = () => {
    const mdFiles = currentContents.files.filter(f => f.type === 'file' && f.name.endsWith('.md'));
    const newSelection = new Map(selectedFiles);

    // Check if all files in current folder are selected
    const allSelected = mdFiles.every(f => newSelection.has(f.path));

    if (allSelected) {
      // Deselect all files in current folder
      mdFiles.forEach(f => newSelection.delete(f.path));
    } else {
      // Select all files in current folder
      mdFiles.forEach(f => newSelection.set(f.path, f.path));
    }

    setSelectedFiles(newSelection);
    onSelectionChange(newSelection);
  };

  // Build breadcrumb path
  const buildBreadcrumbs = () => {
    const { owner, repo, currentPath } = currentContents;
    const parts = currentPath === '' ? [] : currentPath.split('/');

    const crumbs: Array<{ label: string; path: string }> = [
      { label: `${owner}/${repo}`, path: '' },
    ];

    parts.forEach((part, index) => {
      const path = parts.slice(0, index + 1).join('/');
      crumbs.push({ label: part, path });
    });

    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();
  const mdFiles = currentContents.files.filter(f => f.type === 'file');
  const folders = currentContents.files.filter(f => f.type === 'dir');
  const selectedInCurrentFolder = mdFiles.filter(f => selectedFiles.has(f.path)).length;
  const totalSelectedFiles = selectedFiles.size;

  // Debug logging
  console.log('[FolderNavigator] Rendering:', {
    currentPath: currentContents.currentPath,
    totalFiles: currentContents.files.length,
    mdFiles: mdFiles.length,
    folders: folders.length,
    mdFileNames: mdFiles.map(f => f.name),
    allFiles: currentContents.files.map(f => ({ name: f.name, type: f.type, path: f.path })),
  });

  return (
    <div className="folder-navigator">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumbs">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.path}>
            {index > 0 && <span className="breadcrumb-separator">/</span>}
            <button
              className={`breadcrumb-link ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
              onClick={() => handleNavigateToFolder(crumb.path)}
              disabled={isNavigating || index === breadcrumbs.length - 1}
            >
              {crumb.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Error Message */}
      {error && <div className="navigator-error">{error}</div>}

      {/* Parent Folder Link */}
      {currentContents.parentPath !== null && (
        <button
          className="parent-folder-link"
          onClick={() => handleNavigateToFolder(currentContents.parentPath!)}
          disabled={isNavigating}
        >
          ↑ Parent folder
        </button>
      )}

      {/* File/Folder Count and Selection Info */}
      <div className="folder-info">
        <div className="file-count">
          {currentContents.mdFileCount > 0 && (
            <span>
              {currentContents.mdFileCount} command file
              {currentContents.mdFileCount !== 1 ? 's' : ''} in this folder
            </span>
          )}
          {folders.length > 0 && (
            <span className="folder-count">
              {folders.length} subfolder{folders.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {totalSelectedFiles > 0 && (
          <div className="selection-info">
            <strong>{totalSelectedFiles}</strong> file{totalSelectedFiles !== 1 ? 's' : ''} selected
            {selectedInCurrentFolder > 0 && (
              <span className="current-folder-count">
                ({selectedInCurrentFolder} in this folder)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Select All Button (only show if there are .md files) */}
      {currentContents.mdFileCount > 0 && (
        <button
          className="select-all-btn"
          onClick={handleSelectAllInFolder}
          disabled={isNavigating}
        >
          {selectedInCurrentFolder === mdFiles.length
            ? '☐ Deselect All'
            : '☑ Select All in Folder'}
        </button>
      )}

      {/* Folders */}
      {folders.length > 0 && (
        <div className="folders-section">
          <h4>Folders</h4>
          <div className="folders-list">
            {folders.map(folder => (
              <button
                key={folder.path}
                className="folder-item"
                onClick={() => handleNavigateToFolder(folder.path)}
                disabled={isNavigating}
              >
                <span className="folder-icon">📁</span>
                <span className="folder-name">{folder.name}</span>
                {folder.hasMdFiles && <span className="has-files-indicator">•</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {mdFiles.length > 0 && (
        <div className="files-section">
          <h4>Command Files</h4>
          <div className="files-list">
            {mdFiles.map(file => (
              <label key={file.path} className="file-item">
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.path)}
                  onChange={() => handleFileToggle(file)}
                  disabled={isNavigating}
                />
                <span className="file-icon">📄</span>
                <span className="file-name">{file.name}</span>
                {file.size && <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {folders.length === 0 && mdFiles.length === 0 && (
        <div className="empty-state">
          <p>No command files or subfolders found in this directory.</p>
        </div>
      )}

      {/* Loading Indicator */}
      {isNavigating && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}
