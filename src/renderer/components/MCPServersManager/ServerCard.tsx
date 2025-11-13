import React from 'react';
import type { MCPServer } from '@/shared/types';

interface ServerCardProps {
  server: MCPServer;
  isTesting?: boolean;
  onTest: () => void;
  onDelete: () => void;
  onClick?: () => void;
}

export const ServerCard: React.FC<ServerCardProps> = ({
  server,
  isTesting = false,
  onTest,
  onDelete,
  onClick,
}) => {
  /**
   * Get status badge color and icon
   */
  const getStatusDisplay = () => {
    switch (server.status) {
      case 'connected':
        return { icon: '✓', label: 'Connected', color: 'success' };
      case 'error':
        return { icon: '✕', label: 'Error', color: 'error' };
      case 'auth-required':
        return { icon: '🔑', label: 'Auth Required', color: 'warning' };
      case 'disabled':
        return { icon: '⏸', label: 'Disabled', color: 'muted' };
      case 'testing':
        return { icon: '⏳', label: 'Testing...', color: 'loading' };
      default:
        return { icon: '?', label: 'Unknown', color: 'muted' };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="server-card" onClick={onClick} role="button" tabIndex={0}>
      {/* Header */}
      <div className="server-card-header">
        <div className="server-info">
          <h3 className="server-name">{server.name}</h3>
          <span className={`server-status status-${status.color}`}>
            <span className="status-icon">{status.icon}</span>
            {status.label}
          </span>
        </div>

        {/* Actions Menu */}
        <div className="server-actions">
          <button
            className="btn-action btn-test"
            onClick={e => {
              e.stopPropagation();
              onTest();
            }}
            disabled={isTesting}
            title="Test connection"
          >
            {isTesting ? 'Testing...' : 'Test'}
          </button>
          <button
            className="btn-action btn-delete"
            onClick={e => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete server"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Transport & Details */}
      <div className="server-details">
        <div className="detail-item">
          <span className="detail-label">Transport:</span>
          <span className="detail-value">{server.transport}</span>
        </div>

        {server.command && (
          <div className="detail-item">
            <span className="detail-label">Command:</span>
            <span className="detail-value">{server.command}</span>
          </div>
        )}

        {server.url && (
          <div className="detail-item">
            <span className="detail-label">URL:</span>
            <span className="detail-value">{server.url}</span>
          </div>
        )}
      </div>

      {/* Tools Count */}
      {server.tools && server.tools.length > 0 && (
        <div className="server-tools">
          <span className="tools-count">📦 {server.tools.length} tools available</span>
        </div>
      )}

      {/* Error Message */}
      {server.status === 'error' && server.lastError && (
        <div className="server-error-msg">
          <p className="error-text">{server.lastError}</p>
        </div>
      )}

      {/* Latency */}
      {server.latency !== undefined && (
        <div className="server-latency">
          <span className="latency-value">{server.latency}ms</span>
        </div>
      )}
    </div>
  );
};
