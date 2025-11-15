import React from 'react';
import { X, Search, Trash2 } from 'lucide-react';
import type { DebugLog } from '@/shared/types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Button } from '@/renderer/components/ui/button';
import { Input } from '@/renderer/components/ui/input';
import { Badge } from '@/renderer/components/ui/badge';

interface LogViewerProps {
  log: DebugLog;
  onClose: () => void;
  onDelete: (filename: string) => Promise<void>;
}

export const LogViewer: React.FC<LogViewerProps> = ({ log, onClose, onDelete }) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchMatches, setSearchMatches] = React.useState(0);
  const [_currentMatch, setCurrentMatch] = React.useState(0);
  const [showSearch, setShowSearch] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const contentRef = React.useRef<HTMLPreElement>(null);

  // Handle Ctrl+F / Cmd+F
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
      } else if (e.key === 'Escape') {
        if (showSearch) {
          setShowSearch(false);
          setSearchQuery('');
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showSearch]);

  const handleDelete = () => {
    setDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(log.filename);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Search functionality
  const highlightContent = React.useMemo(() => {
    if (!searchQuery || !log.content) {
      return log.content;
    }

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const matches = log.content.match(regex);
    setSearchMatches(matches?.length || 0);

    return log.content
      .split(regex)
      .map((part, i) => {
        if (part && regex.test(part)) {
          return `<mark key=${i}>${part}</mark>`;
        }
        return part;
      })
      .join('');
  }, [searchQuery, log.content]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setCurrentMatch(0);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-6 border-b border-neutral-200">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold truncate">{log.filename}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-6 px-6 py-3 bg-neutral-50 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-700">Size:</span>
          <Badge variant="secondary">{formatFileSize(log.size)}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-700">Modified:</span>
          <Badge variant="secondary">{formatDate(log.timestamp)}</Badge>
        </div>
      </div>

      {showSearch && (
        <div className="flex items-center gap-3 p-4 bg-neutral-50 border-b border-neutral-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              ref={searchInputRef}
              type="text"
              className="pl-10"
              placeholder="Search in log... (Cmd+F to search, Esc to close)"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          {searchQuery && (
            <span className="text-sm text-neutral-600 whitespace-nowrap">
              {searchMatches > 0
                ? `${searchMatches} match${searchMatches !== 1 ? 'es' : ''}`
                : 'No matches'}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-auto p-6 bg-neutral-900">
        <pre
          ref={contentRef}
          className="text-sm text-neutral-100 font-mono whitespace-pre-wrap"
          dangerouslySetInnerHTML={{
            __html: highlightContent || '',
          }}
        />
      </div>

      <div className="flex justify-between gap-4 p-6 border-t border-neutral-200">
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
        <Button onClick={handleDelete} variant="destructive" disabled={isDeleting}>
          <Trash2 className="h-4 w-4 mr-2" />
          {isDeleting ? 'Deleting...' : 'Delete Log'}
        </Button>
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Log"
          message={`Are you sure you want to delete ${log.filename}?`}
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}
    </div>
  );
};
