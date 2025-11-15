/**
 * Server Card Component
 * Displays an MCP server in a card format
 */

import React from 'react';
import type { MCPServer } from '@/shared/types/mcp.types';
import './MCPManager.css';

export interface ServerCardProps {
  server: MCPServer;
  onRemove: () => void;
  onViewDetails: () => void;
}

export const ServerCard: React.FC<ServerCardProps> = ({ server, onRemove, onViewDetails }) => {
  const getScopeColor = (scope?: string): string => {
    switch (scope) {
      case 'user':
        return '#4CAF50'; // Green
      case 'project':
        return '#2196F3'; // Blue
      case 'local':
        return '#FF9800'; // Orange
      default:
        return '#757575'; // Gray
    }
  };

  const getTransportIcon = (transport: string): string => {
    switch (transport) {
      case 'stdio':
        return '⚡';
      case 'http':
        return '🌐';
      case 'sse':
        return '📡';
      default:
        return '•';
    }
  };

  return (
    <div className="server-card">
      <div className="server-card-header">
        <div className="server-card-title">
          <span className="transport-icon">{getTransportIcon(server.transport)}</span>
          <h3>{server.name}</h3>
        </div>
        {server.scope && (
          <span
            className="scope-badge"
            style={{ backgroundColor: getScopeColor(server.scope), color: 'white' }}
          >
            {server.scope}
          </span>
        )}
      </div>

      <div className="server-card-body">
        <div className="server-info">
          {/* Project Path (for project-scoped servers) */}
          {server.scope === 'project' && server.projectPath && (
            <div className="info-row">
              <span className="info-label">Project:</span>
              <span className="info-value" title={server.projectPath}>
                {server.projectPath.split('/').pop() || server.projectPath}
              </span>
            </div>
          )}

          <div className="info-row">
            <span className="info-label">Transport:</span>
            <span className="info-value">{server.transport}</span>
          </div>

          {server.command && (
            <div className="info-row">
              <span className="info-label">Command:</span>
              <span className="info-value code">{server.command}</span>
            </div>
          )}

          {server.url && (
            <div className="info-row">
              <span className="info-label">URL:</span>
              <span className="info-value code">{server.url}</span>
            </div>
          )}

          {server.env && Object.keys(server.env).length > 0 && (
            <div className="info-row">
              <span className="info-label">Env Vars:</span>
              <span className="info-value">{Object.keys(server.env).length} configured</span>
            </div>
          )}

          {server.headers && Object.keys(server.headers).length > 0 && (
            <div className="info-row">
              <span className="info-label">Headers:</span>
              <span className="info-value">{Object.keys(server.headers).length} configured</span>
            </div>
          )}
        </div>
      </div>

      <div className="server-card-actions">
        <button className="btn btn-secondary" onClick={onViewDetails}>
          View Details
        </button>
        <button className="btn btn-danger" onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  );
};
