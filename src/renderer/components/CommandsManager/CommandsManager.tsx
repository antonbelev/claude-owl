import React, { useState, useMemo } from 'react';
import { useCommands } from '../../hooks/useCommands';
import type { CommandWithMetadata } from '@/shared/types/command.types';
import { CommandEditor } from '../CommandEditor/CommandEditor';
import { GitHubImportDialog } from '../GitHubImport/GitHubImportDialog';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PageHeader } from '../common/PageHeader';
import { Card, CardContent, CardHeader, CardFooter } from '@/renderer/components/ui/card';
import { Button } from '@/renderer/components/ui/button';
import { Badge } from '@/renderer/components/ui/badge';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/components/ui/select';
import { Terminal, X, Search, Pencil, Trash2, Download, Info, Clock } from 'lucide-react';

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
      <div className="h-full flex flex-col bg-white p-8" data-testid="commands-manager">
        <PageHeader
          title="Slash Commands"
          description="Custom slash commands that extend Claude Code functionality"
        />
        <div className="text-center py-16">
          <p className="text-gray-500">Loading commands...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col bg-white p-8" data-testid="commands-manager">
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
        <div className="text-center py-16">
          <Alert variant="destructive">
            <AlertDescription>Error: {error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white p-8" data-testid="commands-manager">
      <PageHeader
        title="Slash Commands"
        description="Custom slash commands that extend Claude Code functionality"
        actions={[
          {
            label: 'Import from GitHub',
            onClick: handleImportCommand,
            variant: 'secondary',
            icon: Download,
          },
          {
            label: '+ Create Command',
            onClick: handleCreateCommand,
            variant: 'default',
          },
        ]}
      />

      {commands.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search commands by name, description, or namespace..."
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
                <SelectItem value="all">All ({commands.length})</SelectItem>
                <SelectItem value="user">
                  User ({commands.filter(c => c.location === 'user').length})
                </SelectItem>
                <SelectItem value="project">
                  Project ({commands.filter(c => c.location === 'project').length})
                </SelectItem>
                <SelectItem value="plugin">
                  Plugin ({commands.filter(c => c.location === 'plugin').length})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="flex-1 mt-8">
        {commands.length === 0 ? (
          <div className="text-center py-16">
            <Terminal className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Commands Yet</h3>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              Create custom slash commands to streamline your Claude Code workflow with reusable
              prompts and automations.
            </p>
            <Button onClick={handleCreateCommand} size="lg">
              Create Your First Command
            </Button>
          </div>
        ) : filteredCommands.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Commands Found</h3>
            <p className="text-gray-600 mb-6">
              No commands match your search criteria
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
        <div className="fixed inset-0 z-50">
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

  const locationVariant =
    command.location === 'user'
      ? 'default'
      : command.location === 'project'
        ? 'secondary'
        : 'outline';

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
    <Card
      className="cursor-pointer transition-all hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5"
      data-testid="command-card"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold text-gray-900 font-mono flex-1 break-words">
            /{command.namespace ? `${command.namespace}:` : ''}
            {command.name}
          </h3>
          <Badge variant={locationVariant} className="ml-2 shrink-0">
            {locationBadge}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {command.frontmatter.description && (
          <p className="text-gray-600 line-clamp-2">{command.frontmatter.description}</p>
        )}

        {command.frontmatter['argument-hint'] && (
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-xs font-semibold text-gray-700">Usage:</span>
            <code className="block text-sm font-mono text-gray-800 mt-1">
              /{command.name} {command.frontmatter['argument-hint']}
            </code>
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-sm">
          {command.frontmatter.model && (
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-700">Model:</span>
              <span className="text-gray-600">{command.frontmatter.model}</span>
            </div>
          )}
          {command.frontmatter['allowed-tools'] &&
            command.frontmatter['allowed-tools'].length > 0 && (
              <div className="flex items-center gap-1">
                <span className="font-semibold text-gray-700">Tools:</span>
                <span className="text-gray-600">
                  {command.frontmatter['allowed-tools'].length} configured
                </span>
              </div>
            )}
        </div>
      </CardContent>
      {canEdit && (
        <CardFooter className="gap-2">
          <Button onClick={handleEdit} variant="outline" size="sm" className="flex-1">
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button onClick={handleDelete} variant="destructive" size="sm" className="flex-1">
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </CardFooter>
      )}
    </Card>
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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const locationVariant =
    command.location === 'user'
      ? 'default'
      : command.location === 'project'
        ? 'secondary'
        : 'outline';

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold font-mono">
              /{command.namespace ? `${command.namespace}:` : ''}
              {command.name}
            </h2>
            <Badge variant={locationVariant}>
              {command.location.charAt(0).toUpperCase() + command.location.slice(1)}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-8">
          {command.frontmatter.description && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <p className="text-gray-600">{command.frontmatter.description}</p>
            </div>
          )}

          {command.frontmatter['argument-hint'] && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Usage</h3>
              <code className="block bg-gray-50 p-3 rounded font-mono text-sm">
                /{command.name} {command.frontmatter['argument-hint']}
              </code>
            </div>
          )}

          {command.frontmatter.model && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Model</h3>
              <p className="font-mono text-gray-700">{command.frontmatter.model}</p>
            </div>
          )}

          {command.frontmatter['allowed-tools'] &&
            command.frontmatter['allowed-tools'].length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Allowed Tools</h3>
                <div className="flex flex-wrap gap-2">
                  {command.frontmatter['allowed-tools'].map((tool, idx) => (
                    <Badge key={idx} variant="secondary">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          {command.frontmatter['disable-model-invocation'] && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Model invocation disabled - Claude cannot invoke this command programmatically
              </AlertDescription>
            </Alert>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-3">Command Content</h3>
            <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
              {command.content}
            </pre>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">File Path:</span>
              <code className="block bg-gray-50 p-2 rounded font-mono text-xs mt-1 overflow-x-auto">
                {command.filePath}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="font-semibold text-gray-700">Last Modified:</span>
              <span className="text-gray-600">
                {new Date(command.lastModified).toLocaleString()}
              </span>
            </div>
            {command.metadata && (
              <div>
                <span className="font-semibold text-gray-700">Imported From:</span>
                <span className="block text-gray-600 mt-1">
                  {command.metadata.source.url || command.metadata.source.type}
                </span>
              </div>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-between p-6 border-t gap-3">
            <Button onClick={handleDelete} variant="destructive">
              Delete Command
            </Button>
            <Button onClick={handleEdit}>Edit Command</Button>
          </div>
        )}
      </div>
    </div>
  );
};
