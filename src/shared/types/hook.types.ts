/**
 * Types for Claude Code Hooks configuration and management
 * @see https://code.claude.com/docs/en/hooks
 */

/**
 * All available hook events in Claude Code
 */
export type HookEvent =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'UserPromptSubmit'
  | 'Notification'
  | 'Stop'
  | 'SubagentStop'
  | 'SessionStart'
  | 'SessionEnd';

/**
 * Hook type - command (bash) or prompt (LLM-based)
 */
export type HookType = 'command' | 'prompt';

/**
 * Decision returned by hooks
 */
export type HookDecision = 'allow' | 'deny' | 'ask' | 'block';

/**
 * Security score for hook validation
 */
export type SecurityScore = 'green' | 'yellow' | 'red';

/**
 * Individual hook configuration
 */
export interface Hook {
  type: HookType;
  command?: string; // For command hooks
  prompt?: string; // For prompt hooks
  timeout?: number; // Timeout in seconds
}

/**
 * Hook configuration for a specific event
 */
export interface HookConfiguration {
  matcher?: string; // Tool pattern (regex or tool names, optional for some events)
  hooks: Hook[];
}

/**
 * Complete hooks settings structure
 */
export interface HooksSettings {
  hooks?: {
    [K in HookEvent]?: HookConfiguration[];
  };
}

/**
 * Hook event metadata
 */
export interface HookEventInfo {
  event: HookEvent;
  name: string;
  description: string;
  whenTriggers: string;
  requiresMatcher: boolean;
  supportsPromptHooks: boolean;
  docsUrl: string;
  contextVariables: string[];
}

/**
 * Validation issue for a hook
 */
export interface HookIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  suggestion?: string;
  code?: string; // Error code for categorization
}

/**
 * Validation result for a hook
 */
export interface HookValidationResult {
  valid: boolean;
  score: SecurityScore;
  issues: HookIssue[];
}

/**
 * Hook template category
 */
export type HookTemplateCategory = 'security' | 'automation' | 'logging' | 'notification';

/**
 * Hook template for common use cases
 */
export interface HookTemplate {
  id: string;
  name: string;
  description: string;
  event: HookEvent;
  category: HookTemplateCategory;
  securityLevel: SecurityScore;
  configuration: HookConfiguration;
  variables?: string[]; // User-customizable fields
  scriptContent?: string; // The actual bash script content
  scriptPath?: string; // Suggested path for the script
}

/**
 * Hook with metadata for display
 */
export interface HookWithMetadata {
  event: HookEvent;
  configIndex: number; // Index in the event's configuration array
  hookIndex: number; // Index in the hooks array
  configuration: HookConfiguration;
  hook: Hook;
  validation: HookValidationResult;
  location: 'user' | 'project' | 'local';
}

/**
 * Summary of hooks by event
 */
export interface HookEventSummary {
  event: HookEvent;
  info: HookEventInfo;
  count: number;
  hooks: HookWithMetadata[];
  hasIssues: boolean;
  worstScore: SecurityScore;
}

/**
 * Context passed to hook for execution (what hooks receive via stdin)
 */
export interface HookContext {
  session_id: string;
  transcript_path?: string;
  cwd?: string;
  permission_mode?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  // Event-specific fields
  [key: string]: unknown;
}
