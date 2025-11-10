import React, { useState, useMemo } from 'react';
import { useAgents } from '../../hooks/useAgents';
import type { Agent, AgentFrontmatter } from '@/shared/types';
import './AgentsManager.css';

export const AgentsManager: React.FC = () => {
  const { agents, loading, error, refetch, saveAgent, deleteAgent } = useAgents();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleDeleteAgent = async (agent: Agent) => {
    if (!confirm(`Are you sure you want to delete the agent "${agent.frontmatter.name}"?`)) {
      return;
    }

    // Plugin agents cannot be deleted
    if (agent.location === 'plugin') {
      alert('Plugin agents cannot be deleted.');
      return;
    }

    const success = await deleteAgent(agent.filePath);
    if (success) {
      setSelectedAgent(null);
    }
  };

  // Filter agents based on search query
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) {
      return agents;
    }

    const query = searchQuery.toLowerCase();
    return agents.filter(
      (agent) =>
        agent.frontmatter.name.toLowerCase().includes(query) ||
        agent.frontmatter.description.toLowerCase().includes(query)
    );
  }, [agents, searchQuery]);

  if (loading) {
    return (
      <div className="agents-manager" data-testid="agents-manager">
        <div className="agents-header">
          <h1>Subagents Manager</h1>
        </div>
        <div className="agents-loading">
          <p>Loading subagents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="agents-manager" data-testid="agents-manager">
        <div className="agents-header">
          <h1>Subagents Manager</h1>
        </div>
        <div className="agents-error">
          <p className="error-message">Error: {error}</p>
          <button onClick={refetch} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="agents-manager" data-testid="agents-manager">
      <div className="agents-header">
        <div>
          <h1>Subagents</h1>
          <p className="header-description">
            Custom agents with specialized capabilities and system prompts
          </p>
        </div>
        <button onClick={handleCreateAgent} className="btn-create" data-testid="create-agent-btn">
          + Create Subagent
        </button>
      </div>

      {agents.length > 0 && (
        <div className="agents-search">
          <input
            type="text"
            placeholder="Search agents by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="search-clear"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      )}

      <div className="agents-content">
        {agents.length === 0 ? (
          <div className="agents-empty">
            <div className="empty-icon">🤖</div>
            <h3>No Subagents Yet</h3>
            <p>Create specialized subagents to handle specific tasks with custom system prompts and tool access.</p>
            <button onClick={handleCreateAgent} className="btn-create-empty">
              Create Your First Subagent
            </button>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="agents-empty">
            <div className="empty-icon">🔍</div>
            <h3>No Agents Found</h3>
            <p>No agents match your search query &quot;{searchQuery}&quot;</p>
            <button onClick={() => setSearchQuery('')} className="btn-create-empty">
              Clear Search
            </button>
          </div>
        ) : (
          <div className="agents-grid">
            {filteredAgents.map((agent) => (
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
        <AgentEditModal
          agent={editingAgent}
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
  const locationBadge = agent.location === 'user' ? 'User' : agent.location === 'project' ? 'Project' : 'Plugin';
  const locationClass = `location-badge location-${agent.location}`;
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
    <div className="agent-card" data-testid="agent-card" onClick={handleCardClick}>
      <div className="agent-card-header">
        <h3 className="agent-name">{agent.frontmatter.name}</h3>
        <span className={locationClass}>{locationBadge}</span>
      </div>
      <p className="agent-description">{agent.frontmatter.description}</p>

      <div className="agent-meta">
        {agent.frontmatter.model && (
          <div className="agent-model">
            <span className="meta-label">Model:</span>
            <span className="meta-value">{agent.frontmatter.model}</span>
          </div>
        )}
        {agent.frontmatter.tools && agent.frontmatter.tools.length > 0 && (
          <div className="agent-tools">
            <span className="meta-label">Tools:</span>
            <span className="meta-value">{agent.frontmatter.tools.length} configured</span>
          </div>
        )}
      </div>

      {canEdit && (
        <div className="agent-card-actions">
          <button onClick={handleEdit} className="btn-edit" title="Edit agent">
            ✏️ Edit
          </button>
          <button onClick={handleDelete} className="btn-delete" title="Delete agent">
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
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
  const [location, setLocation] = useState<'user' | 'project'>(agent?.location as 'user' | 'project' || 'user');
  const [model, setModel] = useState<'sonnet' | 'opus' | 'haiku' | 'inherit' | ''>(agent?.frontmatter.model || '');
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

    if (model) {
      frontmatter.model = model as 'sonnet' | 'opus' | 'haiku' | 'inherit';
    }

    if (tools.trim()) {
      frontmatter.tools = tools.split(',').map(t => t.trim()).filter(Boolean);
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
      <div className="modal-content agent-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Subagent' : 'Create New Subagent'}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          {validationError && (
            <div className="validation-error">{validationError}</div>
          )}

          <div className="form-group">
            <label htmlFor="agent-name">
              Name <span className="required">*</span>
            </label>
            <input
              id="agent-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-custom-agent"
              disabled={isEditing} // Can't change name when editing
              className="input-field"
            />
            <p className="field-help">Lowercase with hyphens only</p>
          </div>

          <div className="form-group">
            <label htmlFor="agent-description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="agent-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this agent do?"
              rows={3}
              className="input-field"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="agent-location">
                Location <span className="required">*</span>
              </label>
              <select
                id="agent-location"
                value={location}
                onChange={(e) => setLocation(e.target.value as 'user' | 'project')}
                disabled={isEditing} // Can't change location when editing
                className="input-field"
              >
                <option value="user">User (~/.claude/agents/)</option>
                <option value="project">Project (.claude/agents/)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="agent-model">Model</label>
              <select
                id="agent-model"
                value={model}
                onChange={(e) => setModel(e.target.value as 'sonnet' | 'opus' | 'haiku' | 'inherit' | '')}
                className="input-field"
              >
                <option value="">Default</option>
                <option value="sonnet">Sonnet</option>
                <option value="opus">Opus</option>
                <option value="haiku">Haiku</option>
                <option value="inherit">Inherit</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="agent-tools">Tools (optional)</label>
            <input
              id="agent-tools"
              type="text"
              value={tools}
              onChange={(e) => setTools(e.target.value)}
              placeholder="Read, Write, Bash (comma-separated)"
              className="input-field"
            />
            <p className="field-help">Comma-separated tool names. Leave empty to allow all tools.</p>
          </div>

          <div className="form-group">
            <label htmlFor="agent-content">
              System Prompt <span className="required">*</span>
            </label>
            <textarea
              id="agent-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the system prompt for this agent..."
              rows={12}
              className="input-field code-input"
            />
            <p className="field-help">
              The more specific and detailed your prompt, the better the agent will perform.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary" disabled={saving}>
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Subagent'}
          </button>
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

const AgentDetailModal: React.FC<AgentDetailModalProps> = ({ agent, onClose, onEdit, onDelete }) => {
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
      <div className="modal-content agent-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{agent.frontmatter.name}</h2>
            <span className={`location-badge location-${agent.location}`}>
              {agent.location.charAt(0).toUpperCase() + agent.location.slice(1)}
            </span>
          </div>
          <button onClick={onClose} className="modal-close">×</button>
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
                  <span key={idx} className="tool-badge">{tool}</span>
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
            <button onClick={handleDelete} className="btn-danger">
              Delete Subagent
            </button>
            <button onClick={handleEdit} className="btn-primary">
              Edit Subagent
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
