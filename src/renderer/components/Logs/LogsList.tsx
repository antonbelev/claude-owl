import React from 'react';
import type { DebugLog } from '@/shared/types';
import './LogsList.css';

interface LogsListProps {
  logs: DebugLog[];
  selectedLog: DebugLog | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onSelectLog: (log: DebugLog) => Promise<void>;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
}

export const LogsList: React.FC<LogsListProps> = ({
  logs,
  selectedLog,
  loading,
  error,
  searchQuery,
  onSelectLog,
  onSearch,
  onClearSearch,
}) => {
  const [searchInput, setSearchInput] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const performSearch = React.useCallback(
    async (query: string) => {
      setIsSearching(true);
      await onSearch(query);
      setIsSearching(false);
    },
    [onSearch]
  );

  const handleSearch = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.currentTarget.value;
      setSearchInput(query);

      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (query.trim()) {
        // Debounce search to avoid too many requests (800ms)
        searchTimeoutRef.current = setTimeout(async () => {
          await performSearch(query);
        }, 800);
      } else {
        // If empty, clear search immediately
        setIsSearching(true);
        onClearSearch();
        setIsSearching(false);
      }
    },
    [onSearch, onClearSearch, performSearch]
  );

  const handleKeyDown = React.useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = e.currentTarget.value;

        // Clear timeout and search immediately on Enter
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }

        if (query.trim()) {
          await performSearch(query);
        }
      }
    },
    [performSearch]
  );

  const handleClearSearch = React.useCallback(async () => {
    setSearchInput('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    await onClearSearch();
  }, [onClearSearch]);

  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatFullDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="logs-list-container">
      <div className="logs-search-bar">
        <input
          type="text"
          className="logs-search-input"
          placeholder="Search logs by content... (press Enter to search)"
          value={searchInput}
          onChange={handleSearch}
          onKeyDown={handleKeyDown}
          disabled={loading || isSearching}
        />
        {searchInput && (
          <button className="logs-clear-search" onClick={handleClearSearch} title="Clear search">
            ✕
          </button>
        )}
      </div>

      {error && <div className="logs-error">{error}</div>}

      {loading && (
        <div className="logs-loading">
          <div className="spinner" />
          <span>Loading debug logs...</span>
        </div>
      )}

      {!loading && logs.length === 0 && (
        <div className="logs-empty">
          <p className="logs-empty-icon">📝</p>
          <p className="logs-empty-text">
            {searchQuery ? 'No logs match your search' : 'No debug logs found'}
          </p>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="logs-list">
          <div className="logs-count">
            {searchQuery && (
              <>
                Found <strong>{logs.length}</strong> log(s) matching &quot;{searchQuery}&quot;
              </>
            )}
            {!searchQuery && (
              <>
                <strong>{logs.length}</strong> debug log(s)
              </>
            )}
          </div>

          {logs.map(log => (
            <div
              key={log.filename}
              className={`logs-list-item ${selectedLog?.filename === log.filename ? 'selected' : ''}`}
              onClick={() => onSelectLog(log)}
              role="button"
              tabIndex={0}
              onKeyPress={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectLog(log);
                }
              }}
              title={formatFullDate(log.timestamp)}
            >
              <div className="log-item-main">
                <div className="log-item-filename">{log.filename}</div>
                <div className="log-item-meta">
                  <span className="log-item-date">{formatDate(log.timestamp)}</span>
                  <span className="log-item-timestamp">{formatFullDate(log.timestamp)}</span>
                </div>
              </div>
              <div className="log-item-size">{formatFileSize(log.size)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
