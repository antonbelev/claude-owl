import React, { useState } from 'react';
import { Plus, Search, Globe, Server } from 'lucide-react';
import { useMCP } from '../../hooks/useMCP';
import type { MCPServer, AddMCPServerRequest } from '@/shared/types';
import { PageHeader } from '../common/PageHeader';
import { ServerCard } from './ServerCard';
import { AddServerForm } from './AddServerForm';
import { ConnectionTester } from './ConnectionTester';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { RemoteServersBrowser } from '../RemoteMCPBrowser';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export const MCPServersManager: React.FC = () => {
  const { servers, loading, error, addServer, removeServer, testConnection, listServers } =
    useMCP();

  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<MCPServer | null>(null);
  const [showTester, setShowTester] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'installed' | 'discover'>('installed');

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
   * Handle server added from remote browser
   */
  const handleRemoteServerAdded = () => {
    listServers();
    setActiveTab('installed');
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

  return (
    <div className="h-full flex flex-col p-8 bg-white" data-testid="mcp-servers-manager">
      <PageHeader
        title="MCP Servers"
        description="Manage Model Context Protocol server integrations"
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'installed' | 'discover')} className="flex-1 flex flex-col">
        <TabsList className="mb-4">
          <TabsTrigger value="installed" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Installed Servers
            {servers.length > 0 && (
              <span className="ml-1 bg-neutral-200 text-neutral-700 text-xs px-1.5 py-0.5 rounded-full">
                {servers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Discover Remote Servers
          </TabsTrigger>
        </TabsList>

        {/* Installed Servers Tab */}
        <TabsContent value="installed" className="flex-1 flex flex-col mt-0">
          {/* Actions and Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search servers by name or description..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Server
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-neutral-600">Loading MCP servers...</p>
            </div>
          )}

          {/* Error State */}
          {error && servers.length === 0 && !loading && (
            <div className="flex-1 flex items-center justify-center">
              <Alert variant="destructive" className="max-w-md">
                <AlertDescription>Error: {error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Servers List */}
          {!loading && (
            <div className="flex-1 overflow-auto">
              {filteredServers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Server className="h-12 w-12 text-neutral-300 mb-4" />
                  <p className="text-neutral-600 mb-2">
                    {searchQuery ? 'No servers match your search' : 'No MCP servers configured yet'}
                  </p>
                  <p className="text-sm text-neutral-400 mb-4">
                    Add a custom server or discover remote servers from verified providers
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowAddForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom Server
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('discover')}>
                      <Globe className="h-4 w-4 mr-2" />
                      Discover Remote Servers
                    </Button>
                  </div>
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
          )}
        </TabsContent>

        {/* Discover Remote Servers Tab */}
        <TabsContent value="discover" className="flex-1 flex flex-col mt-0">
          <RemoteServersBrowser onServerAdded={handleRemoteServerAdded} />
        </TabsContent>
      </Tabs>

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
