/**
 * IPC (Inter-Process Communication) type definitions
 * Defines the contract between main and renderer processes
 */

import type { ClaudeSettings, EffectiveConfig } from './config.types';
import type { Agent, Skill, Command } from './agent.types';

/**
 * IPC Channel names
 */
export const IPC_CHANNELS = {
  // Settings
  GET_SETTINGS: 'settings:get',
  SAVE_SETTINGS: 'settings:save',
  VALIDATE_SETTINGS: 'settings:validate',
  GET_EFFECTIVE_SETTINGS: 'settings:get-effective',
  SETTINGS_FILE_EXISTS: 'settings:file-exists',
  ENSURE_SETTINGS_FILE: 'settings:ensure-file',
  DELETE_SETTINGS: 'settings:delete',

  // Configuration (legacy, keeping for backwards compatibility)
  GET_CONFIG: 'config:get',
  SAVE_CONFIG: 'config:save',
  VALIDATE_CONFIG: 'config:validate',
  GET_EFFECTIVE_CONFIG: 'config:get-effective',

  // Agents
  LIST_AGENTS: 'agents:list',
  GET_AGENT: 'agents:get',
  SAVE_AGENT: 'agents:save',
  DELETE_AGENT: 'agents:delete',

  // Skills
  LIST_SKILLS: 'skills:list',
  GET_SKILL: 'skills:get',
  SAVE_SKILL: 'skills:save',
  DELETE_SKILL: 'skills:delete',

  // Commands
  LIST_COMMANDS: 'commands:list',
  GET_COMMAND: 'commands:get',
  SAVE_COMMAND: 'commands:save',
  DELETE_COMMAND: 'commands:delete',

  // Claude CLI
  EXECUTE_CLI: 'cli:execute',
  STOP_CLI: 'cli:stop',

  // File System
  READ_FILE: 'fs:read',
  WRITE_FILE: 'fs:write',
  LIST_DIRECTORY: 'fs:list',

  // System
  GET_APP_VERSION: 'system:version',
  GET_CLAUDE_VERSION: 'system:claude-version',
  CHECK_CLAUDE_INSTALLED: 'system:check-claude',
} as const;

/**
 * IPC Request/Response types
 */

// Settings
export interface GetSettingsRequest {
  level: 'user' | 'project' | 'local' | 'managed';
}

export interface GetSettingsResponse {
  success: boolean;
  data?: {
    level: 'user' | 'project' | 'local' | 'managed';
    path: string;
    exists: boolean;
    content: ClaudeSettings;
  };
  error?: string;
}

export interface SaveSettingsRequest {
  level: 'user' | 'project' | 'local';
  settings: ClaudeSettings;
}

export interface SaveSettingsResponse {
  success: boolean;
  error?: string;
}

export interface ValidateSettingsRequest {
  settings: ClaudeSettings;
}

export interface ValidateSettingsResponse {
  success: boolean;
  data?: {
    valid: boolean;
    errors: Array<{ path: string; message: string; severity: 'error' | 'warning' | 'info' }>;
    warnings: Array<{ path: string; message: string; severity: 'error' | 'warning' | 'info' }>;
  };
  error?: string;
}

export interface GetEffectiveSettingsResponse {
  success: boolean;
  data?: EffectiveConfig;
  error?: string;
}

export interface SettingsFileExistsRequest {
  level: 'user' | 'project' | 'local' | 'managed';
}

export interface SettingsFileExistsResponse {
  success: boolean;
  data?: { exists: boolean };
  error?: string;
}

export interface EnsureSettingsFileRequest {
  level: 'user' | 'project' | 'local';
}

export interface EnsureSettingsFileResponse {
  success: boolean;
  error?: string;
}

export interface DeleteSettingsRequest {
  level: 'user' | 'project' | 'local';
}

export interface DeleteSettingsResponse {
  success: boolean;
  error?: string;
}

// Configuration (legacy, keeping for backwards compatibility)
export interface GetConfigRequest {
  level: 'user' | 'project' | 'local';
}

export interface GetConfigResponse {
  success: boolean;
  data?: ClaudeSettings;
  error?: string;
}

export interface SaveConfigRequest {
  level: 'user' | 'project' | 'local';
  config: ClaudeSettings;
}

export interface SaveConfigResponse {
  success: boolean;
  error?: string;
}

export interface GetEffectiveConfigResponse {
  success: boolean;
  data?: EffectiveConfig;
  error?: string;
}

// Agents
export interface ListAgentsResponse {
  success: boolean;
  data?: Agent[];
  error?: string;
}

export interface GetAgentRequest {
  filePath: string;
}

export interface GetAgentResponse {
  success: boolean;
  data?: Agent;
  error?: string;
}

export interface SaveAgentRequest {
  agent: Omit<Agent, 'lastModified'>;
}

export interface SaveAgentResponse {
  success: boolean;
  error?: string;
}

export interface DeleteAgentRequest {
  filePath: string;
}

export interface DeleteAgentResponse {
  success: boolean;
  error?: string;
}

// Skills (similar structure to agents)
export interface ListSkillsResponse {
  success: boolean;
  data?: Skill[];
  error?: string;
}

export interface GetSkillRequest {
  name: string;
  location: 'user' | 'project';
}

export interface GetSkillResponse {
  success: boolean;
  data?: Skill;
  error?: string;
}

export interface SaveSkillRequest {
  skill: {
    name: string;
    description: string;
    'allowed-tools'?: string[];
    content: string;
    location: 'user' | 'project';
  };
}

export interface SaveSkillResponse {
  success: boolean;
  data?: Skill;
  error?: string;
}

export interface DeleteSkillRequest {
  name: string;
  location: 'user' | 'project';
}

export interface DeleteSkillResponse {
  success: boolean;
  error?: string;
}

// Commands (similar structure to agents)
export interface ListCommandsResponse {
  success: boolean;
  data?: Command[];
  error?: string;
}

// Claude CLI
export interface ExecuteCLIRequest {
  command: string;
  args: string[];
  cwd?: string;
}

export interface ExecuteCLIResponse {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
}

// System
export interface CheckClaudeInstalledResponse {
  success: boolean;
  installed: boolean;
  version?: string;
  path?: string;
  error?: string;
}

/**
 * IPC Event types for streaming/notifications
 */
export interface CLIOutputEvent {
  type: 'stdout' | 'stderr';
  data: string;
}

export interface FileChangedEvent {
  path: string;
  type: 'add' | 'change' | 'unlink';
}

export interface ValidationErrorEvent {
  path: string;
  errors: Array<{
    message: string;
    line?: number;
    column?: number;
  }>;
}
