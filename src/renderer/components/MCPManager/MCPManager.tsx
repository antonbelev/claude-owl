/**
 * MCP Manager Component
 * Main component for managing MCP servers
 */

import React, { useState } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { useMCPServers } from '../../hooks/useMCPServers';
import { ServerCard } from './ServerCard';
import { AddServerForm } from './AddServerForm';
import { ServerDetailView } from './ServerDetailView';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import type { MCPServer, MCPScope, AddMCPServerRequest } from '@/shared/types/mcp.types';

type TabType = 'installed' | 'add';

export const MCPManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('installed');
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null);
  const [scopeFilter, setScopeFilter] = useState<MCPScope | undefined>(undefined);
  const { servers, loading, error, addServer, removeServer, refresh } = useMCPServers(scopeFilter);

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
    <div className="h-full flex flex-col p-8 bg-white">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">MCP Servers Manager</h1>
        <p className="text-neutral-600">
          Manage Model Context Protocol servers that extend Claude Code capabilities.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-neutral-200 mb-6">
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'installed'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
          onClick={() => setActiveTab('installed')}
        >
          Installed Servers ({servers.length})
        </button>
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'add'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
          onClick={() => setActiveTab('add')}
        >
          Add Server
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'installed' && (
          <div className="space-y-4">
            {/* Actions */}
            <div className="flex gap-4">
              <select
                value={scopeFilter || 'all'}
                onChange={e =>
                  setScopeFilter(
                    e.target.value === 'all' ? undefined : (e.target.value as MCPScope)
                  )
                }
                disabled={loading}
                className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Scopes</option>
                <option value="user">User (Global)</option>
                <option value="project">Project</option>
                <option value="local">Local</option>
              </select>
              <Button variant="outline" onClick={refresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Error:</strong> {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {loading && <div className="text-center py-8 text-neutral-600">Loading servers...</div>}

            {/* Server List */}
            {!loading && !selectedServer && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {servers.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-neutral-600 mb-4">No MCP servers installed.</p>
                    <Button onClick={() => setActiveTab('add')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Server
                    </Button>
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
          <div>
            <AddServerForm onSubmit={handleAddServer} onCancel={() => setActiveTab('installed')} />
          </div>
        )}
      </div>
    </div>
  );
};
