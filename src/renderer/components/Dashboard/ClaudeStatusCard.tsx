import React from 'react';
import { useClaudeInstallation } from '../../hooks/useClaudeInstallation';

export const ClaudeStatusCard: React.FC = () => {
  const { loading, installed, version, path, error, refetch } = useClaudeInstallation();

  if (loading) {
    return (
      <div className="status-card" data-testid="claude-status-card">
        <h2>Claude Code Status</h2>
        <p>Checking installation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-card status-error" data-testid="claude-status-card">
        <h2>Claude Code Status</h2>
        <p className="error-message">Error: {error}</p>
        <button onClick={refetch} data-testid="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!installed) {
    return (
      <div className="status-card status-warning" data-testid="claude-status-card">
        <h2>Claude Code Status</h2>
        <p className="warning-message">Claude Code is not installed</p>
        <p className="help-text">Please install Claude Code CLI to use this application.</p>
        <a
          href="https://code.claude.com/docs/en/quickstart"
          target="_blank"
          rel="noopener noreferrer"
          className="install-link"
        >
          Installation Guide
        </a>
        <button onClick={refetch} data-testid="retry-button">
          Check Again
        </button>
      </div>
    );
  }

  return (
    <div className="status-card status-success" data-testid="claude-status-card">
      <h2>Claude Code Status</h2>
      <div className="status-details">
        <p className="success-message">✓ Claude Code is installed</p>
        {version && (
          <p className="detail-item" data-testid="version-info">
            <strong>Version:</strong> {version}
          </p>
        )}
        {path && (
          <p className="detail-item path-info" data-testid="path-info">
            <strong>Location:</strong> {path}
          </p>
        )}
      </div>
      <button onClick={refetch} data-testid="refresh-button">
        Refresh Status
      </button>
    </div>
  );
};
