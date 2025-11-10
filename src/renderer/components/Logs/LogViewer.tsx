import React from 'react';
import type { DebugLog } from '@/shared/types';
import './LogViewer.css';

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

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${log.filename}?`)) {
      setIsDeleting(true);
      try {
        await onDelete(log.filename);
        onClose();
      } finally {
        setIsDeleting(false);
      }
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

    return log.content.split(regex).map((part, i) => {
      if (part && regex.test(part)) {
        return `<mark key=${i}>${part}</mark>`;
      }
      return part;
    }).join('');
  }, [searchQuery, log.content]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setCurrentMatch(0);
  };

  return (
    <div className="log-viewer-panel">
      <div className="log-viewer-header">
        <div className="log-viewer-title-section">
          <h2 className="log-viewer-title">{log.filename}</h2>
          <button
            className="log-viewer-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="log-viewer-info">
        <div className="log-info-item">
          <span className="log-info-label">Size:</span>
          <span className="log-info-value">{formatFileSize(log.size)}</span>
        </div>
        <div className="log-info-item">
          <span className="log-info-label">Modified:</span>
          <span className="log-info-value">{formatDate(log.timestamp)}</span>
        </div>
      </div>

      {showSearch && (
        <div className="log-search-bar">
          <input
            ref={searchInputRef}
            type="text"
            className="log-search-input"
            placeholder="Search in log... (Cmd+F to search, Esc to close)"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <span className="log-search-count">
              {searchMatches > 0 ? `${searchMatches} match${searchMatches !== 1 ? 'es' : ''}` : 'No matches'}
            </span>
          )}
          <button
            className="log-search-close"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
            aria-label="Close search"
          >
            ✕
          </button>
        </div>
      )}

      <div className="log-viewer-content">
        <pre
          ref={contentRef}
          className="log-content"
          dangerouslySetInnerHTML={{
            __html: highlightContent || ''
          }}
        />
      </div>

      <div className="log-viewer-actions">
        <button
          className="btn btn-secondary"
          onClick={onClose}
        >
          Close
        </button>
        <button
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete Log'}
        </button>
      </div>
    </div>
  );
};
