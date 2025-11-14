/**
 * MCP Manager Component
 * Main component for managing MCP servers
 */

import React, { useState } from 'react';
import { useMCPServers } from '../../hooks/useMCPServers';
import { ServerCard } from './ServerCard';
import { AddServerForm } from './AddServerForm';
import { ServerDetailView } from './ServerDetailView';
import type { MCPServer, AddMCPServerRequest } from '@/shared/types/mcp.types';
import './MCPManager.css';

type TabType = 'installed' | 'add';

export const MCPManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('installed');
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null);
  // Note: Scope filtering is not supported by claude mcp list CLI, so we don't use it
  const { servers, loading, error, addServer, removeServer, refresh } = useMCPServers();

  const handleAddServer = async (request: AddMCPServerRequest) => {
    const response = await addServer(request);
    if (response.success) {
      // Switch to installed tab on success
      setActiveTab('installed');
    }
  };

  const handleRemoveServer = async (server: MCPServer) => {
    if (!server.scope) {
      alert('Cannot remove server: scope is unknown');
      return;
    }

    if (confirm(`Are you sure you want to remove the server "${server.name}"?`)) {
      await removeServer({
        name: server.name,
        scope: server.scope,
      });
      setSelectedServer(null);
    }
  };

  const handleViewDetails = (server: MCPServer) => {
    setSelectedServer(server);
  };

  return (
    <div className="mcp-manager">
      <div className="mcp-manager-header">
        <h1>MCP Servers Manager</h1>
        <p className="mcp-description">
          Manage Model Context Protocol servers that extend Claude Code capabilities.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'installed' ? 'active' : ''}`}
          onClick={() => setActiveTab('installed')}
        >
          Installed Servers ({servers.length})
        </button>
        <button
          className={`tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Add Server
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'installed' && (
          <div className="installed-tab">
            {/* Actions */}
            <div className="filters">
              <button className="btn btn-secondary" onClick={refresh} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Loading State */}
            {loading && <div className="loading">Loading servers...</div>}

            {/* Server List */}
            {!loading && !selectedServer && (
              <div className="server-grid">
                {servers.length === 0 ? (
                  <div className="empty-state">
                    <p>No MCP servers installed.</p>
                    <button className="btn btn-primary" onClick={() => setActiveTab('add')}>
                      Add Your First Server
                    </button>
                  </div>
                ) : (
                  servers.map(server => (
                    <ServerCard
                      key={server.name}
                      server={server}
                      onRemove={() => handleRemoveServer(server)}
                      onViewDetails={() => handleViewDetails(server)}
                    />
                  ))
                )}
              </div>
            )}

            {/* Server Detail View */}
            {selectedServer && (
              <ServerDetailView
                server={selectedServer}
                onClose={() => setSelectedServer(null)}
                onRemove={() => handleRemoveServer(selectedServer)}
              />
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="add-tab">
            <AddServerForm onSubmit={handleAddServer} onCancel={() => setActiveTab('installed')} />
          </div>
        )}
      </div>
    </div>
  );
};
