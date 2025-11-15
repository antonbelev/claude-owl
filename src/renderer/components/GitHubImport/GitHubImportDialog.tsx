import React, { useState } from 'react';
import { FolderNavigator } from './FolderNavigator';
import { Button } from '@/renderer/components/ui/button';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import { CheckCircle, Info } from 'lucide-react';

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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Render Step 1: URL Entry
  if (step === 'url-entry') {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
        onClick={handleOverlayClick}
      >
        <div
          className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Import Commands from GitHub</h2>
            <Button variant="ghost" size="icon" onClick={onClose} title="Close">
              ✕
            </Button>
          </div>

          <div className="flex-1 p-6 space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">How it works:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Paste any GitHub URL: repo root, folder, or single file</li>
                  <li>Navigate through folders to find commands</li>
                  <li>Select multiple files from different folders</li>
                  <li>Security scan before importing</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="repo-url">GitHub Repository URL:</Label>
              <Input
                id="repo-url"
                type="text"
                value={repoUrl}
                onChange={handleUrlInput}
                placeholder="https://github.com/owner/repo or .../tree/main/folder"
                className={error ? 'border-red-500' : ''}
                disabled={isValidating}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Examples:</h4>
              <div className="space-y-2">
                {EXAMPLE_REPOS.map(repo => (
                  <Button
                    key={repo.url}
                    variant="outline"
                    className="w-full text-left justify-start h-auto py-3"
                    onClick={() => handleExampleClick(repo.url)}
                  >
                    <div className="flex flex-col items-start">
                      <div className="font-medium font-mono text-sm">{repo.name}</div>
                      <div className="text-xs text-gray-500">{repo.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <Alert variant="default">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Supports repo root, folders, and single files. Custom branches detected automatically.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t">
            <Button variant="outline" onClick={onClose} disabled={isValidating}>
              Cancel
            </Button>
            <Button
              onClick={handleBrowseRepository}
              disabled={isValidating || !repoUrl.trim()}
            >
              {isValidating ? 'Loading...' : 'Browse Repository'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render Step 2: Scanning
  if (step === 'scanning') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
        <div
          className="bg-white rounded-xl max-w-lg w-full shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">
              {isImporting ? 'Importing Commands' : 'Scanning Repository'}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} disabled title="Close">
              ✕
            </Button>
          </div>

          <div className="p-12 flex items-center justify-center">
            <div className="w-full text-center space-y-4">
              <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                {scanProgress?.step}
              </div>
              <p className="text-lg text-gray-900 font-medium">{scanProgress?.message}</p>
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
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
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
        onClick={handleOverlayClick}
      >
        <div
          className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Select Commands to Import</h2>
            <Button variant="ghost" size="icon" onClick={onClose} title="Close">
              ✕
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <FolderNavigator
              initialContents={folderContents}
              onSelectionChange={setSelectedFiles}
            />
          </div>

          <div className="flex justify-between gap-3 p-6 border-t">
            <Button variant="outline" onClick={() => setStep('url-entry')} disabled={isImporting}>
              Back
            </Button>
            <Button
              onClick={() => performImport()}
              disabled={isImporting || selectedFiles.size === 0}
            >
              {isImporting
                ? 'Importing...'
                : `Import ${selectedFiles.size} Command${selectedFiles.size !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render Step 4: Complete
  if (step === 'complete') {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
        onClick={handleOverlayClick}
      >
        <div
          className="bg-white rounded-xl max-w-lg w-full shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Import Complete</h2>
            <Button variant="ghost" size="icon" onClick={onClose} title="Close">
              ✕
            </Button>
          </div>

          <div className="p-12 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <p className="text-lg font-semibold">Commands imported successfully!</p>
            <p className="text-gray-600">Your commands are now available in the commands manager</p>
          </div>

          <div className="flex justify-end p-6 border-t">
            <Button
              onClick={() => {
                onImportComplete();
                onClose();
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
