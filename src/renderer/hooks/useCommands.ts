import { useState, useEffect, useCallback } from 'react';
import type {
  CommandWithMetadata,
  CommandFilter,
  CommandSortOptions,
} from '@/shared/types/command.types';
import type { CommandFrontmatter } from '@/shared/types/agent.types';
import type {
  ListCommandsRequest,
  ListCommandsResponse,
  GetCommandRequest,
  GetCommandResponse,
  CreateCommandRequest,
  CreateCommandResponse,
  UpdateCommandRequest,
  UpdateCommandResponse,
  DeleteCommandRequest,
  DeleteCommandResponse,
  MoveCommandRequest,
  MoveCommandResponse,
} from '@/shared/types/ipc.commands.types';

export interface CommandsState {
  commands: CommandWithMetadata[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing Claude Code slash commands
 * Provides methods for listing, getting, creating, updating, deleting, and moving commands
 */
export function useCommands(filter?: CommandFilter, sort?: CommandSortOptions) {
  const [state, setState] = useState<CommandsState>({
    commands: [],
    loading: true,
    error: null,
  });

  /**
   * Load all commands with optional filters and sorting
   */
  const loadCommands = useCallback(async () => {
    console.log('[useCommands] Loading commands', { filter, sort });
    setState(prev => ({ ...prev, loading: true, error: null }));

    if (!window.electronAPI) {
      setState({
        commands: [],
        loading: false,
        error: 'Not running in Electron',
      });
      return;
    }

    try {
      const request: ListCommandsRequest = {};
      if (filter) request.filter = filter;
      if (sort) request.sort = sort;
      const response = (await window.electronAPI.listCommands(request)) as ListCommandsResponse;

      console.log('[useCommands] Commands loaded:', {
        success: response.success,
        count: response.data?.length,
      });

      if (response.success && response.data) {
        setState({
          commands: response.data,
          loading: false,
          error: null,
        });
      } else {
        setState({
          commands: [],
          loading: false,
          error: response.error ?? 'Failed to load commands',
        });
      }
    } catch (error) {
      console.error('[useCommands] Failed to load commands:', error);
      setState({
        commands: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load commands',
      });
    }
  }, [filter, sort]);

  /**
   * Get a specific command by file path
   */
  const getCommand = useCallback(async (filePath: string): Promise<CommandWithMetadata | null> => {
    console.log('[useCommands] Getting command:', filePath);

    if (!window.electronAPI) {
      return null;
    }

    try {
      const request: GetCommandRequest = { filePath };
      const response = (await window.electronAPI.getCommand(request)) as GetCommandResponse;

      console.log('[useCommands] Got command:', {
        success: response.success,
        name: response.data?.name,
      });

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('[useCommands] Failed to get command:', error);
      return null;
    }
  }, []);

  /**
   * Create a new command
   */
  const createCommand = useCallback(
    async (options: {
      name: string;
      location: 'user' | 'project';
      namespace?: string;
      frontmatter: CommandFrontmatter;
      content: string;
    }): Promise<{ success: boolean; filePath?: string; error?: string }> => {
      console.log('[useCommands] Creating command:', options.name);

      if (!window.electronAPI) {
        return { success: false, error: 'Not running in Electron' };
      }

      try {
        const request: CreateCommandRequest = { options };
        const response = (await window.electronAPI.createCommand(request)) as CreateCommandResponse;

        console.log('[useCommands] Create command result:', {
          success: response.success,
          filePath: response.data?.filePath,
        });

        if (response.success) {
          // Reload commands list
          await loadCommands();
          const result: { success: boolean; filePath?: string; error?: string } = {
            success: true,
          };
          if (response.data?.filePath) result.filePath = response.data.filePath;
          return result;
        } else {
          return { success: false, error: response.error ?? 'Failed to create command' };
        }
      } catch (error) {
        console.error('[useCommands] Failed to create command:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create command',
        };
      }
    },
    [loadCommands]
  );

  /**
   * Update an existing command
   */
  const updateCommand = useCallback(
    async (options: {
      filePath: string;
      frontmatter?: CommandFrontmatter;
      content?: string;
      namespace?: string;
    }): Promise<{ success: boolean; error?: string }> => {
      console.log('[useCommands] Updating command:', options.filePath);

      if (!window.electronAPI) {
        return { success: false, error: 'Not running in Electron' };
      }

      try {
        const request: UpdateCommandRequest = { options };
        const response = (await window.electronAPI.updateCommand(request)) as UpdateCommandResponse;

        console.log('[useCommands] Update command result:', {
          success: response.success,
        });

        if (response.success) {
          // Reload commands list
          await loadCommands();
          return { success: true };
        } else {
          return { success: false, error: response.error ?? 'Failed to update command' };
        }
      } catch (error) {
        console.error('[useCommands] Failed to update command:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update command',
        };
      }
    },
    [loadCommands]
  );

  /**
   * Delete a command
   */
  const deleteCommand = useCallback(
    async (
      filePath: string,
      location: 'user' | 'project'
    ): Promise<{ success: boolean; error?: string }> => {
      console.log('[useCommands] Deleting command:', filePath);

      if (!window.electronAPI) {
        return { success: false, error: 'Not running in Electron' };
      }

      try {
        const request: DeleteCommandRequest = { options: { filePath, location } };
        const response = (await window.electronAPI.deleteCommand(request)) as DeleteCommandResponse;

        console.log('[useCommands] Delete command result:', {
          success: response.success,
        });

        if (response.success) {
          // Reload commands list
          await loadCommands();
          return { success: true };
        } else {
          return { success: false, error: response.error ?? 'Failed to delete command' };
        }
      } catch (error) {
        console.error('[useCommands] Failed to delete command:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete command',
        };
      }
    },
    [loadCommands]
  );

  /**
   * Move command to different namespace
   */
  const moveCommand = useCallback(
    async (
      filePath: string,
      newNamespace?: string
    ): Promise<{ success: boolean; newFilePath?: string; error?: string }> => {
      console.log('[useCommands] Moving command:', filePath, 'to namespace:', newNamespace);

      if (!window.electronAPI) {
        return { success: false, error: 'Not running in Electron' };
      }

      try {
        const moveOptions: { filePath: string; newNamespace?: string } = { filePath };
        if (newNamespace !== undefined) moveOptions.newNamespace = newNamespace;
        const request: MoveCommandRequest = { options: moveOptions };
        const response = (await window.electronAPI.moveCommand(request)) as MoveCommandResponse;

        console.log('[useCommands] Move command result:', {
          success: response.success,
          newFilePath: response.data?.newFilePath,
        });

        if (response.success) {
          // Reload commands list
          await loadCommands();
          const result: { success: boolean; newFilePath?: string; error?: string } = {
            success: true,
          };
          if (response.data?.newFilePath) result.newFilePath = response.data.newFilePath;
          return result;
        } else {
          return { success: false, error: response.error ?? 'Failed to move command' };
        }
      } catch (error) {
        console.error('[useCommands] Failed to move command:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to move command',
        };
      }
    },
    [loadCommands]
  );

  // Load commands on mount and when filters/sort change
  useEffect(() => {
    loadCommands();
  }, [loadCommands]);

  return {
    ...state,
    loadCommands,
    getCommand,
    createCommand,
    updateCommand,
    deleteCommand,
    moveCommand,
    refetch: loadCommands,
  };
}

/**
 * Hook for filtering commands by location
 */
export function useFilteredCommands(location?: 'user' | 'project' | 'plugin') {
  const filter: CommandFilter | undefined = location ? { location: [location] } : undefined;
  const { commands, loading, error, ...methods } = useCommands(filter);

  return {
    commands,
    loading,
    error,
    ...methods,
  };
}

/**
 * Hook for filtering commands by namespace
 */
export function useNamespacedCommands(namespace?: string) {
  const filter: CommandFilter | undefined = namespace ? { namespace: [namespace] } : undefined;
  const { commands, loading, error, ...methods } = useCommands(filter);

  return {
    commands,
    loading,
    error,
    ...methods,
  };
}

/**
 * Hook for searching commands
 */
export function useCommandSearch(searchQuery?: string) {
  const filter: CommandFilter | undefined = searchQuery ? { search: searchQuery } : undefined;
  const { commands, loading, error, ...methods } = useCommands(filter);

  return {
    commands,
    loading,
    error,
    ...methods,
  };
}
