import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ProjectInfo, ProjectScope } from '@/shared/types';

/**
 * Project context for managing project selection and scope
 */
interface ProjectContextValue {
  // Current scope (user or project)
  scope: ProjectScope;

  // Selected project (if scope is 'project')
  selectedProject: ProjectInfo | null;

  // Available projects
  availableProjects: ProjectInfo[];

  // Actions
  selectProject: (project: ProjectInfo) => void;
  clearSelection: () => void;
  setAvailableProjects: (projects: ProjectInfo[]) => void;
  setScope: (scope: ProjectScope) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

/**
 * Provider component for project context
 */
export function ProjectProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<ProjectScope>('user');
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);
  const [availableProjects, setAvailableProjects] = useState<ProjectInfo[]>([]);

  const selectProject = useCallback((project: ProjectInfo) => {
    console.log('[ProjectContext] Selecting project:', project.name);
    setSelectedProject(project);
    setScope('project');
  }, []);

  const clearSelection = useCallback(() => {
    console.log('[ProjectContext] Clearing project selection');
    setSelectedProject(null);
    setScope('user');
  }, []);

  const value: ProjectContextValue = {
    scope,
    selectedProject,
    availableProjects,
    selectProject,
    clearSelection,
    setAvailableProjects,
    setScope,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

/**
 * Hook to use project context
 */
export function useProjectContext() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }

  return context;
}
