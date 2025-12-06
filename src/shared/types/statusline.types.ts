/**
 * Status Line domain types
 *
 * Status lines are terminal footers that display contextual session information
 * in Claude Code. They can be configured using templates, widgets, or custom scripts.
 */

// Re-export the official StatusLineConfig from config.types.ts
export type { StatusLineConfig } from '../types/config.types';

/**
 * Pre-built status line template definition
 */
export interface StatusLineTemplate {
  /** Unique template identifier */
  id: string;

  /** Display name */
  name: string;

  /** Description of what this template shows */
  description: string;

  /** Category for grouping templates */
  category: 'beginner' | 'intermediate' | 'advanced' | 'specialized';

  /** Preview text showing example output */
  preview: string;

  /** Function that generates the shell script */
  script: string;

  /** Whether this template requires external dependencies (git, jq, etc.) */
  dependencies?: string[];

  /** Platform(s) this template supports ('windows', 'unix' for both mac/linux) */
  platforms?: ('windows' | 'unix')[];
}

/**
 * Session data passed to status line scripts via stdin
 * This is the JSON structure that Claude Code provides to status line commands
 */
export interface StatusLineSessionData {
  /** Hook event name (always 'Status' for status lines) */
  hook_event_name: 'Status';

  /** Unique session identifier */
  session_id: string;

  /** Model information */
  model: {
    /** Model ID (e.g., 'claude-sonnet-4-5-20250929') */
    id: string;
    /** Display name (e.g., 'Sonnet 4.5') */
    display_name: string;
  };

  /** Workspace information */
  workspace: {
    /** Current working directory */
    current_dir: string;
    /** Project root directory */
    project_dir: string;
  };

  /** Cost and usage metrics */
  cost: {
    /** Total cost in USD for this session */
    total_cost_usd: number;
    /** Total lines of code added */
    total_lines_added: number;
  };
}

/**
 * Mock session data for preview mode
 */
export interface MockSessionData extends StatusLineSessionData {
  /** Indicates this is mock data for preview */
  _isMockData: true;
}

/**
 * Security scan result for a status line script
 */
export interface SecurityIssue {
  /** Line number where the issue was found */
  line: number;

  /** Severity level */
  severity: 'low' | 'medium' | 'high';

  /** Description of the security issue */
  message: string;

  /** Suggested fix (optional) */
  suggestion?: string;
}

/**
 * Result of a security scan
 */
export interface SecurityScanResult {
  /** Whether the script passed security checks */
  passed: boolean;

  /** List of issues found */
  issues: SecurityIssue[];

  /** Overall risk level */
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Result of a status line preview
 */
export interface StatusLinePreviewResult {
  /** Whether the preview succeeded */
  success: boolean;

  /** Rendered output (ANSI codes included) */
  output?: string;

  /** Plain text output (ANSI codes stripped) */
  plainOutput?: string;

  /** Error message if preview failed */
  error?: string;

  /** Execution time in milliseconds */
  executionTime?: number;
}
