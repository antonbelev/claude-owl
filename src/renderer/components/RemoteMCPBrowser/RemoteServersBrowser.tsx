/**
 * Remote Servers Browser Component
 *
 * Main component for discovering and browsing remote MCP servers.
 *
 * @see ADR-010: Remote MCP Servers Discovery & Connection Verification
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Search, RefreshCw, ExternalLink, Heart, Grid, List, Loader2, Info } from 'lucide-react';
import type {
  RemoteMCPServer,
  RemoteMCPCategory,
  RemoteMCPAuthType,
  ConnectionTestResult,
  SecurityContext,
  SecurityWarning,
} from '@/shared/types';
import { useRemoteMCPServers } from '../../hooks/useRemoteMCPServers';
import { RemoteServerCard } from './RemoteServerCard';
import { ConnectionTestModal } from './ConnectionTestModal';
import { SecurityWarningDialog } from './SecurityWarningDialog';
import { AuthConfigModal } from './AuthConfigModal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import type { ProjectInfo } from '@/shared/types';

/**
 * Category display names
 */
const CATEGORY_LABELS: Record<RemoteMCPCategory | 'all', string> = {
  all: 'All Categories',
  'developer-tools': 'Developer Tools',
  databases: 'Databases',
  productivity: 'Productivity',
  payments: 'Payments',
  content: 'Content',
  utilities: 'Utilities',
  security: 'Security',
  analytics: 'Analytics',
};

/**
 * Auth type display names
 */
const AUTH_LABELS: Record<RemoteMCPAuthType | 'all', string> = {
  all: 'All Auth Types',
  oauth: 'OAuth',
  'api-key': 'API Key',
  header: 'Header Auth',
  open: 'Open Access',
};

export interface RemoteServersBrowserProps {
  /** Callback when a server is successfully added */
  onServerAdded?: () => void;
}

/**
 * Remote Servers Browser Component
 */
