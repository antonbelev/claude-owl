import React, { useState, useMemo } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { useProjectContext } from '../../contexts/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { FolderIcon, ServerIcon, AlertCircleIcon, RefreshCwIcon, CheckIcon, SearchIcon, XIcon } from 'lucide-react';
import type { ProjectInfo } from '@/shared/types';

export const ProjectSelector: React.FC = () => {
  const { loading, projects, error, configExists, refetch } = useProjects();
  const { selectedProject, selectProject, clearSelection } = useProjectContext();
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

  // No .claude.json found
  if (!loading && !configExists) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <AlertCircleIcon className="h-5 w-5" />
            No Claude Code Projects Found
          </CardTitle>
          <CardDescription className="text-amber-800">
            .claude.json not found in your home directory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-amber-900">
              Claude Owl discovers projects from .claude.json, which is automatically created by
              Claude Code CLI.
            </p>
            <div className="bg-white p-3 rounded border border-amber-200">
              <p className="text-xs font-mono text-gray-700 mb-2">To initialize Claude Code:</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                cd /path/to/your/project && claude
              </code>
            </div>
            <p className="text-xs text-amber-800">
              After running Claude Code in a project, click the refresh button below.
            </p>
            <Button onClick={refetch} variant="outline" size="sm" className="gap-2">
              <RefreshCwIcon className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Projects...</CardTitle>
          <CardDescription>Discovering Claude Code projects from .claude.json</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <RefreshCwIcon className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={refetch} variant="outline" size="sm" className="mt-3 gap-2">
          <RefreshCwIcon className="h-4 w-4" />
          Try Again
        </Button>
      </Alert>
    );
  }

  // No projects found
  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Projects Found</CardTitle>
          <CardDescription>No Claude Code projects discovered</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              .claude.json exists but contains no projects. Run Claude Code in a project directory
              to add it.
            </p>
            <Button onClick={refetch} variant="outline" size="sm" className="gap-2">
              <RefreshCwIcon className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Projects list
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Select a Project</h2>
          <p className="text-sm text-gray-600">
            Choose a project to manage its settings, or continue with user-level settings
          </p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm" className="gap-2">
          <RefreshCwIcon className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Search bar */}
      {projects.length > 0 && (
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects by name or path..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className="grid gap-3">
        {/* User-level settings card */}
        <Card
          className={`cursor-pointer transition-all ${
            !selectedProject
              ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
              : 'hover:border-gray-400'
          }`}
          onClick={clearSelection}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded">
                  <FolderIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    User-Level Settings
                    {!selectedProject && (
                      <CheckIcon className="h-4 w-4 text-blue-600" strokeWidth={3} />
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    Apply to all projects (~/.claude/settings.json)
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project cards */}
        {filteredProjects.length > 0 ? (
          filteredProjects.map(project => (
            <ProjectCard
              key={project.path}
              project={project}
              isSelected={selectedProject?.path === project.path}
              onSelect={() => selectProject(project)}
            />
          ))
        ) : (
          searchQuery && (
            <Card className="border-gray-200">
              <CardContent className="p-8 text-center">
                <SearchIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">
                  No projects found matching &quot;{searchQuery}&quot;
                </p>
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
};

/**
 * Individual project card component
 */
interface ProjectCardProps {
  project: ProjectInfo;
  isSelected: boolean;
  onSelect: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, isSelected, onSelect }) => {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' : 'hover:border-gray-400'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <FolderIcon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium flex items-center gap-2">
                <span className="truncate">{project.name}</span>
                {isSelected && <CheckIcon className="h-4 w-4 text-blue-600" strokeWidth={3} />}
              </div>
              <div className="text-xs text-gray-600 truncate" title={project.path}>
                {project.path}
              </div>
            </div>
          </div>

          {project.mcpServerCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 ml-2">
              <ServerIcon className="h-3.5 w-3.5" />
              <span>{project.mcpServerCount}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
