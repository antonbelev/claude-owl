/**
 * Settings and Configuration IPC type definitions
 */

import type { ClaudeSettings, EffectiveConfig } from './config.types';
import type { IPCResponse } from './ipc.common.types';

/**
 * Settings request/response types
 */

export interface GetSettingsRequest {
  level: 'user' | 'project' | 'local' | 'managed';
}

export interface GetSettingsResponse extends IPCResponse<{
  level: 'user' | 'project' | 'local' | 'managed';
  path: string;
  exists: boolean;
  content: ClaudeSettings;
}> {}

export interface SaveSettingsRequest {
  level: 'user' | 'project' | 'local';
  settings: ClaudeSettings;
}

export interface SaveSettingsResponse extends IPCResponse {}

export interface ValidateSettingsRequest {
  settings: ClaudeSettings;
}

export interface ValidateSettingsResponse extends IPCResponse<{
  valid: boolean;
  errors: Array<{ path: string; message: string; severity: 'error' | 'warning' | 'info' }>;
  warnings: Array<{ path: string; message: string; severity: 'error' | 'warning' | 'info' }>;
}> {}

export interface GetEffectiveSettingsResponse extends IPCResponse<EffectiveConfig> {}

export interface SettingsFileExistsRequest {
  level: 'user' | 'project' | 'local' | 'managed';
}

export interface SettingsFileExistsResponse extends IPCResponse<{
  exists: boolean;
}> {}

export interface EnsureSettingsFileRequest {
  level: 'user' | 'project' | 'local';
}

export interface EnsureSettingsFileResponse extends IPCResponse {}

export interface DeleteSettingsRequest {
  level: 'user' | 'project' | 'local';
}

export interface DeleteSettingsResponse extends IPCResponse {}

/**
 * Configuration (legacy, keeping for backwards compatibility)
 */

export interface GetConfigRequest {
  level: 'user' | 'project' | 'local';
}

export interface GetConfigResponse extends IPCResponse<ClaudeSettings> {}

export interface SaveConfigRequest {
  level: 'user' | 'project' | 'local';
  config: ClaudeSettings;
}

export interface SaveConfigResponse extends IPCResponse {}

export interface GetEffectiveConfigResponse extends IPCResponse<EffectiveConfig> {}
