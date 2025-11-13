/**
 * Comprehensive command-related type definitions
 * Extends basic Command types from agent.types.ts
 */

import type { Command, CommandFrontmatter } from './agent.types';

/**
 * Command source and provenance tracking
 */
export interface CommandSource {
  type: 'builtin' | 'curated' | 'github' | 'file' | 'clipboard';
  url?: string; // GitHub repo URL or file URL
  author?: string; // Repo owner or author name
  repo?: string; // Repository name
  trustLevel: 'trusted' | 'curated' | 'unknown' | 'dangerous';
}

export interface CommandMetadata {
  source: CommandSource;
  importedAt: Date;
  trustScoreAtImport: number;
  originalUrl?: string;
  lastValidated?: Date;
  userEdited: boolean; // Track if user modified after import
}

/**
 * Command with extended metadata for imported commands
 */
export interface CommandWithMetadata extends Command {
  metadata?: CommandMetadata;
  namespace?: string; // Subdirectory (e.g., "workflows", "git", "tools")
}

/**
 * Trust scoring for imported commands
 */
export interface TrustScore {
  score: number; // 0-100
  level: 'trusted' | 'curated' | 'unknown' | 'dangerous';
  factors: {
    structureValid: boolean;
    noSecurityIssues: boolean;
    permissionsRestricted: boolean;
    noExternalDownloads: boolean;
    noSystemModifications: boolean;
    sourceReliable: boolean;
  };
}

/**
 * Validation and security types
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';
export type ValidationErrorType = 'frontmatter' | 'content' | 'security' | 'syntax';
export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ValidationError {
  type: ValidationErrorType;
  field?: string;
  message: string;
  line?: number;
  severity: ValidationSeverity;
  autoFixable?: boolean;
  suggestion?: string;
}

export interface ValidationWarning extends ValidationError {
  recommendation?: string;
}

export interface CommandSecurityIssue {
  type:
    | 'dangerous-bash'
    | 'unquoted-variable'
    | 'path-traversal'
    | 'unrestricted-tools'
    | 'external-download'
    | 'system-modification'
    | 'sensitive-file';
  message: string;
  recommendation: string;
  line?: number;
  severity: SecuritySeverity;
  pattern?: string; // The pattern that triggered this issue
  fix?: string; // Auto-fix suggestion
}

export interface CommandValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  securityIssues: CommandSecurityIssue[];
  suggestions: string[];
}

/**
 * GitHub import validation
 */
export interface GitHubImportValidation extends CommandValidationResult {
  trustScore: TrustScore;
  source: CommandSource;
  recommendations: string[];
  requiresReview: boolean;
  autoFixable: boolean;
}

/**
 * Command templates
 */
export type TemplateCategory =
  | 'workflow'
  | 'git'
  | 'testing'
  | 'ai'
  | 'devops'
  | 'docs'
  | 'security'
  | 'debugging';

export type TemplateDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type TemplateVariableType = 'text' | 'select' | 'multiline' | 'number' | 'boolean';

export interface TemplateVariable {
  name: string; // Variable name (e.g., "branch_name")
  label: string; // Display label
  type: TemplateVariableType;
  required: boolean;
  default?: string | number | boolean;
  options?: string[]; // For select type
  placeholder?: string;
  helpText?: string;
  validation?: {
    pattern?: string; // Regex pattern
    minLength?: number;
    maxLength?: number;
    min?: number; // For number type
    max?: number; // For number type
  };
}

export interface CommandTemplate {
  id: string; // Template identifier
  name: string; // Display name
  category: TemplateCategory;
  description: string;
  tags: string[];
  difficulty: TemplateDifficulty;
  variables: TemplateVariable[];
  frontmatter: CommandFrontmatter;
  content: string; // Template content with {{variables}}
  examples?: string[]; // Example usage
  preview?: string; // Preview text
}

/**
 * Command operations
 */
export interface CommandCreateOptions {
  name: string;
  location: 'user' | 'project';
  namespace?: string;
  frontmatter: CommandFrontmatter;
  content: string;
}

export interface CommandUpdateOptions {
  filePath: string;
  frontmatter?: CommandFrontmatter;
  content?: string;
  namespace?: string; // For moving to different namespace
}

export interface CommandDeleteOptions {
  filePath: string;
  location: 'user' | 'project';
}

export interface CommandMoveOptions {
  filePath: string;
  newNamespace?: string; // New subdirectory, undefined for root
}

/**
 * Command discovery and filtering
 */
export interface CommandFilter {
  location?: ('user' | 'project' | 'plugin' | 'mcp')[];
  namespace?: string[];
  search?: string; // Search in name/description/content
  tags?: string[];
  hasSecurityIssues?: boolean;
}

export interface CommandSortOptions {
  field: 'name' | 'lastModified' | 'namespace' | 'trustScore';
  direction: 'asc' | 'desc';
}

/**
 * Dangerous patterns for security scanning
 */
export interface DangerousPattern {
  pattern: RegExp;
  severity: SecuritySeverity;
  message: string;
  recommendation: string;
  category: 'bash' | 'permissions' | 'files' | 'network';
}

/**
 * Auto-fix capabilities
 */
export interface AutoFixResult {
  success: boolean;
  fixedContent?: string;
  fixedFrontmatter?: CommandFrontmatter;
  appliedFixes: string[];
  remainingIssues: CommandSecurityIssue[];
}

/**
 * Import/export types
 */
export interface ImportCommandOptions {
  source: 'file' | 'url' | 'clipboard' | 'github-repo';
  data: string; // File path, URL, or clipboard content
  location: 'user' | 'project';
  validate?: boolean; // Run validation before import
}

export interface ImportCommandResult {
  success: boolean;
  command?: CommandWithMetadata;
  validation?: GitHubImportValidation;
  error?: string;
}

export interface ExportCommandOptions {
  filePath: string;
  format: 'markdown' | 'json' | 'yaml';
  includeMetadata?: boolean;
}

export interface ExportCommandResult {
  success: boolean;
  data?: string;
  error?: string;
}

/**
 * Batch operations
 */
export interface BatchImportOptions {
  repoUrl: string;
  location: 'user' | 'project';
  filter?: CommandFilter;
  validateAll?: boolean;
}

export interface BatchImportResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  commands: Array<{
    name: string;
    status: 'success' | 'failed' | 'skipped';
    validation?: GitHubImportValidation;
    error?: string;
  }>;
}

/**
 * Re-export Command and CommandFrontmatter for convenience
 */
export type { Command, CommandFrontmatter };