export const RemoteServersBrowser: React.FC<RemoteServersBrowserProps> = ({ onServerAdded }) => {
  // Hooks
  const {
    servers,
    loading,
    error,
    source,
    lastUpdated,
    refresh,
    getServerDetails,
    testConnection,
    addServer,
  } = useRemoteMCPServers();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RemoteMCPCategory | 'all'>('all');
  const [selectedAuthType, setSelectedAuthType] = useState<RemoteMCPAuthType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal states
  const [testingServer, setTestingServer] = useState<RemoteMCPServer | null>(null);
  const [addingServer, setAddingServer] = useState<RemoteMCPServer | null>(null);
  const [securityContext, setSecurityContext] = useState<SecurityContext | null>(null);
  const [securityWarnings, setSecurityWarnings] = useState<SecurityWarning[]>([]);
  const [configuringAuth, setConfiguringAuth] = useState<RemoteMCPServer | null>(null);

  // Scope selection state (currently using user scope by default)
  const [scope] = useState<'user' | 'project'>('user');
  const [selectedProject] = useState<ProjectInfo | null>(null);

  // Test results cache
  const [testResults, setTestResults] = useState<Map<string, ConnectionTestResult>>(new Map());
  const [testingIds, setTestingIds] = useState<Set<string>>(new Set());

  // Filter servers
  const filteredServers = useMemo(() => {
    let result = [...servers];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        server =>
          server.name.toLowerCase().includes(query) ||
          server.description.toLowerCase().includes(query) ||
          server.provider.toLowerCase().includes(query) ||
          server.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(server => server.category === selectedCategory);
    }

    // Apply auth type filter
    if (selectedAuthType !== 'all') {
      result = result.filter(server => server.authType === selectedAuthType);
    }

    return result;
  }, [servers, searchQuery, selectedCategory, selectedAuthType]);

  // Group by category for display
  const groupedServers = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredServers };
    }

    const groups: Partial<Record<RemoteMCPCategory, RemoteMCPServer[]>> = {};
    filteredServers.forEach(server => {
      if (!groups[server.category]) {
        groups[server.category] = [];
      }
      groups[server.category]!.push(server);
    });
    return groups;
  }, [filteredServers, selectedCategory]);

  // Handle test connection
  const handleTestConnection = useCallback(
    async (server: RemoteMCPServer) => {
      setTestingIds(prev => new Set(prev).add(server.id));

      try {
        const result = await testConnection(server.endpoint, server.transport);
        setTestResults(prev => new Map(prev).set(server.id, result));
      } finally {
        setTestingIds(prev => {
          const next = new Set(prev);
          next.delete(server.id);
          return next;
        });
      }
    },
    [testConnection]
  );

  // Handle add server click
  const handleAddClick = useCallback(
    async (server: RemoteMCPServer) => {
      // Get security context
      const details = await getServerDetails(server.id);
      if (details) {
        setSecurityContext(details.securityContext);

        // Generate warnings based on security context
        const warnings: SecurityWarning[] = [];
        if (!details.securityContext.isVerifiedProvider) {
          warnings.push({
            severity: 'warning',
            title: 'Unverified Provider',
            description: 'This server is not from a verified provider.',
            recommendation: 'Review the documentation before proceeding.',
          });
        }
        if (details.securityContext.riskLevel === 'high') {
          warnings.push({
            severity: 'critical',
            title: 'High Risk',
            description: 'Multiple risk factors have been identified.',
            recommendation: 'Proceed with extreme caution.',
          });
        }
        setSecurityWarnings(warnings);
      }

      setAddingServer(server);
    },
    [getServerDetails]
  );

  // Handle confirm add - routes to auth config if needed
  const handleConfirmAdd = useCallback(async () => {
    if (!addingServer) return;

    const projectPath = scope === 'project' ? selectedProject?.path : undefined;
    if (scope === 'project' && !projectPath) {
      return; // Project must be selected
    }

    // Check if this server requires authentication
    if (addingServer.authType !== 'open') {
      // Route to auth configuration modal
      setAddingServer(null);
      setSecurityContext(null);
      setSecurityWarnings([]);
      setConfiguringAuth(addingServer);
      return;
    }

    // For open servers, add directly
    const result = await addServer(addingServer, scope, projectPath);

    if (result.success) {
      setAddingServer(null);
      setSecurityContext(null);
      setSecurityWarnings([]);
      if (onServerAdded) {
        onServerAdded();
      }
    }
  }, [addingServer, scope, selectedProject, addServer, onServerAdded]);

  // Handle auth configuration complete
  const handleAuthConfigComplete = useCallback(
    (success: boolean, _message?: string) => {
      setConfiguringAuth(null);
      if (success && onServerAdded) {
        onServerAdded();
      }
    },
    [onServerAdded]
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refresh(true);
  }, [refresh]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Remote MCP Servers</h2>
            <p className="text-sm text-neutral-500">
              Discover and connect to remote MCP servers from verified providers
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Attribution */}
        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-4">
          <span>Data sourced from</span>
          <button
            onClick={() => window.electronAPI.openExternal('https://mcpservers.org')}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
          >
            mcpservers.org
            <ExternalLink className="h-3 w-3" />
          </button>
          <Heart className="h-3 w-3 text-red-400" />
          {lastUpdated && (
            <span className="text-neutral-400">
              • Last updated: {new Date(lastUpdated).toLocaleDateString()}
            </span>
          )}
          {source === 'cache' && (
            <Badge variant="outline" className="text-xs">
              Cached
            </Badge>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search servers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select
            value={selectedCategory}
            onValueChange={value => setSelectedCategory(value as RemoteMCPCategory | 'all')}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Auth Type Filter */}
          <Select
            value={selectedAuthType}
            onValueChange={value => setSelectedAuthType(value as RemoteMCPAuthType | 'all')}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Auth Type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AUTH_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && servers.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-neutral-500">Loading remote servers...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredServers.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Info className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 mb-2">No servers found</p>
            <p className="text-sm text-neutral-400">
              {searchQuery || selectedCategory !== 'all' || selectedAuthType !== 'all'
                ? 'Try adjusting your filters'
                : 'No remote servers available'}
            </p>
          </div>
        </div>
      )}

      {/* Servers List */}
      {filteredServers.length > 0 && (
        <div className="flex-1 overflow-auto">
          {Object.entries(groupedServers).map(([category, categoryServers]) => (
            <div key={category} className="mb-8">
              {/* Category Header */}
              {selectedCategory === 'all' && (
                <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                  {CATEGORY_LABELS[category as RemoteMCPCategory]}
                  <Badge variant="secondary" className="text-xs">
                    {categoryServers?.length || 0}
                  </Badge>
                </h3>
              )}

              {/* Server Grid/List */}
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-3'
                }
              >
                {categoryServers?.map(server => (
                  <RemoteServerCard
                    key={server.id}
                    server={server}
                    isTesting={testingIds.has(server.id)}
                    testResult={testResults.get(server.id) ?? null}
                    onTestConnection={() => handleTestConnection(server)}
                    onAdd={() => handleAddClick(server)}
                    onClick={() => setTestingServer(server)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connection Test Modal */}
      {testingServer && (
        <ConnectionTestModal
          open={!!testingServer}
          onOpenChange={open => !open && setTestingServer(null)}
          server={testingServer}
          onTest={testConnection}
          onContinueToSetup={() => {
            handleAddClick(testingServer);
            setTestingServer(null);
          }}
        />
      )}

      {/* Security Warning / Add Dialog */}
      {addingServer && securityContext && (
        <SecurityWarningDialog
          open={!!addingServer}
          onOpenChange={open => {
            if (!open) {
              setAddingServer(null);
              setSecurityContext(null);
              setSecurityWarnings([]);
            }
          }}
          server={addingServer}
          securityContext={securityContext}
          warnings={securityWarnings}
          onConfirm={handleConfirmAdd}
        />
      )}

      {/* Authentication Configuration Modal */}
      {configuringAuth && (
        <AuthConfigModal
          open={!!configuringAuth}
          onOpenChange={open => {
            if (!open) {
              setConfiguringAuth(null);
            }
          }}
          server={configuringAuth}
          securityContext={securityContext || undefined}
          scope={scope}
          selectedProject={selectedProject}
          onComplete={handleAuthConfigComplete}
        />
      )}
    </div>
  );
};
