import React, { useState } from 'react';
import { useMCP } from '../../hooks/useMCP';
import type { MCPServer, AddMCPServerRequest } from '@/shared/types';
import { PageHeader } from '../common/PageHeader';
import { ServerCard } from './ServerCard';
import { AddServerForm } from './AddServerForm';
import { ConnectionTester } from './ConnectionTester';
import { ConfirmDialog } from '../common/ConfirmDialog';
import './MCPServersManager.css';

export const MCPServersManager: React.FC = () => {
  const { servers, loading, error, addServer, removeServer, testConnection, listServers } =
    useMCP();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MCPServer | null>(null);
  const [showTester, setShowTester] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Handle adding a new server
   */
  const handleAddServer = async (config: AddMCPServerRequest) => {
    try {
      await addServer(config);
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to add server:', err);
      // Error is handled by the hook
    }
  };

  /**
   * Handle testing server connection
   */
  const handleTestConnection = (serverName: string) => {
    setShowTester(serverName);
  };

  /**
   * Handle deleting a server
   */
  const handleDeleteServer = (server: MCPServer) => {
    // Can't delete plugin servers
    if (server.scope === 'plugin' || server.scope === 'mcp') {
      return;
    }
    setDeleteConfirm(server);
  };

  /**
   * Confirm delete action
   */
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await removeServer({
        name: deleteConfirm.name,
      });
      setSelectedServer(null);
    } catch (err) {
      console.error('Failed to delete server:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  /**
   * Filter servers based on search
   */
  const filteredServers = servers.filter((server) => {
    const matchesSearch =
      !searchQuery ||
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (server.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    return matchesSearch;
  });

  // Loading state
  if (loading) {
    return (
      <div className="mcp-servers-manager" data-testid="mcp-servers-manager">
        <PageHeader
          title="MCP Servers"
          description="Manage Model Context Protocol server integrations"
        />
        <div className="mcp-loading">
          <p>Loading MCP servers...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && servers.length === 0) {
    return (
      <div className="mcp-servers-manager" data-testid="mcp-servers-manager">
        <PageHeader
          title="MCP Servers"
          description="Manage Model Context Protocol server integrations"
          actions={[
            {
              label: 'Retry',
              onClick: listServers,
              variant: 'secondary',
            },
          ]}
        />
        <div className="mcp-error">
          <p className="error-message">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mcp-servers-manager" data-testid="mcp-servers-manager">
      <PageHeader
        title="MCP Servers"
        description="Manage Model Context Protocol server integrations"
        actions={[
          {
            label: '+ Add Server',
            onClick: () => setShowAddForm(true),
            variant: 'primary',
          },
        ]}
      />

      {/* Search and Filter */}
      <div className="mcp-controls">
        <div className="mcp-search">
          <input
            type="text"
            placeholder="Search servers by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mcp-search-input"
          />
        </div>

      </div>

      {/* Servers List */}
      <div className="mcp-content">
        {filteredServers.length === 0 ? (
          <div className="mcp-empty">
            <p>
              {searchQuery
                ? 'No servers match your search'
                : 'No MCP servers configured yet'}
            </p>
            <button onClick={() => setShowAddForm(true)} className="btn-add-empty">
              Add Your First Server
            </button>
          </div>
        ) : (
          <div className="mcp-servers-grid">
            {filteredServers.map((server) => (
              <ServerCard
                key={`${server.scope}-${server.name}`}
                server={server}
                isTesting={showTester === server.name}
                onTest={() => handleTestConnection(server.name)}
                onDelete={() => handleDeleteServer(server)}
                onClick={() => setSelectedServer(server)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Server Modal */}
      {showAddForm && (
        <div className="mcp-modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="mcp-modal-content" onClick={(e) => e.stopPropagation()}>
            <AddServerForm
              onSubmit={handleAddServer}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Delete MCP Server"
          message={`Are you sure you want to delete the server "${deleteConfirm.name}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
          confirmText="Delete"
          confirmVariant="danger"
        />
      )}

      {/* Connection Tester */}
      {showTester && (
        <ConnectionTester
          serverName={showTester}
          onTest={testConnection}
          onClose={() => setShowTester(null)}
        />
      )}

      {/* Show error toast if needed */}
      {error && servers.length > 0 && (
        <div className="mcp-error-toast">{error}</div>
      )}
    </div>
  );
};
