import React, { useState } from 'react';
import { FolderNavigator } from './FolderNavigator';
import './GitHubImportDialog.css';

export interface GitHubImportDialogProps {
  onClose: () => void;
  onImportComplete: () => void;
}

type ImportStep = 'url-entry' | 'navigate-select' | 'scanning' | 'complete';

interface FolderContents {
  owner: string;
  repo: string;
  branch: string;
  currentPath: string;
  parentPath: string | null;
  files: Array<{ name: string; path: string; type: 'file' | 'dir' }>;
  mdFileCount: number;
  preSelectedFile?: string;
}

const EXAMPLE_REPOS = [
  {
    name: 'Awesome Claude Code',
    url: 'https://github.com/hesreallyhim/awesome-claude-code',
    description: 'Community collection of slash commands',
  },
  {
    name: 'Wes Commands',
    url: 'https://github.com/wshobson/commands',
    description: 'Personal command library with help & workflows',
  },
];

export function GitHubImportDialog({ onClose, onImportComplete }: GitHubImportDialogProps) {
  // Step management
  const [step, setStep] = useState<ImportStep>('url-entry');
  const [folderContents, setFolderContents] = useState<FolderContents | null>(null);

  // URL entry state
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Scanning state
  const [scanProgress, setScanProgress] = useState<{
    step: string;
    message: string;
  } | null>(null);

  // Selection state
  const [selectedFiles, setSelectedFiles] = useState<Map<string, string>>(new Map());
  const [isImporting, setIsImporting] = useState(false);

  const validateGitHubUrl = (url: string): boolean => {
    try {
      const gitHubRegex =
        /^https:\/\/github\.com\/(?<owner>[a-zA-Z0-9._-]+)\/(?<repo>[a-zA-Z0-9._-]+)(\/|\/(tree|blob)\/[^/]+.*)?$/;
      return gitHubRegex.test(url.trim());
    } catch {
      return false;
    }
  };

  const handleUrlInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRepoUrl(e.target.value);
    setError('');
  };

  const handleExampleClick = (url: string) => {
    setRepoUrl(url);
    setError('');
  };

  const handleBrowseRepository = async () => {
    const trimmedUrl = repoUrl.trim();

    if (!trimmedUrl) {
      setError('Please enter a repository URL');
      return;
    }

    if (!validateGitHubUrl(trimmedUrl)) {
      setError(
        'Please enter a valid GitHub URL (e.g., https://github.com/owner/repo or https://github.com/owner/repo/tree/main/folder)'
      );
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // Start scanning
      setStep('scanning');
      setScanProgress({
        step: '1/2',
        message: 'Validating repository access...',
      });

      // Small delay to show UI feedback
      await new Promise(resolve => setTimeout(resolve, 500));

      // Call backend to browse repository
      setScanProgress({
        step: '2/2',
        message: 'Loading repository contents...',
      });

      const response = (await window.electronAPI.browseGitHubUrl({
        repoUrl: trimmedUrl,
      })) as {
        success: boolean;
        error?: string;
        data?: FolderContents;
      };

      if (!response.success) {
        setError(response.error || 'Failed to browse repository');
        setStep('url-entry');
        setScanProgress(null);
        setIsValidating(false);
        return;
      }

      const contents = response.data;
      if (!contents) {
        setError('Failed to load repository contents');
        setStep('url-entry');
        setScanProgress(null);
        setIsValidating(false);
        return;
      }

      console.log('[GitHubImportDialog] Repository contents loaded:', {
        owner: contents.owner,
        repo: contents.repo,
        currentPath: contents.currentPath,
        fileCount: contents.files.length,
        mdFileCount: contents.mdFileCount,
      });

      // Store contents and transition to navigation
      setFolderContents(contents);
      setStep('navigate-select');
      setScanProgress(null);
    } catch (err) {
      console.error('[GitHubImportDialog] Error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to browse repository. Please try again.'
      );
      setStep('url-entry');
      setScanProgress(null);
    } finally {
      setIsValidating(false);
    }
  };

  const performImport = async () => {
    if (selectedFiles.size === 0) {
      setError('Please select at least one command to import');
      return;
    }

    setIsImporting(true);
    setStep('scanning');
    setScanProgress({
      step: '1/4',
      message: `Fetching ${selectedFiles.size} command file${selectedFiles.size !== 1 ? 's' : ''}...`,
    });

    try {
      const filePaths = Array.from(selectedFiles.values());

      // Fetch the file contents
      const fetchResponse = (await window.electronAPI.fetchGitHubFiles({
        repoUrl,
        filePaths,
      })) as {
        success: boolean;
        error?: string;
        data?: Array<{ name: string; content: string; path: string }>;
      };

      if (!fetchResponse.success || !fetchResponse.data) {
        setError(fetchResponse.error || 'Failed to fetch files');
        setStep('navigate-select');
        setIsImporting(false);
        return;
      }

      console.log('[GitHubImportDialog] Files fetched:', {
        count: fetchResponse.data.length,
      });

      setScanProgress({
        step: '2/4',
        message: 'Scanning for security issues...',
      });

      // Scan for security issues
      const scanResponse = (await window.electronAPI.scanCommandSecurity({
        commands: fetchResponse.data.map(f => ({
          name: f.name.replace('.md', ''),
          content: f.content,
        })),
        repoUrl,
      })) as {
        success: boolean;
        error?: string;
        data?: Array<{ commandName: string; trustLevel: string; issues: unknown[] }>;
      };

      if (!scanResponse.success) {
        setError(scanResponse.error || 'Failed to scan commands');
        setStep('navigate-select');
        setIsImporting(false);
        return;
      }

      console.log('[GitHubImportDialog] Security scan complete:', {
        count: scanResponse.data?.length || 0,
      });

      setScanProgress({
        step: '3/4',
        message: 'Importing commands...',
      });

      // Actually import the commands
      const importResponse = (await window.electronAPI.importGitHubCommands({
        commands: fetchResponse.data.map(f => ({
          name: f.name.replace('.md', ''),
          content: f.content,
        })),
        location: 'user',
        repoUrl,
      })) as {
        success: boolean;
        error?: string;
        data?: { imported: string[] };
      };

      if (!importResponse.success) {
        setError(importResponse.error || 'Failed to import commands');
        setStep('navigate-select');
        setIsImporting(false);
        return;
      }

      console.log('[GitHubImportDialog] Import successful:', {
        imported: importResponse.data?.imported || [],
      });

      setScanProgress({
        step: '4/4',
        message: 'Complete!',
      });

      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 800));

      setStep('complete');
      setScanProgress(null);
    } catch (err) {
      console.error('[GitHubImportDialog] Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import commands');
      setStep('navigate-select');
      setIsImporting(false);
    }
  };

  // Render Step 1: URL Entry
  if (step === 'url-entry') {
    return (
      <div className="import-overlay">
        <div className="import-modal" onClick={e => e.stopPropagation()}>
          <div className="import-header">
            <h2>Import Commands from GitHub</h2>
            <button onClick={onClose} className="modal-close" title="Close">
              ×
            </button>
          </div>

          <div className="import-body">
            <div className="how-it-works">
              <h3>How it works:</h3>
              <ul>
                <li>Paste any GitHub URL: repo root, folder, or single file</li>
                <li>Navigate through folders to find commands</li>
                <li>Select multiple files from different folders</li>
                <li>Security scan before importing</li>
              </ul>
            </div>

            <div className="form-group">
              <label htmlFor="repo-url">GitHub Repository URL:</label>
              <input
                id="repo-url"
                type="text"
                value={repoUrl}
                onChange={handleUrlInput}
                placeholder="https://github.com/owner/repo or .../tree/main/folder"
                className={`repo-input ${error ? 'error' : ''}`}
                disabled={isValidating}
              />
              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="examples-section">
              <h4>Examples:</h4>
              <div className="examples-grid">
                {EXAMPLE_REPOS.map(repo => (
                  <button
                    key={repo.url}
                    className="example-button"
                    onClick={() => handleExampleClick(repo.url)}
                    title={repo.description}
                  >
                    <div className="example-name">{repo.name}</div>
                    <div className="example-desc">{repo.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="info-box">
              <span className="info-icon">ℹ️</span>
              <span>
                Supports repo root, folders, and single files. Custom branches detected
                automatically.
              </span>
            </div>
          </div>

          <div className="import-footer">
            <button onClick={onClose} className="btn-secondary" disabled={isValidating}>
              Cancel
            </button>
            <button
              onClick={handleBrowseRepository}
              className="btn-primary"
              disabled={isValidating || !repoUrl.trim()}
            >
              {isValidating ? 'Loading...' : 'Browse Repository'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Step 2: Scanning
  if (step === 'scanning') {
    return (
      <div className="import-overlay" onClick={() => {}}>
        <div className="import-modal" onClick={e => e.stopPropagation()}>
          <div className="import-header">
            <h2>{isImporting ? 'Importing Commands' : 'Scanning Repository'}</h2>
            <button onClick={onClose} className="modal-close" title="Close" disabled>
              ×
            </button>
          </div>

          <div className="import-body scanning-body">
            <div className="scanning-progress">
              <div className="progress-step">{scanProgress?.step}</div>
              <p className="progress-message">{scanProgress?.message}</p>
              <div className="progress-bar">
                <div className="progress-bar-fill"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Step 3: Navigate & Select
  if (step === 'navigate-select' && folderContents) {
    return (
      <div className="import-overlay">
        <div className="import-modal import-modal-large" onClick={e => e.stopPropagation()}>
          <div className="import-header">
            <h2>Select Commands to Import</h2>
            <button onClick={onClose} className="modal-close" title="Close">
              ×
            </button>
          </div>

          <div className="import-body" style={{ display: 'flex', flexDirection: 'column' }}>
            <FolderNavigator
              initialContents={folderContents}
              onSelectionChange={setSelectedFiles}
            />
          </div>

          <div className="import-footer">
            <button
              onClick={() => setStep('url-entry')}
              className="btn-secondary"
              disabled={isImporting}
            >
              Back
            </button>
            <button
              onClick={() => performImport()}
              className="btn-primary"
              disabled={isImporting || selectedFiles.size === 0}
            >
              {isImporting
                ? 'Importing...'
                : `Import ${selectedFiles.size} Command${selectedFiles.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Step 4: Complete
  if (step === 'complete') {
    return (
      <div className="import-overlay">
        <div className="import-modal" onClick={e => e.stopPropagation()}>
          <div className="import-header">
            <h2>Import Complete</h2>
            <button onClick={onClose} className="modal-close" title="Close">
              ×
            </button>
          </div>

          <div className="import-body">
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '24px' }}>✅</p>
              <p style={{ marginTop: '10px', fontSize: '16px', fontWeight: 'bold' }}>
                Commands imported successfully!
              </p>
              <p style={{ color: '#666', marginTop: '10px' }}>
                Your commands are now available in the commands manager
              </p>
            </div>
          </div>

          <div className="import-footer">
            <button
              onClick={() => {
                onImportComplete();
                onClose();
              }}
              className="btn-primary"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
