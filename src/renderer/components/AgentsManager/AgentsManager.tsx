import React, { useState, useMemo } from 'react';
import { Bot, Plus, Search, X, Edit2, Trash2, AlertCircle, Copy } from 'lucide-react';
import { useAgents } from '../../hooks/useAgents';
import type { Agent } from '@/shared/types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PageHeader } from '../common/PageHeader';
import { AgentEditModal } from './AgentEditModal';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/renderer/components/ui/card';
import { Button } from '@/renderer/components/ui/button';
import { Badge } from '@/renderer/components/ui/badge';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/components/ui/select';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import { EmptyState } from '../common/EmptyState';

export const AgentsManager: React.FC = () => {
  const { agents, loading, error, refetch, saveAgent, deleteAgent } = useAgents();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [copyingAgent, setCopyingAgent] = useState<Agent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<'all' | 'user' | 'project' | 'plugin'>(
    'all'
  );
  const [deleteConfirm, setDeleteConfirm] = useState<Agent | null>(null);

  const handleCreateAgent = () => {
    setEditingAgent(null);
    setCopyingAgent(null);
    setShowCreateModal(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setCopyingAgent(null);
    setShowCreateModal(true);
    setSelectedAgent(null);
  };

  const handleCopyAgent = (agent: Agent) => {
    // Create a copy by opening the edit modal with agent data but no agent reference
    // This allows user to save as new agent in user/project location
    setCopyingAgent(agent);
    setEditingAgent(null);
    setShowCreateModal(true);
    setSelectedAgent(null);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingAgent(null);
    setCopyingAgent(null);
  };

  const handleViewAgent = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleCloseDetail = () => {
    setSelectedAgent(null);
  };

  const handleDeleteAgent = (agent: Agent) => {
    // Plugin agents cannot be deleted
    if (agent.location === 'plugin') {
      return;
    }

    setDeleteConfirm(agent);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    const success = await deleteAgent(deleteConfirm.filePath);
    if (success) {
      setSelectedAgent(null);
    }
    setDeleteConfirm(null);
  };

  // Filter agents based on search query and location filter
  const filteredAgents = useMemo(() => {
    let filtered = agents;

    // Apply location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(agent => agent.location === locationFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        agent =>
          agent.frontmatter.name.toLowerCase().includes(query) ||
          agent.frontmatter.description.toLowerCase().includes(query) ||
          agent.content.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [agents, searchQuery, locationFilter]);

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white p-8" data-testid="agents-manager">
        <PageHeader
          title="Subagents"
          description="Custom agents with specialized capabilities and system prompts"
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-neutral-600">Loading subagents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col bg-white p-8" data-testid="agents-manager">
        <PageHeader
          title="Subagents"
          description="Custom agents with specialized capabilities and system prompts"
          actions={[
            {
              label: 'Retry',
              onClick: refetch,
              variant: 'secondary',
            },
          ]}
        />
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white p-8" data-testid="agents-manager">
      <PageHeader
        title="Subagents"
        description="Custom agents with specialized capabilities and system prompts"
        actions={[
          {
            label: 'Create Subagent',
            onClick: handleCreateAgent,
            variant: 'default',
            icon: Plus,
          },
        ]}
      />

      {agents.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search subagents by name, description, or content..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="location-filter" className="shrink-0">
              Location:
            </Label>
            <Select
              value={locationFilter}
              onValueChange={v => setLocationFilter(v as 'all' | 'user' | 'project' | 'plugin')}
            >
              <SelectTrigger id="location-filter" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({agents.length})</SelectItem>
                <SelectItem value="user">
                  User ({agents.filter(a => a.location === 'user').length})
                </SelectItem>
                <SelectItem value="project">
                  Project ({agents.filter(a => a.location === 'project').length})
                </SelectItem>
                <SelectItem value="plugin">
                  Plugin ({agents.filter(a => a.location === 'plugin').length})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="flex-1 mt-8">
        {agents.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="No Subagents Yet"
            description="Create specialized subagents to handle specific tasks with custom system prompts and tool access."
            action={{
              label: 'Create Your First Subagent',
              onClick: handleCreateAgent,
            }}
          />
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Subagents Found</h3>
            <p className="text-gray-600 mb-6">
              No subagents match your search criteria
              {searchQuery && ` "${searchQuery}"`}
              {locationFilter !== 'all' && ` in ${locationFilter} location`}
            </p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setLocationFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map(agent => (
              <AgentCard
                key={`${agent.location}-${agent.frontmatter.name}`}
                agent={agent}
                onView={handleViewAgent}
                onEdit={handleEditAgent}
                onDelete={handleDeleteAgent}
                onCopy={handleCopyAgent}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <AgentEditModal
          agent={editingAgent}
          copyFrom={copyingAgent}
          onClose={handleCloseModal}
          onSave={saveAgent}
        />
      )}

      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          onClose={handleCloseDetail}
          onEdit={handleEditAgent}
          onDelete={handleDeleteAgent}
          onCopy={handleCopyAgent}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Subagent"
          message={`Are you sure you want to delete the agent "${deleteConfirm.frontmatter.name}"?`}
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

interface AgentCardProps {
  agent: Agent;
  onView: (agent: Agent) => void;
  onEdit: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
  onCopy: (agent: Agent) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onView, onEdit, onDelete, onCopy }) => {
  const locationBadge =
    agent.location === 'user' ? 'User' : agent.location === 'project' ? 'Project' : 'Plugin';
  const locationVariant: 'default' | 'secondary' | 'outline' =
    agent.location === 'user' ? 'default' : agent.location === 'project' ? 'secondary' : 'outline';
  const canEdit = agent.location !== 'plugin';
  const isPlugin = agent.location === 'plugin';

  const handleCardClick = () => {
    onView(agent);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(agent);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(agent);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(agent);
  };

  return (
    <Card
      className="cursor-pointer hover:border-primary transition-colors"
      data-testid="agent-card"
      onClick={handleCardClick}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-base">{agent.frontmatter.name}</span>
          <Badge variant={locationVariant}>{locationBadge}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-neutral-600">{agent.frontmatter.description}</p>

        <div className="space-y-2 text-xs">
          {agent.frontmatter.model && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-neutral-700">Model:</span>
              <span className="text-neutral-600">{agent.frontmatter.model}</span>
            </div>
          )}
          {agent.frontmatter.tools && agent.frontmatter.tools.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-neutral-700">Tools:</span>
              <span className="text-neutral-600">{agent.frontmatter.tools.length} configured</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-4">
        {canEdit ? (
          <>
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              className="flex-1"
              title="Edit agent"
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              size="sm"
              className="flex-1 text-destructive hover:bg-destructive/10"
              title="Delete agent"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </>
        ) : isPlugin ? (
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="flex-1"
            title="Copy to user or project"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy to My Agents
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
};

interface AgentDetailModalProps {
  agent: Agent;
  onClose: () => void;
  onEdit: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
  onCopy: (agent: Agent) => void;
}

const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  agent,
  onClose,
  onEdit,
  onDelete,
  onCopy,
}) => {
  const canEdit = agent.location !== 'plugin';
  const isPlugin = agent.location === 'plugin';

  // Handle Escape key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleEdit = () => {
    onEdit(agent);
  };

  const handleDelete = () => {
    onDelete(agent);
  };

  const handleCopy = () => {
    onCopy(agent);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content agent-detail-modal"
        onClick={e => e.stopPropagation()}
        style={{ background: '#ffffff' }}
      >
        <div className="modal-header">
          <div>
            <h2>{agent.frontmatter.name}</h2>
            <span className={`location-badge location-${agent.location}`}>
              {agent.location.charAt(0).toUpperCase() + agent.location.slice(1)}
            </span>
          </div>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h3>Description</h3>
            <p>{agent.frontmatter.description}</p>
          </div>

          {agent.frontmatter.model && (
            <div className="detail-section">
              <h3>Model</h3>
              <p className="code-text">{agent.frontmatter.model}</p>
            </div>
          )}

          {agent.frontmatter.tools && agent.frontmatter.tools.length > 0 && (
            <div className="detail-section">
              <h3>Tools</h3>
              <div className="tools-list">
                {agent.frontmatter.tools.map((tool, idx) => (
                  <span key={idx} className="tool-badge">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3>System Prompt</h3>
            <pre className="code-block">{agent.content}</pre>
          </div>

          <div className="detail-section detail-meta">
            <div className="meta-item">
              <span className="meta-label">File Path:</span>
              <code className="meta-value">{agent.filePath}</code>
            </div>
            <div className="meta-item">
              <span className="meta-label">Last Modified:</span>
              <span className="meta-value">{new Date(agent.lastModified).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {canEdit ? (
            <>
              <Button onClick={handleDelete} variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Subagent
              </Button>
              <Button onClick={handleEdit} variant="default">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Subagent
              </Button>
            </>
          ) : isPlugin ? (
            <Button onClick={handleCopy} variant="default">
              <Copy className="h-4 w-4 mr-2" />
              Copy to My Agents
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
