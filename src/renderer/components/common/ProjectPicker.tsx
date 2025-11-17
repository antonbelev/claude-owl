/**
 * ProjectPicker component - Reusable project selection for scoped features
 *
 * A compact component for selecting a project when creating project-scoped configurations.
 * Used by ScopeSelector and standalone in forms that support project-level scope.
 */

import React, { useState, useMemo } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import {
  FolderIcon,
  ServerIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  CheckIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import type { ProjectInfo } from '@/shared/types';

export interface ProjectPickerProps {
  selectedProject: ProjectInfo | null;
  onSelect: (project: ProjectInfo | null) => void;
  compact?: boolean; // Compact mode shows fewer details
  allowUserLevel?: boolean; // Allow selecting "None" for user-level
  showSearch?: boolean; // Show search bar (default: true if not compact)
  maxHeight?: string; // Max height for scrollable list (default: '16rem')
  className?: string;
  disabled?: boolean;
}

export const ProjectPicker: React.FC<ProjectPickerProps> = ({
  selectedProject,
  onSelect,
  compact = false,
  allowUserLevel = false,
  showSearch = !compact,
  maxHeight = '16rem',
  className = '',
  disabled = false,
}) => {
  const { loading, projects, error, configExists, refetch } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return projects;
    }
    const query = searchQuery.toLowerCase();
    return projects.filter(
      project =>
        project.name.toLowerCase().includes(query) || project.path.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  // Loading state
  if (loading) {
    return (
      <div className={`border rounded-lg p-4 bg-gray-50 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <RefreshCwIcon className="h-4 w-4 animate-spin" />
          <span>Loading projects...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircleIcon className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button onClick={refetch} variant="outline" size="sm" className="ml-2 gap-2">
            <RefreshCwIcon className="h-4 w-4" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // No config exists
  if (!configExists) {
    return (
      <div className={`border border-amber-200 rounded-lg p-4 bg-amber-50 ${className}`}>
        <div className="flex items-center gap-2 text-amber-900 font-medium mb-2">
          <AlertCircleIcon className="h-4 w-4" />
          <span>No Claude Code Projects Found</span>
        </div>
        <p className="text-sm text-amber-800 mb-3">
          .claude.json not found. Initialize Claude Code in a project directory:
        </p>
        <code className="text-xs bg-white px-2 py-1 rounded block mb-3 border border-amber-200">
          cd /path/to/your/project && claude
        </code>
        <Button onClick={refetch} variant="outline" size="sm" className="gap-2">
          <RefreshCwIcon className="h-4 w-4" />
          Refresh
        </Button>
      </div>
    );
  }

  // No projects found
  if (projects.length === 0) {
    return (
      <div className={`border rounded-lg p-4 bg-gray-50 ${className}`}>
        <div className="flex items-center gap-2 text-gray-700 font-medium mb-2">
          <AlertCircleIcon className="h-4 w-4" />
          <span>No Projects Found</span>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          .claude.json exists but contains no projects. Run Claude Code in a project to add it.
        </p>
        <Button onClick={refetch} variant="outline" size="sm" className="gap-2">
          <RefreshCwIcon className="h-4 w-4" />
          Refresh
        </Button>
      </div>
    );
  }

  // Projects list
  return (
    <div className={`border rounded-lg p-4 bg-gray-50 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">{compact ? 'Project' : 'Select Project'}</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={refetch}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <RefreshCwIcon className="h-3 w-3" />
        </Button>
      </div>

      {/* Search (if enabled) */}
      {showSearch && projects.length > 3 && (
        <div className="relative mb-3">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            disabled={disabled}
            className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              disabled={disabled}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Project List */}
      <div className="space-y-2" style={{ maxHeight, overflowY: 'auto' }}>
        {allowUserLevel && (
          <ProjectPickerItem
            label="User-level (All Projects)"
            icon={<FolderIcon className="h-4 w-4" />}
            isSelected={!selectedProject}
            onClick={() => onSelect(null)}
            disabled={disabled}
            compact={compact}
          />
        )}

        {filteredProjects.length > 0
          ? filteredProjects.map(project => (
              <ProjectPickerItem
                key={project.path}
                project={project}
                isSelected={selectedProject?.path === project.path}
                onClick={() => onSelect(project)}
                disabled={disabled}
                compact={compact}
              />
            ))
          : searchQuery && (
              <div className="text-center py-4 text-sm text-gray-600">
                <SearchIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p>No projects found matching &quot;{searchQuery}&quot;</p>
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Clear Search
                </Button>
              </div>
            )}
      </div>
    </div>
  );
};

/**
 * Individual project picker item
 */
interface ProjectPickerItemProps {
  project?: ProjectInfo;
  label?: string;
  icon?: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
}

const ProjectPickerItem: React.FC<ProjectPickerItemProps> = ({
  project,
  label,
  icon,
  isSelected,
  onClick,
  disabled = false,
  compact = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full text-left p-3 rounded-md border transition-all
        ${
          isSelected
            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
            : 'border-gray-200 bg-white hover:border-gray-400'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className={`p-1.5 rounded ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
            {icon || (
              <FolderIcon className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-medium truncate ${compact ? 'text-xs' : ''}`}>
                {label || project?.name}
              </span>
              {isSelected && (
                <CheckIcon className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" strokeWidth={3} />
              )}
            </div>
            {!compact && project && (
              <div className="text-xs text-gray-600 truncate" title={project.path}>
                {project.path}
              </div>
            )}
          </div>
        </div>

        {project && project.mcpServerCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-600 ml-2 flex-shrink-0">
            <ServerIcon className="h-3 w-3" />
            <span>{project.mcpServerCount}</span>
          </div>
        )}
      </div>
    </button>
  );
};
