/**
 * Server Detail View Component
 * Shows detailed information about an MCP server
 */

import React from 'react';
import type { MCPServer } from '@/shared/types/mcp.types';
import './MCPManager.css';

export interface ServerDetailViewProps {
  server: MCPServer;
  onClose: () => void;
  onRemove: () => void;
}

export const ServerDetailView: React.FC<ServerDetailViewProps> = ({
  server,
  onClose,
  onRemove,
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Show toast notification
  };

  return (
    <div className="server-detail-view">
      <div className="detail-header">
        <h2>{server.name}</h2>
        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="detail-body">
        <div className="detail-section">
          <h3>Basic Information</h3>
          <div className="detail-row">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{server.name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Transport:</span>
            <span className="detail-value">{server.transport}</span>
          </div>
          {server.scope && (
            <div className="detail-row">
              <span className="detail-label">Scope:</span>
              <span className="detail-value">{server.scope}</span>
            </div>
          )}
          {server.scope === 'project' && server.projectPath && (
            <div className="detail-row">
              <span className="detail-label">Project Path:</span>
              <span className="detail-value code" title="Full path">
                {server.projectPath}
              </span>
            </div>
          )}
        </div>

        {server.command && (
          <div className="detail-section">
            <h3>Command Configuration</h3>
            <div className="detail-row">
              <span className="detail-label">Command:</span>
              <span className="detail-value code">
                {server.command}
                <button
                  className="btn-icon"
                  onClick={() => copyToClipboard(server.command || '')}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </span>
            </div>
            {server.args && server.args.length > 0 && (
              <div className="detail-row">
                <span className="detail-label">Arguments:</span>
                <div className="detail-value">
                  <ul className="args-list">
                    {server.args.map((arg, i) => (
                      <li key={i} className="code">
                        {arg}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {server.url && (
          <div className="detail-section">
            <h3>URL Configuration</h3>
            <div className="detail-row">
              <span className="detail-label">URL:</span>
              <span className="detail-value code">
                {server.url}
                <button
                  className="btn-icon"
                  onClick={() => copyToClipboard(server.url || '')}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </span>
            </div>
          </div>
        )}

        {server.env && Object.keys(server.env).length > 0 && (
          <div className="detail-section">
            <h3>Environment Variables</h3>
            {Object.entries(server.env).map(([key, value]) => (
              <div key={key} className="detail-row">
                <span className="detail-label code">{key}:</span>
                <span className="detail-value code masked">{value}</span>
              </div>
            ))}
          </div>
        )}

        {server.headers && Object.keys(server.headers).length > 0 && (
          <div className="detail-section">
            <h3>HTTP Headers</h3>
            {Object.entries(server.headers).map(([key, value]) => (
              <div key={key} className="detail-row">
                <span className="detail-label code">{key}:</span>
                <span className="detail-value code masked">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="detail-actions">
        <button className="btn btn-danger" onClick={onRemove}>
          Remove Server
        </button>
      </div>
    </div>
  );
};
