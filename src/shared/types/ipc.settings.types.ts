/**
 * Settings and Configuration IPC type definitions
 */

import type { ClaudeSettings, EffectiveConfig } from './config.types';
import type { IPCResponse } from './ipc.common.types';
import type {
  PermissionRule,
  RuleTemplate,
  RuleValidationResult,
  RuleMatchResult,
  ToolType,
} from './permissions.types';

/**
 * Settings request/response types
 */

export interface GetSettingsRequest {
  level: 'user' | 'project' | 'local' | 'managed';
}

export interface GetSettingsResponse
  extends IPCResponse<{
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

export interface ValidateSettingsResponse
  extends IPCResponse<{
    valid: boolean;
    errors: Array<{ path: string; message: string; severity: 'error' | 'warning' | 'info' }>;
    warnings: Array<{ path: string; message: string; severity: 'error' | 'warning' | 'info' }>;
  }> {}

export interface GetEffectiveSettingsResponse extends IPCResponse<EffectiveConfig> {}

export interface SettingsFileExistsRequest {
  level: 'user' | 'project' | 'local' | 'managed';
}

export interface SettingsFileExistsResponse
  extends IPCResponse<{
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

/**
 * Permission Rules IPC types
 */

export interface ParseRuleRequest {
  ruleString: string;
}

export interface ParseRuleResponse extends IPCResponse<PermissionRule> {}

export interface FormatRuleRequest {
  rule: Omit<PermissionRule, 'id'>;
}

export interface FormatRuleResponse extends IPCResponse<{ ruleString: string }> {}

export interface ValidateRuleRequest {
  rule: Omit<PermissionRule, 'id'>;
}

export interface ValidateRuleResponse extends IPCResponse<RuleValidationResult> {}

export interface ValidatePatternRequest {
  tool: ToolType;
  pattern: string;
}

export interface ValidatePatternResponse extends IPCResponse<RuleValidationResult> {}

export interface TestRuleRequest {
  rule: Omit<PermissionRule, 'id'>;
  testInput: string;
}

export interface TestRuleResponse extends IPCResponse<RuleMatchResult> {}

export interface GetRuleTemplatesResponse extends IPCResponse<{ templates: RuleTemplate[] }> {}

export interface ApplyTemplateRequest {
  templateId: string;
}

export interface ApplyTemplateResponse extends IPCResponse<{ rules: PermissionRule[] }> {}

export interface CreateBackupRequest {
  level: 'user' | 'project' | 'local';
}

export interface CreateBackupResponse extends IPCResponse<{ backupPath: string }> {}

export interface RestoreBackupRequest {
  backupPath: string;
  level: 'user' | 'project' | 'local';
}

export interface RestoreBackupResponse extends IPCResponse {}
