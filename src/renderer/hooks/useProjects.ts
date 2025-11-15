import { useState, useEffect, useCallback } from 'react';
import type {
  ProjectInfo,
  ClaudeProjectData,
  GetProjectsResponse,
  GetProjectInfoResponse,
  GetProjectMCPServersResponse,
  CheckClaudeConfigResponse,
} from '@/shared/types';

export interface ProjectsState {
  loading: boolean;
  projects: ProjectInfo[];
  error: string | null;
  configExists: boolean;
  configChecked: boolean;
}

export interface ProjectDetailsState {
  loading: boolean;
  projectInfo: ProjectInfo | null;
  projectData: ClaudeProjectData | null;
  error: string | null;
}

/**
 * Hook for managing project discovery from .claude.json
 */
export function useProjects() {
  const [state, setState] = useState<ProjectsState>({
    loading: true,
    projects: [],
    error: null,
    configExists: false,
    configChecked: false,
  });

  const checkConfig = useCallback(async () => {
    if (!window.electronAPI) {
      setState(prev => ({
        ...prev,
        loading: false,
        configExists: false,
        configChecked: true,
        error: 'Not running in Electron',
      }));
      return;
    }

    try {
      const response = (await window.electronAPI.checkClaudeConfig()) as CheckClaudeConfigResponse;

      if (response.success && response.data) {
        const { exists } = response.data;
        setState(prev => ({
          ...prev,
          configExists: exists,
          configChecked: true,
        }));

        return exists;
      } else {
        setState(prev => ({
          ...prev,
          configExists: false,
          configChecked: true,
          error: response.error ?? 'Failed to check config',
        }));

        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        configExists: false,
        configChecked: true,
        error: error instanceof Error ? error.message : 'Failed to check config',
      }));

      return false;
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    if (!window.electronAPI) {
      setState({
        loading: false,
        projects: [],
        error: 'Not running in Electron',
        configExists: false,
        configChecked: true,
      });
      return;
    }

    try {
      // First check if config exists
      const configExists = await checkConfig();

      if (!configExists) {
        setState(prev => ({
          ...prev,
          loading: false,
          projects: [],
          error: '.claude.json not found. Run Claude Code at least once to initialize it.',
        }));
        return;
      }

      // Fetch projects
      const response = (await window.electronAPI.getProjects()) as GetProjectsResponse;

      if (response.success && response.data) {
        const { projects } = response.data;
        setState(prev => ({
          ...prev,
          loading: false,
          projects,
          error: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error ?? 'Failed to fetch projects',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch projects',
      }));
    }
  }, [checkConfig]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    ...state,
    refetch: fetchProjects,
    checkConfig,
  };
}

/**
 * Hook for getting detailed information about a specific project
 */
export function useProjectDetails(projectPath: string | null) {
  const [state, setState] = useState<ProjectDetailsState>({
    loading: false,
    projectInfo: null,
    projectData: null,
    error: null,
  });

  const fetchProjectDetails = useCallback(async () => {
    if (!projectPath) {
      setState({
        loading: false,
        projectInfo: null,
        projectData: null,
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    if (!window.electronAPI) {
      setState({
        loading: false,
        projectInfo: null,
        projectData: null,
        error: 'Not running in Electron',
      });
      return;
    }

    try {
      const response = (await window.electronAPI.getProjectInfo({
        projectPath,
      })) as GetProjectInfoResponse;

      if (response.success && response.data) {
        setState({
          loading: false,
          projectInfo: response.data.projectInfo,
          projectData: response.data.projectData,
          error: null,
        });
      } else {
        setState({
          loading: false,
          projectInfo: null,
          projectData: null,
          error: response.error ?? 'Failed to fetch project details',
        });
      }
    } catch (error) {
      setState({
        loading: false,
        projectInfo: null,
        projectData: null,
        error: error instanceof Error ? error.message : 'Failed to fetch project details',
      });
    }
  }, [projectPath]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  return {
    ...state,
    refetch: fetchProjectDetails,
  };
}

/**
 * Hook for getting MCP servers for a specific project
 */
export function useProjectMCPServers(projectPath: string | null) {
  const [state, setState] = useState<{
    loading: boolean;
    servers: Array<{
      name: string;
      config: {
        type?: string;
        command?: string;
        args?: string[];
        env?: Record<string, string>;
      };
      source: 'claude-json' | 'mcp-json';
    }>;
    error: string | null;
  }>({
    loading: false,
    servers: [],
    error: null,
  });

  const fetchServers = useCallback(async () => {
    if (!projectPath) {
      setState({
        loading: false,
        servers: [],
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    if (!window.electronAPI) {
      setState({
        loading: false,
        servers: [],
        error: 'Not running in Electron',
      });
      return;
    }

    try {
      const response = (await window.electronAPI.getProjectMCPServers({
        projectPath,
      })) as GetProjectMCPServersResponse;

      if (response.success && response.data) {
        setState({
          loading: false,
          servers: response.data.servers,
          error: null,
        });
      } else {
        setState({
          loading: false,
          servers: [],
          error: response.error ?? 'Failed to fetch MCP servers',
        });
      }
    } catch (error) {
      setState({
        loading: false,
        servers: [],
        error: error instanceof Error ? error.message : 'Failed to fetch MCP servers',
      });
    }
  }, [projectPath]);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  return {
    ...state,
    refetch: fetchServers,
  };
}
