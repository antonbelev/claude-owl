/**
 * Hooks IPC type definitions
 */

import type { HookEventSummary, HookTemplate } from './hook.types';
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

export interface GetSettingsPathResponse extends IPCResponse<{
  path: string;
  exists: boolean;
}> {}

export interface OpenSettingsFileRequest {
  location: 'user' | 'project';
  projectPath?: string;
}

export interface OpenSettingsFileResponse extends IPCResponse {}
