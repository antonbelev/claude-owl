import React, { useState, useMemo } from 'react';
import { Bot, Plus, Search, X, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { useAgents } from '../../hooks/useAgents';
import type { Agent, AgentFrontmatter } from '@/shared/types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PageHeader } from '../common/PageHeader';
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
import { Textarea } from '@/renderer/components/ui/textarea';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Agent | null>(null);

  const handleCreateAgent = () => {
    setEditingAgent(null);
    setShowCreateModal(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setShowCreateModal(true);
    setSelectedAgent(null);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingAgent(null);
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
      alert('Plugin agents cannot be deleted.');
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

  // Filter agents based on search query
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) {
      return agents;
    }

    const query = searchQuery.toLowerCase();
    return agents.filter(
      agent =>
        agent.frontmatter.name.toLowerCase().includes(query) ||
        agent.frontmatter.description.toLowerCase().includes(query)
    );
  }, [agents, searchQuery]);

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
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search agents by name or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              onClick={() => setSearchQuery('')}
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <div className="flex-1">
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
          <EmptyState
            icon={Search}
            title="No Agents Found"
            description={`No agents match your search query "${searchQuery}"`}
            action={{
              label: 'Clear Search',
              onClick: () => setSearchQuery(''),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map(agent => (
              <AgentCard
                key={`${agent.location}-${agent.frontmatter.name}`}
                agent={agent}
                onView={handleViewAgent}
                onEdit={handleEditAgent}
                onDelete={handleDeleteAgent}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <AgentEditModal agent={editingAgent} onClose={handleCloseModal} onSave={saveAgent} />
      )}

      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          onClose={handleCloseDetail}
          onEdit={handleEditAgent}
          onDelete={handleDeleteAgent}
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
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onView, onEdit, onDelete }) => {
  const locationBadge =
    agent.location === 'user' ? 'User' : agent.location === 'project' ? 'Project' : 'Plugin';
  const locationVariant: 'default' | 'secondary' | 'outline' =
    agent.location === 'user' ? 'default' : agent.location === 'project' ? 'secondary' : 'outline';
  const canEdit = agent.location !== 'plugin';

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

      {canEdit && (
        <CardFooter className="flex gap-2 pt-4">
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
        </CardFooter>
      )}
    </Card>
  );
};

interface AgentEditModalProps {
  agent: Agent | null;
  onClose: () => void;
  onSave: (agent: Omit<Agent, 'lastModified'>) => Promise<boolean>;
}

const AgentEditModal: React.FC<AgentEditModalProps> = ({ agent, onClose, onSave }) => {
  const isEditing = agent !== null;
  const [name, setName] = useState(agent?.frontmatter.name || '');
  const [description, setDescription] = useState(agent?.frontmatter.description || '');
  const [content, setContent] = useState(agent?.content || '');
  const [location, setLocation] = useState<'user' | 'project'>(
    (agent?.location as 'user' | 'project') || 'user'
  );
  const [model, setModel] = useState<'sonnet' | 'opus' | 'haiku' | 'inherit' | 'default'>(
    agent?.frontmatter.model || 'default'
  );
  const [tools, setTools] = useState(agent?.frontmatter.tools?.join(', ') || '');
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Handle Escape key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, saving]);

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      setValidationError('Agent name is required');
      return;
    }

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
      setValidationError('Agent name must be lowercase with hyphens only (e.g., my-agent)');
      return;
    }

    if (!description.trim()) {
      setValidationError('Description is required');
      return;
    }

    if (!content.trim()) {
      setValidationError('System prompt is required');
      return;
    }

    setSaving(true);
    setValidationError('');

    const frontmatter: AgentFrontmatter = {
      name: name.trim(),
      description: description.trim(),
    };

    if (model && model !== 'default') {
      frontmatter.model = model as 'sonnet' | 'opus' | 'haiku' | 'inherit';
    }

    if (tools.trim()) {
      frontmatter.tools = tools
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
    }

    const agentData: Omit<Agent, 'lastModified'> = {
      frontmatter,
      content: content.trim(),
      filePath: agent?.filePath || '',
      location,
    };

    const success = await onSave(agentData);

    setSaving(false);

    if (success) {
      onClose();
    } else {
      setValidationError('Failed to save agent. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content agent-modal"
        onClick={e => e.stopPropagation()}
        style={{ background: '#ffffff' }}
      >
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Subagent' : 'Create New Subagent'}</h2>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        <div className="modal-body">
          {validationError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="agent-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="my-custom-agent"
                disabled={isEditing}
              />
              <p className="text-xs text-muted-foreground">Lowercase with hyphens only</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="agent-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What does this agent do?"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agent-location">
                  Location <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={location}
                  onValueChange={value => setLocation(value as 'user' | 'project')}
                  disabled={isEditing}
                >
                  <SelectTrigger id="agent-location">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[1100]">
                    <SelectItem value="user">User (~/.claude/agents/)</SelectItem>
                    <SelectItem value="project">Project (.claude/agents/)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-model">Model</Label>
                <Select
                  value={model}
                  onValueChange={value =>
                    setModel(value as 'sonnet' | 'opus' | 'haiku' | 'inherit' | 'default')
                  }
                >
                  <SelectTrigger id="agent-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[1100]">
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="sonnet">Sonnet</SelectItem>
                    <SelectItem value="opus">Opus</SelectItem>
                    <SelectItem value="haiku">Haiku</SelectItem>
                    <SelectItem value="inherit">Inherit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-tools">Tools (optional)</Label>
              <Input
                id="agent-tools"
                type="text"
                value={tools}
                onChange={e => setTools(e.target.value)}
                placeholder="Read, Write, Bash (comma-separated)"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated tool names. Leave empty to allow all tools.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-content">
                System Prompt <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="agent-content"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Enter the system prompt for this agent..."
                rows={12}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                The more specific and detailed your prompt, the better the agent will perform.
              </p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <Button onClick={onClose} variant="outline" disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="default" disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Subagent'}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface AgentDetailModalProps {
  agent: Agent;
  onClose: () => void;
  onEdit: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
}

const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  agent,
  onClose,
  onEdit,
  onDelete,
}) => {
  const canEdit = agent.location !== 'plugin';

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

        {canEdit && (
          <div className="modal-footer">
            <Button onClick={handleDelete} variant="destructive">
              Delete Subagent
            </Button>
            <Button onClick={handleEdit} variant="default">
              Edit Subagent
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
