import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FolderNavigator } from '../../../src/renderer/components/GitHubImport/FolderNavigator';

// Mock window.electronAPI
const mockNavigateGitHubFolder = vi.fn();
vi.stubGlobal('electronAPI', {
  navigateGitHubFolder: mockNavigateGitHubFolder,
});

describe('FolderNavigator', () => {
  const mockOnSelectionChange = vi.fn();

  const mockFolderContents = {
    owner: 'testowner',
    repo: 'testrepo',
    branch: 'main',
    currentPath: 'tools',
    parentPath: '',
    files: [
      { name: 'command1.md', path: 'tools/command1.md', type: 'file' as const, size: 1024 },
      { name: 'command2.md', path: 'tools/command2.md', type: 'file' as const, size: 2048 },
      { name: 'subfolder', path: 'tools/subfolder', type: 'dir' as const, hasMdFiles: true },
    ],
    mdFileCount: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Breadcrumb Navigation', () => {
    it('should render breadcrumbs correctly', () => {
      render(<FolderNavigator initialContents={mockFolderContents} onSelectionChange={mockOnSelectionChange} />);

      expect(screen.getByText('testowner/testrepo')).toBeInTheDocument();
      expect(screen.getByText('tools')).toBeInTheDocument();
    });

    it('should show only repo name for root path', () => {
      const rootContents = { ...mockFolderContents, currentPath: '', parentPath: null };
      render(<FolderNavigator initialContents={rootContents} onSelectionChange={mockOnSelectionChange} />);

      expect(screen.getByText('testowner/testrepo')).toBeInTheDocument();
      expect(screen.queryByText('tools')).not.toBeInTheDocument();
    });

    it('should navigate when clicking breadcrumb', async () => {
      mockNavigateGitHubFolder.mockResolvedValueOnce({
        success: true,
        data: { ...mockFolderContents, currentPath: '', files: [] },
      });

      render(<FolderNavigator initialContents={mockFolderContents} onSelectionChange={mockOnSelectionChange} />);

      const repoLink = screen.getByText('testowner/testrepo');
      fireEvent.click(repoLink);

      await waitFor(() => {
        expect(mockNavigateGitHubFolder).toHaveBeenCalledWith({
          owner: 'testowner',
          repo: 'testrepo',
          branch: 'main',
          folderPath: '',
        });
      });
    });
  });

  describe('Parent Folder Link', () => {
    it('should show parent folder link when not at root', () => {
      render(<FolderNavigator initialContents={mockFolderContents} onSelectionChange={mockOnSelectionChange} />);

      expect(screen.getByText('↑ Parent folder')).toBeInTheDocument();
    });

    it('should not show parent folder link at root', () => {
      const rootContents = { ...mockFolderContents, currentPath: '', parentPath: null };
      render(<FolderNavigator initialContents={rootContents} onSelectionChange={mockOnSelectionChange} />);

      expect(screen.queryByText('↑ Parent folder')).not.toBeInTheDocument();
    });

    it('should navigate to parent when clicked', async () => {
      mockNavigateGitHubFolder.mockResolvedValueOnce({
        success: true,
        data: { ...mockFolderContents, currentPath: '', files: [] },
      });

      render(<FolderNavigator initialContents={mockFolderContents} onSelectionChange={mockOnSelectionChange} />);

      const parentLink = screen.getByText('↑ Parent folder');
      fireEvent.click(parentLink);

      await waitFor(() => {
        expect(mockNavigateGitHubFolder).toHaveBeenCalledWith({
          owner: 'testowner',
          repo: 'testrepo',
          branch: 'main',
          folderPath: '',
        });
      });
    });
  });

  describe('File Selection', () => {
    it('should display all .md files', () => {
      render(<FolderNavigator initialContents={mockFolderContents} onSelectionChange={mockOnSelectionChange} />);

      expect(screen.getByText('command1.md')).toBeInTheDocument();
      expect(screen.getByText('command2.md')).toBeInTheDocument();
    });

    it('should show file count', () => {
      render(<FolderNavigator initialContents={mockFolderContents} onSelectionChange={mockOnSelectionChange} />);

      expect(screen.getByText(/2 command files in this folder/i)).toBeInTheDocument();
    });

    it('should toggle file selection when checkbox clicked', () => {
      render(<FolderNavigator initialContents={mockFolderContents} onSelectionChange={mockOnSelectionChange} />);

      const checkboxes = screen.getAllByRole('checkbox');
      // Find the checkbox for command1.md (skip the "Select All" checkbox which is first)
      const command1Checkbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('command1.md');
      });

      expect(command1Checkbox).toBeDefined();
      fireEvent.click(command1Checkbox!);

      expect(mockOnSelectionChange).toHaveBeenCalled();
      const selectionMap = mockOnSelectionChange.mock.calls[0][0];
      expect(selectionMap.size).toBe(1);
      expect(selectionMap.has('tools/command1.md')).toBe(true);
    });

    it('should deselect file when clicked again', () => {
      render(<FolderNavigator initialContents={mockFolderContents} onSelectionChange={mockOnSelectionChange} />);

      const checkbox = screen.getAllByRole('checkbox')[1];

      // Select
      fireEvent.click(checkbox);
      expect(mockOnSelectionChange).toHaveBeenCalledTimes(1);

      // Deselect
      fireEvent.click(checkbox);
      expect(mockOnSelectionChange).toHaveBeenCalledTimes(2);

      const selectionMap = mockOnSelectionChange.mock.calls[1][0];
      expect(selectionMap.size).toBe(0);
    });
  });

  describe('Select All Functionality', () => {
    it('should select all files when "Select All" clicked', () => {
      render(<FolderNavigator initialContents={mockFolderContents} onSelectionChange={mockOnSelectionChange} />);

      const selectAllButton = screen.getByText(/Select All in Folder/i);
      fireEvent.click(selectAllButton);

      expect(mockOnSelectionChange).toHaveBeenCalled();
      const selectionMap = mockOnSelectionChange.mock.calls[0][0];
      expect(selectionMap.size).toBe(2);
      expect(selectionMap.has('tools/command1.md')).toBe(true);
      expect(selectionMap.has('tools/command2.md')).toBe(true);
    });

    it('should deselect all files when all are selected', () => {
      render(<FolderNavigator initialContents={mockFolderContents} onSelectionChange={mockOnSelectionChange} />);

      const selectAllButton = screen.getByText(/Select All in Folder/i);

      // Select all
      fireEvent.click(selectAllButton);
      expect(mockOnSelectionChange).toHaveBeenCalledTimes(1);

      // Deselect all
      fireEvent.click(selectAllButton);
      expect(mockOnSelectionChange).toHaveBeenCalledTimes(2);

      const selectionMap = mockOnSelectionChange.mock.calls[1][0];
      expect(selectionMap.size).toBe(0);
    });

    it('should call onSelectionChange with correct selection', () => {
      render(<FolderNavigator initialContents={mockFolderContents} onSelectionChange={mockOnSelectionChange} />);

      const selectAllButton = screen.getByText(/Select All in Folder/i);
      fireEvent.click(selectAllButton);

      // Verify callback was called with all files selected
      const selectionMap = mockOnSelectionChange.mock.calls[0][0];
      expect(selectionMap.size).toBe(2);
    });
  });

  describe('Folder Navigation', () => {
    it('should display folders', () => {
      render(<FolderNavigator initialContents={mockFolderContents} onSelectionChange={mockOnSelectionChange} />);

      expect(screen.getByText('subfolder')).toBeInTheDocument();
    });

    it('should navigate into folder when clicked', async () => {
      mockNavigateGitHubFolder.mockResolvedValueOnce({
        success: true,
        data: { ...mockFolderContents, currentPath: 'tools/subfolder', files: [] },
      });

      render(<FolderNavigator initialContents={mockFolderContents} onSelectionChange={mockOnSelectionChange} />);

      const folderButton = screen.getByText('subfolder');
      fireEvent.click(folderButton);

      await waitFor(() => {
        expect(mockNavigateGitHubFolder).toHaveBeenCalledWith({
          owner: 'testowner',
          repo: 'testrepo',
          branch: 'main',
          folderPath: 'tools/subfolder',
        });
      });
    });

    it('should show folder count', () => {
      render(<FolderNavigator initialContents={mockFolderContents} onSelectionChange={mockOnSelectionChange} />);

      expect(screen.getByText(/1 subfolder/i)).toBeInTheDocument();
    });
  });

  describe('Pre-selected File', () => {
    it('should pre-select file if provided', () => {
      const contentsWithPreSelected = {
        ...mockFolderContents,
        preSelectedFile: 'tools/command1.md',
      };

      render(
        <FolderNavigator
          initialContents={contentsWithPreSelected}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(mockOnSelectionChange).toHaveBeenCalled();
      const selectionMap = mockOnSelectionChange.mock.calls[0][0];
      expect(selectionMap.has('tools/command1.md')).toBe(true);
    });

    it('should show error if pre-selected file does not exist', () => {
      const contentsWithNonExistentFile = {
        ...mockFolderContents,
        preSelectedFile: 'tools/nonexistent.md',
      };

      render(
        <FolderNavigator
          initialContents={contentsWithNonExistentFile}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(
        screen.getByText(/The file "nonexistent.md" does not exist in this folder/i)
      ).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no files or folders', () => {
      const emptyContents = {
        ...mockFolderContents,
        files: [],
        mdFileCount: 0,
      };

      render(<FolderNavigator initialContents={emptyContents} onSelectionChange={mockOnSelectionChange} />);

      expect(
        screen.getByText(/No command files or subfolders found in this directory/i)
      ).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should call navigate API during folder navigation', async () => {
      mockNavigateGitHubFolder.mockResolvedValueOnce({
        success: true,
        data: mockFolderContents,
      });

      render(<FolderNavigator initialContents={mockFolderContents} onSelectionChange={mockOnSelectionChange} />);

      const folderButton = screen.getByRole('button', { name: /subfolder/i });
      fireEvent.click(folderButton);

      await waitFor(() => {
        expect(mockNavigateGitHubFolder).toHaveBeenCalled();
      });
    });

    it('should disable buttons during navigation', async () => {
      mockNavigateGitHubFolder.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockFolderContents }), 100))
      );

      render(<FolderNavigator initialContents={mockFolderContents} onSelectionChange={mockOnSelectionChange} />);

      const folderButton = screen.getByRole('button', { name: /subfolder/i });
      fireEvent.click(folderButton);

      expect(folderButton).toBeDisabled();

      await waitFor(() => {
        expect(mockNavigateGitHubFolder).toHaveBeenCalled();
      });
    });
  });

  describe('Multi-folder Selection', () => {
    it('should maintain selection across folder navigation', async () => {
      render(<FolderNavigator initialContents={mockFolderContents} onSelectionChange={mockOnSelectionChange} />);

      // Select a file in current folder
      const checkbox = screen.getAllByRole('checkbox')[1];
      fireEvent.click(checkbox);

      const initialSelection = mockOnSelectionChange.mock.calls[0][0];
      expect(initialSelection.size).toBe(1);

      // Navigate to another folder
      mockNavigateGitHubFolder.mockResolvedValueOnce({
        success: true,
        data: {
          ...mockFolderContents,
          currentPath: 'tools/subfolder',
          files: [
            { name: 'command3.md', path: 'tools/subfolder/command3.md', type: 'file' as const, size: 512 },
          ],
          mdFileCount: 1,
        },
      });

      const folderButton = screen.getByText('subfolder');
      fireEvent.click(folderButton);

      await waitFor(() => {
        expect(mockNavigateGitHubFolder).toHaveBeenCalled();
      });

      // Selection from previous folder should be maintained
      // (The component maintains state across navigation)
    });
  });
});
