import { useState, useEffect, useCallback } from 'react';
import type {
  Agent,
  ListAgentsResponse,
  GetAgentRequest,
  GetAgentResponse,
  SaveAgentRequest,
  SaveAgentResponse,
  DeleteAgentRequest,
  DeleteAgentResponse,
} from '@/shared/types';

export interface AgentsState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing Claude Code subagents
 * Provides methods for listing, getting, saving, and deleting agents
 */
export function useAgents() {
  const [state, setState] = useState<AgentsState>({
    agents: [],
    loading: true,
    error: null,
  });

  /**
   * Load all agents (user + project)
   */
  const loadAgents = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    if (!window.electronAPI) {
      setState({
        agents: [],
        loading: false,
        error: 'Not running in Electron',
      });
      return;
    }

    try {
      const response = (await window.electronAPI.listAgents()) as ListAgentsResponse;

      if (response.success && response.data) {
        setState({
          agents: response.data,
          loading: false,
          error: null,
        });
      } else {
        setState({
          agents: [],
          loading: false,
          error: response.error ?? 'Failed to load agents',
        });
      }
    } catch (error) {
      setState({
        agents: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load agents',
      });
    }
  }, []);

  /**
   * Get a specific agent by file path
   */
  const getAgent = useCallback(async (filePath: string): Promise<Agent | null> => {
    if (!window.electronAPI) {
      return null;
    }

    try {
      const request: GetAgentRequest = { filePath };
      const response = (await window.electronAPI.getAgent(request)) as GetAgentResponse;

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to get agent:', error);
      return null;
    }
  }, []);

  /**
   * Save an agent (create or update)
   */
  const saveAgent = useCallback(
    async (agent: Omit<Agent, 'lastModified'>): Promise<boolean> => {
      if (!window.electronAPI) {
        return false;
      }

      try {
        const request: SaveAgentRequest = { agent };
        const response = (await window.electronAPI.saveAgent(request)) as SaveAgentResponse;

        if (response.success) {
          // Reload agents list
          await loadAgents();
          return true;
        } else {
          console.error('Failed to save agent:', response.error);
          return false;
        }
      } catch (error) {
        console.error('Failed to save agent:', error);
        return false;
      }
    },
    [loadAgents]
  );

  /**
   * Delete an agent
   */
  const deleteAgent = useCallback(
    async (filePath: string): Promise<boolean> => {
      if (!window.electronAPI) {
        return false;
      }

      try {
        const request: DeleteAgentRequest = { filePath };
        const response = (await window.electronAPI.deleteAgent(request)) as DeleteAgentResponse;

        if (response.success) {
          // Reload agents list
          await loadAgents();
          return true;
        } else {
          console.error('Failed to delete agent:', response.error);
          return false;
        }
      } catch (error) {
        console.error('Failed to delete agent:', error);
        return false;
      }
    },
    [loadAgents]
  );

  // Load agents on mount
  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  return {
    ...state,
    loadAgents,
    getAgent,
    saveAgent,
    deleteAgent,
    refetch: loadAgents,
  };
}

/**
 * Hook for filtering agents by location
 */
export function useFilteredAgents(location?: 'user' | 'project' | 'plugin') {
  const { agents, loading, error, ...methods } = useAgents();

  const filteredAgents = location ? agents.filter(agent => agent.location === location) : agents;

  return {
    agents: filteredAgents,
    loading,
    error,
    ...methods,
  };
}
