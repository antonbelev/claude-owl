import React, { useState, useMemo } from 'react';
import { useCommands } from '../../hooks/useCommands';
import type { CommandWithMetadata } from '@/shared/types/command.types';
import { CommandEditor } from '../CommandEditor/CommandEditor';
import { GitHubImportDialog } from '../GitHubImport/GitHubImportDialog';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PageHeader } from '../common/PageHeader';
import './CommandsManager.css';

export const CommandsManager: React.FC = () => {
  const { commands, loading, error, refetch, createCommand, updateCommand, deleteCommand } =
    useCommands();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<CommandWithMetadata | null>(null);
  const [editingCommand, setEditingCommand] = useState<CommandWithMetadata | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<'all' | 'user' | 'project' | 'plugin'>(
    'all'
  );
  const [deleteConfirm, setDeleteConfirm] = useState<CommandWithMetadata | null>(null);

  const handleCreateCommand = () => {
    setEditingCommand(null);
    setShowCreateModal(true);
  };

  const handleEditCommand = (command: CommandWithMetadata) => {
    setEditingCommand(command);
    setShowCreateModal(true);
    setSelectedCommand(null);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingCommand(null);
  };

  const handleImportCommand = () => {
    setShowImportModal(true);
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
  };

  const handleViewCommand = (command: CommandWithMetadata) => {
    setSelectedCommand(command);
  };

  const handleCloseDetail = () => {
    setSelectedCommand(null);
  };

  const handleDeleteCommand = (command: CommandWithMetadata) => {
    // Plugin commands cannot be deleted
    if (command.location === 'plugin' || command.location === 'mcp') {
      alert('Plugin and MCP commands cannot be deleted.');
      return;
    }

    setDeleteConfirm(command);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    const result = await deleteCommand(
      deleteConfirm.filePath,
      deleteConfirm.location as 'user' | 'project'
    );
    if (result.success) {
      setSelectedCommand(null);
    } else {
      alert(`Failed to delete command: ${result.error}`);
    }
    setDeleteConfirm(null);
  };

  // Filter commands based on search query and location filter
  const filteredCommands = useMemo(() => {
    let filtered = commands;

    // Apply location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(cmd => cmd.location === locationFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        cmd =>
          cmd.name.toLowerCase().includes(query) ||
          cmd.frontmatter.description?.toLowerCase().includes(query) ||
          cmd.content.toLowerCase().includes(query) ||
          cmd.namespace?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [commands, searchQuery, locationFilter]);

  if (loading) {
    return (
      <div className="commands-manager" data-testid="commands-manager">
        <PageHeader
          title="Slash Commands"
          description="Custom slash commands that extend Claude Code functionality"
        />
        <div className="commands-loading">
          <p>Loading commands...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="commands-manager" data-testid="commands-manager">
        <PageHeader
          title="Slash Commands"
          description="Custom slash commands that extend Claude Code functionality"
          actions={[
            {
              label: 'Retry',
              onClick: refetch,
              variant: 'secondary',
            },
          ]}
        />
        <div className="commands-error">
          <p className="error-message">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="commands-manager" data-testid="commands-manager">
      <PageHeader
        title="Slash Commands"
        description="Custom slash commands that extend Claude Code functionality"
        actions={[
          {
            label: '⬇️ Import from GitHub',
            onClick: handleImportCommand,
            variant: 'primary',
          },
          {
            label: '+ Create Command',
            onClick: handleCreateCommand,
            variant: 'primary',
          },
        ]}
      />

      {commands.length > 0 && (
        <div className="commands-filters">
          <div className="commands-search">
            <input
              type="text"
              placeholder="Search commands by name, description, or namespace..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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
          <div className="location-filter">
            <label htmlFor="location-filter">Location:</label>
            <select
              id="location-filter"
              value={locationFilter}
              onChange={e =>
                setLocationFilter(e.target.value as 'all' | 'user' | 'project' | 'plugin')
              }
              className="filter-select"
            >
              <option value="all">All ({commands.length})</option>
              <option value="user">
                User ({commands.filter(c => c.location === 'user').length})
              </option>
              <option value="project">
                Project ({commands.filter(c => c.location === 'project').length})
              </option>
              <option value="plugin">
                Plugin ({commands.filter(c => c.location === 'plugin').length})
              </option>
            </select>
          </div>
        </div>
      )}

      <div className="commands-content">
        {commands.length === 0 ? (
          <div className="commands-empty">
            <div className="empty-icon">⌘</div>
            <h3>No Commands Yet</h3>
            <p>
              Create custom slash commands to streamline your Claude Code workflow with reusable
              prompts and automations.
            </p>
            <button onClick={handleCreateCommand} className="btn-create-empty">
              Create Your First Command
            </button>
          </div>
        ) : filteredCommands.length === 0 ? (
          <div className="commands-empty">
            <div className="empty-icon">🔍</div>
            <h3>No Commands Found</h3>
            <p>
              No commands match your search criteria
              {searchQuery && ` "${searchQuery}"`}
              {locationFilter !== 'all' && ` in ${locationFilter} location`}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setLocationFilter('all');
              }}
              className="btn-create-empty"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="commands-grid">
            {filteredCommands.map(command => (
              <CommandCard
                key={`${command.location}-${command.filePath}`}
                command={command}
                onView={handleViewCommand}
                onEdit={handleEditCommand}
                onDelete={handleDeleteCommand}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="command-editor-overlay">
          <CommandEditor
            command={editingCommand || undefined}
            onSave={async commandData => {
              if (editingCommand) {
                // Update existing command
                const updateOptions: {
                  filePath: string;
                  frontmatter: any;
                  content: string;
                  namespace?: string;
                } = {
                  filePath: editingCommand.filePath,
                  frontmatter: commandData.frontmatter,
                  content: commandData.content,
                };
                if (commandData.namespace) {
                  updateOptions.namespace = commandData.namespace;
                }
                const result = await updateCommand(updateOptions);
                if (result.success) {
                  handleCloseModal();
                }
              } else {
                // Create new command
                const createOptions: {
                  name: string;
                  location: 'user' | 'project';
                  namespace?: string;
                  frontmatter: any;
                  content: string;
                } = {
                  name: commandData.name,
                  location: commandData.location,
                  frontmatter: commandData.frontmatter,
                  content: commandData.content,
                };
                if (commandData.namespace) {
                  createOptions.namespace = commandData.namespace;
                }
                const result = await createCommand(createOptions);
                if (result.success) {
                  handleCloseModal();
                }
              }
            }}
            onCancel={handleCloseModal}
          />
        </div>
      )}

      {selectedCommand && (
        <CommandDetailModal
          command={selectedCommand}
          onClose={handleCloseDetail}
          onEdit={handleEditCommand}
          onDelete={handleDeleteCommand}
        />
      )}

      {showImportModal && (
        <GitHubImportDialog
          onClose={handleCloseImportModal}
          onImportComplete={() => {
            handleCloseImportModal();
            refetch();
          }}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Command"
          message={`Are you sure you want to delete the command "/${deleteConfirm.name}"?`}
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

interface CommandCardProps {
  command: CommandWithMetadata;
  onView: (command: CommandWithMetadata) => void;
  onEdit: (command: CommandWithMetadata) => void;
  onDelete: (command: CommandWithMetadata) => void;
}

const CommandCard: React.FC<CommandCardProps> = ({ command, onView, onEdit, onDelete }) => {
  const locationBadge =
    command.location === 'user'
      ? 'User'
      : command.location === 'project'
        ? 'Project'
        : command.location === 'mcp'
          ? 'MCP'
          : 'Plugin';
  const locationClass = `location-badge location-${command.location}`;
  const canEdit = command.location !== 'plugin' && command.location !== 'mcp';

  const handleCardClick = () => {
    onView(command);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(command);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(command);
  };

  return (
    <div className="command-card" data-testid="command-card" onClick={handleCardClick}>
      <div className="command-card-header">
        <h3 className="command-name">
          /{command.namespace ? `${command.namespace}:` : ''}
          {command.name}
        </h3>
        <span className={locationClass}>{locationBadge}</span>
      </div>

      {command.frontmatter.description && (
        <p className="command-description">{command.frontmatter.description}</p>
      )}

      {command.frontmatter['argument-hint'] && (
        <div className="command-hint">
          <span className="hint-label">Usage:</span>
          <code className="hint-value">
            /{command.name} {command.frontmatter['argument-hint']}
          </code>
        </div>
      )}

      <div className="command-meta">
        {command.frontmatter.model && (
          <div className="command-model">
            <span className="meta-label">Model:</span>
            <span className="meta-value">{command.frontmatter.model}</span>
          </div>
        )}
        {command.frontmatter['allowed-tools'] &&
          command.frontmatter['allowed-tools'].length > 0 && (
            <div className="command-tools">
              <span className="meta-label">Tools:</span>
              <span className="meta-value">
                {command.frontmatter['allowed-tools'].length} configured
              </span>
            </div>
          )}
      </div>

      {canEdit && (
        <div className="command-card-actions">
          <button onClick={handleEdit} className="btn-edit" title="Edit command">
            ✏️ Edit
          </button>
          <button onClick={handleDelete} className="btn-delete" title="Delete command">
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  );
};

interface CommandDetailModalProps {
  command: CommandWithMetadata;
  onClose: () => void;
  onEdit: (command: CommandWithMetadata) => void;
  onDelete: (command: CommandWithMetadata) => void;
}

const CommandDetailModal: React.FC<CommandDetailModalProps> = ({
  command,
  onClose,
  onEdit,
  onDelete,
}) => {
  const canEdit = command.location !== 'plugin' && command.location !== 'mcp';

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
    onEdit(command);
  };

  const handleDelete = () => {
    onDelete(command);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content command-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>
              /{command.namespace ? `${command.namespace}:` : ''}
              {command.name}
            </h2>
            <span className={`location-badge location-${command.location}`}>
              {command.location.charAt(0).toUpperCase() + command.location.slice(1)}
            </span>
          </div>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        <div className="modal-body">
          {command.frontmatter.description && (
            <div className="detail-section">
              <h3>Description</h3>
              <p>{command.frontmatter.description}</p>
            </div>
          )}

          {command.frontmatter['argument-hint'] && (
            <div className="detail-section">
              <h3>Usage</h3>
              <code className="code-text">
                /{command.name} {command.frontmatter['argument-hint']}
              </code>
            </div>
          )}

          {command.frontmatter.model && (
            <div className="detail-section">
              <h3>Model</h3>
              <p className="code-text">{command.frontmatter.model}</p>
            </div>
          )}

          {command.frontmatter['allowed-tools'] &&
            command.frontmatter['allowed-tools'].length > 0 && (
              <div className="detail-section">
                <h3>Allowed Tools</h3>
                <div className="tools-list">
                  {command.frontmatter['allowed-tools'].map((tool, idx) => (
                    <span key={idx} className="tool-badge">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {command.frontmatter['disable-model-invocation'] && (
            <div className="detail-section">
              <p className="info-message">
                ⓘ Model invocation disabled - Claude cannot invoke this command programmatically
              </p>
            </div>
          )}

          <div className="detail-section">
            <h3>Command Content</h3>
            <pre className="code-block">{command.content}</pre>
          </div>

          <div className="detail-section detail-meta">
            <div className="meta-item">
              <span className="meta-label">File Path:</span>
              <code className="meta-value">{command.filePath}</code>
            </div>
            <div className="meta-item">
              <span className="meta-label">Last Modified:</span>
              <span className="meta-value">{new Date(command.lastModified).toLocaleString()}</span>
            </div>
            {command.metadata && (
              <div className="meta-item">
                <span className="meta-label">Imported From:</span>
                <span className="meta-value">
                  {command.metadata.source.url || command.metadata.source.type}
                </span>
              </div>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="modal-footer">
            <button onClick={handleDelete} className="btn-danger">
              Delete Command
            </button>
            <button onClick={handleEdit} className="btn-primary">
              Edit Command
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
