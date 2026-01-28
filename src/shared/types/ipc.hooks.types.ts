/**
 * Hooks IPC type definitions
 */

import type { HookEvent, HookEventSummary, HookTemplate, HookType } from './hook.types';
import type { IPCResponse } from './ipc.common.types';

/**
 * Hooks request/response types
 */

export interface GetAllHooksRequest {
  projectPath?: string;
}

export interface GetAllHooksResponse extends IPCResponse<HookEventSummary[]> {}

export interface GetTemplatesResponse extends IPCResponse<HookTemplate[]> {}

export interface GetSettingsPathRequest {
  location: 'user' | 'project';
  projectPath?: string;
}

export interface GetSettingsPathResponse
  extends IPCResponse<{
    path: string;
    exists: boolean;
  }> {}

export interface OpenSettingsFileRequest {
  location: 'user' | 'project';
  projectPath?: string;
}

export interface OpenSettingsFileResponse extends IPCResponse {}

/**
 * Hook definition for create/update operations
 */
export interface HookDefinition {
  /** Event type this hook responds to */
  event: HookEvent;
  /** Tool matcher pattern (glob or tool name) */
  matcher?: string | undefined;
  /** Hook execution type */
  type: HookType;
  /** Shell command to execute (if type=command) */
  command?: string | undefined;
  /** AI prompt to evaluate (if type=prompt) */
  prompt?: string | undefined;
  /** Timeout in seconds (default: 60) */
  timeout?: number | undefined;
}

/**
 * Create hook request
 */
export interface CreateHookRequest {
  /** Hook definition */
  hook: HookDefinition;
  /** Scope: user-level or project-level settings.json */
  scope: 'user' | 'project';
  /** Project path (required when scope is 'project') */
  projectPath?: string | undefined;
}

/**
 * Create hook response
 */
export interface CreateHookResponse
  extends IPCResponse<{
    /** Generated hook identifier (event:configIndex:hookIndex) */
    hookId: string;
  }> {}

/**
 * Update hook request
 */
export interface UpdateHookRequest {
  /** Hook identifier (event:configIndex:hookIndex) */
  hookId: string;
  /** Updated hook definition */
  updates: Partial<HookDefinition>;
  /** Scope: user-level or project-level settings.json */
  scope: 'user' | 'project';
  /** Project path (required when scope is 'project') */
  projectPath?: string | undefined;
}

/**
 * Update hook response
 */
export interface UpdateHookResponse extends IPCResponse {}

/**
 * Delete hook request
 */
export interface DeleteHookRequest {
  /** Hook identifier (event:configIndex:hookIndex) */
  hookId: string;
  /** Scope: user-level or project-level settings.json */
  scope: 'user' | 'project';
  /** Project path (required when scope is 'project') */
  projectPath?: string | undefined;
}

/**
 * Delete hook response
 */
export interface DeleteHookResponse extends IPCResponse {}
