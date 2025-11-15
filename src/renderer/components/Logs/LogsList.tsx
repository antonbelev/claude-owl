import React from 'react';
import { Search, X, FileText } from 'lucide-react';
import type { DebugLog } from '@/shared/types';
import { Input } from '@/renderer/components/ui/input';
import { Button } from '@/renderer/components/ui/button';
import { Spinner } from '@/renderer/components/ui/spinner';

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
    <div className="flex flex-col h-full">
      <div className="relative p-4 border-b border-neutral-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            className="pl-10 pr-10"
            placeholder="Search logs by content... (press Enter to search)"
            value={searchInput}
            onChange={handleSearch}
            onKeyDown={handleKeyDown}
            disabled={loading || isSearching}
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
              onClick={handleClearSearch}
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <Spinner className="h-8 w-8" />
          <span className="text-sm text-neutral-600">Loading debug logs...</span>
        </div>
      )}

      {!loading && logs.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <FileText className="h-12 w-12 text-neutral-300" />
          <p className="text-neutral-600">
            {searchQuery ? 'No logs match your search' : 'No debug logs found'}
          </p>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 bg-neutral-50 border-b border-neutral-200">
            <p className="text-sm text-neutral-600">
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
            </p>
          </div>

          <div className="divide-y divide-neutral-200">
            {logs.map(log => (
              <div
                key={log.filename}
                className={`p-4 hover:bg-neutral-50 cursor-pointer transition-colors ${
                  selectedLog?.filename === log.filename ? 'bg-blue-50 hover:bg-blue-50' : ''
                }`}
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
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-neutral-900 truncate">
                      {log.filename}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                      <span>{formatDate(log.timestamp)}</span>
                      <span className="text-neutral-300">•</span>
                      <span className="hidden sm:inline">{formatFullDate(log.timestamp)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-neutral-500 whitespace-nowrap">
                    {formatFileSize(log.size)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
