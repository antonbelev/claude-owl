/**
 * React hook for managing Claude Code hooks
 *
 * Provides access to hooks data, templates, and settings management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  GetAllHooksRequest,
  GetAllHooksResponse,
  GetTemplatesResponse,
  GetSettingsPathRequest,
  GetSettingsPathResponse,
  OpenSettingsFileRequest,
  OpenSettingsFileResponse,
  CreateHookRequest,
  CreateHookResponse,
  UpdateHookRequest,
  UpdateHookResponse,
  DeleteHookRequest,
  DeleteHookResponse,
  HookDefinition,
} from '@/shared/types/ipc.types';
import type { HookEventSummary, HookTemplate } from '@/shared/types/hook.types';

/**
 * Hook to fetch all hooks with metadata and validation
 */
export function useAllHooks(projectPath?: string) {
  return useQuery<HookEventSummary[], Error>({
    queryKey: ['hooks', 'all', projectPath],
    queryFn: async () => {
      console.log('[useAllHooks] Fetching all hooks');

      const request: GetAllHooksRequest = projectPath ? { projectPath } : {};
      const response = (await window.electronAPI.getAllHooks(request)) as GetAllHooksResponse;

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch hooks');
      }

      console.log('[useAllHooks] Hooks fetched successfully:', {
        eventCount: response.data.length,
        totalHooks: response.data.reduce((sum, h) => sum + h.count, 0),
      });

      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch hook templates
 */
export function useHookTemplates() {
  return useQuery<HookTemplate[], Error>({
    queryKey: ['hooks', 'templates'],
    queryFn: async () => {
      console.log('[useHookTemplates] Fetching templates');

      const response = (await window.electronAPI.getHookTemplates()) as GetTemplatesResponse;

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch templates');
      }

      console.log('[useHookTemplates] Templates fetched:', {
        count: response.data.length,
      });

      return response.data;
    },
    staleTime: Infinity, // Templates don't change
  });
}

/**
 * Hook to get settings file path
 */
export function useSettingsPath(location: 'user' | 'project', projectPath?: string) {
  return useQuery<{ path: string; exists: boolean }, Error>({
    queryKey: ['hooks', 'settings-path', location, projectPath],
    queryFn: async () => {
      console.log('[useSettingsPath] Getting settings path:', { location, projectPath });

      const request: GetSettingsPathRequest = projectPath
        ? { location, projectPath }
        : { location };
      const response = (await window.electronAPI.getHookSettingsPath(
        request
      )) as GetSettingsPathResponse;

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get settings path');
      }

      console.log('[useSettingsPath] Path retrieved:', response.data);

      return response.data;
    },
  });
}

/**
 * Mutation to open settings file in external editor
 */
export function useOpenSettingsFile() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { location: 'user' | 'project'; projectPath?: string }>({
    mutationFn: async ({ location, projectPath }) => {
      console.log('[useOpenSettingsFile] Opening settings file:', { location, projectPath });

      const request: OpenSettingsFileRequest = projectPath
        ? { location, projectPath }
        : { location };
      const response = (await window.electronAPI.openHookSettingsFile(
        request
      )) as OpenSettingsFileResponse;

      if (!response.success) {
        throw new Error(response.error || 'Failed to open settings file');
      }

      console.log('[useOpenSettingsFile] Settings file opened successfully');
    },
    onSuccess: () => {
      // Invalidate hooks query to refresh data after user edits
      // We delay this slightly to allow user to edit and save
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['hooks', 'all'] });
      }, 2000);
    },
  });
}

/**
 * Helper hook to get all hooks-related data at once
 */
export function useHooksData(projectPath?: string) {
  const hooksQuery = useAllHooks(projectPath);
  const templatesQuery = useHookTemplates();

  return {
    hooks: hooksQuery.data,
    templates: templatesQuery.data,
    isLoading: hooksQuery.isLoading || templatesQuery.isLoading,
    isError: hooksQuery.isError || templatesQuery.isError,
    error: hooksQuery.error || templatesQuery.error,
    refetchHooks: hooksQuery.refetch,
  };
}

/**
 * Mutation to create a new hook
 */
export function useCreateHook() {
  const queryClient = useQueryClient();

  return useMutation<
    { hookId: string },
    Error,
    { hook: HookDefinition; scope: 'user' | 'project'; projectPath?: string }
  >({
    mutationFn: async ({ hook, scope, projectPath }) => {
      console.log('[useCreateHook] Creating hook:', { event: hook.event, scope, projectPath });

      const request: CreateHookRequest = { hook, scope, projectPath };
      const response = (await window.electronAPI.createHook(request)) as CreateHookResponse;

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create hook');
      }

      console.log('[useCreateHook] Hook created successfully:', response.data.hookId);

      return { hookId: response.data.hookId };
    },
    onSuccess: () => {
      // Invalidate hooks query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['hooks', 'all'] });
    },
  });
}

/**
 * Mutation to update an existing hook
 */
export function useUpdateHook() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    {
      hookId: string;
      updates: Partial<HookDefinition>;
      scope: 'user' | 'project';
      projectPath?: string;
    }
  >({
    mutationFn: async ({ hookId, updates, scope, projectPath }) => {
      console.log('[useUpdateHook] Updating hook:', { hookId, scope, projectPath });

      const request: UpdateHookRequest = { hookId, updates, scope, projectPath };
      const response = (await window.electronAPI.updateHook(request)) as UpdateHookResponse;

      if (!response.success) {
        throw new Error(response.error || 'Failed to update hook');
      }

      console.log('[useUpdateHook] Hook updated successfully');
    },
    onSuccess: () => {
      // Invalidate hooks query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['hooks', 'all'] });
    },
  });
}

/**
 * Mutation to delete a hook
 */
export function useDeleteHook() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { hookId: string; scope: 'user' | 'project'; projectPath?: string }
  >({
    mutationFn: async ({ hookId, scope, projectPath }) => {
      console.log('[useDeleteHook] Deleting hook:', { hookId, scope, projectPath });

      const request: DeleteHookRequest = { hookId, scope, projectPath };
      const response = (await window.electronAPI.deleteHook(request)) as DeleteHookResponse;

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete hook');
      }

      console.log('[useDeleteHook] Hook deleted successfully');
    },
    onSuccess: () => {
      // Invalidate hooks query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['hooks', 'all'] });
    },
  });
}
