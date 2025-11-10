import React from 'react';
import { useDebugLogs } from '@/renderer/hooks/useDebugLogs';
import { LogsList } from '@/renderer/components/Logs/LogsList';
import { LogViewer } from '@/renderer/components/Logs/LogViewer';
import './LogsPage.css';

export const LogsPage: React.FC = () => {
  const {
    logs,
    loading,
    error,
    selectedLog,
    searchQuery,
    setSelectedLog,
    getLog,
    deleteLog,
    search,
    clearSearch,
  } = useDebugLogs();

  const handleSelectLog = async (log: any) => {
    // Load full content if not already present
    if (!log.content) {
      const fullLog = await getLog(log.filename);
      if (fullLog) {
        setSelectedLog(fullLog);
      }
    } else {
      setSelectedLog(log);
    }
  };

  const handleDeleteLog = async (filename: string) => {
    const success = await deleteLog(filename);
    if (success) {
      setSelectedLog(null);
    }
  };

  return (
    <div className="page logs-page">
      <h1 className="page-title">Debug Logs</h1>
      <p className="page-description">
        View and manage Claude debug logs from <code>~/.claude/debug/</code>
      </p>

      <div className="logs-container">
        <div className="logs-sidebar">
          <LogsList
            logs={logs}
            selectedLog={selectedLog}
            loading={loading}
            error={error}
            searchQuery={searchQuery}
            onSelectLog={handleSelectLog}
            onSearch={search}
            onClearSearch={clearSearch}
          />
        </div>

        <div className="logs-main">
          {!selectedLog && !loading && logs.length > 0 && (
            <div className="logs-placeholder">
              <p className="placeholder-icon">👈</p>
              <p className="placeholder-text">Select a log to view its contents</p>
            </div>
          )}

          {selectedLog && <LogViewer log={selectedLog} onClose={() => setSelectedLog(null)} onDelete={handleDeleteLog} />}
        </div>
      </div>
    </div>
  );
};
