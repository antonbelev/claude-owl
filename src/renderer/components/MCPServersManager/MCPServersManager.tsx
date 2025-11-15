import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useMCP } from '../../hooks/useMCP';
import type { MCPServer, AddMCPServerRequest } from '@/shared/types';
import { PageHeader } from '../common/PageHeader';
import { ServerCard } from './ServerCard';
import { AddServerForm } from './AddServerForm';
import { ConnectionTester } from './ConnectionTester';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent } from '../ui/dialog';

export const MCPServersManager: React.FC = () => {
  const { servers, loading, error, addServer, removeServer, testConnection, listServers } =
    useMCP();

  const [showAddForm, setShowAddForm] = useState(false);
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
    // All servers are deletable since they are all user-level
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
        scope: deleteConfirm.scope || 'user', // Use server's scope or default to user
      });
    } catch (err) {
      console.error('Failed to delete server:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  /**
   * Filter servers based on search
   */
  const filteredServers = servers.filter(server => {
    const matchesSearch =
      !searchQuery ||
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (server.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    return matchesSearch;
  });

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex flex-col p-8 bg-white" data-testid="mcp-servers-manager">
        <PageHeader
          title="MCP Servers"
          description="Manage Model Context Protocol server integrations"
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-neutral-600">Loading MCP servers...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && servers.length === 0) {
    return (
      <div className="h-full flex flex-col p-8 bg-white" data-testid="mcp-servers-manager">
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
        <div className="flex-1 flex items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>Error: {error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-8 bg-white" data-testid="mcp-servers-manager">
      <PageHeader
        title="MCP Servers"
        description="Manage Model Context Protocol server integrations"
        actions={[
          {
            label: '+ Add Server',
            onClick: () => setShowAddForm(true),
            variant: 'default',
          },
        ]}
      />

      {/* Search and Filter */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search servers by name or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Servers List */}
      <div className="flex-1 overflow-auto">
        {filteredServers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-neutral-600 mb-4">
              {searchQuery ? 'No servers match your search' : 'No MCP servers configured yet'}
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Server
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServers.map(server => (
              <ServerCard
                key={`${server.scope}-${server.name}`}
                server={server}
                isTesting={showTester === server.name}
                onTest={() => handleTestConnection(server.name)}
                onDelete={() => handleDeleteServer(server)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Server Modal */}
      {showAddForm && (
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <AddServerForm onSubmit={handleAddServer} onCancel={() => setShowAddForm(false)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Delete MCP Server"
          message={`Are you sure you want to delete the server "${deleteConfirm.name}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
          confirmText="Delete"
          isDangerous={true}
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
        <Alert variant="destructive" className="fixed bottom-4 right-4 w-auto">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
