/**
 * Validation types for project-scoped requests and validation results
 */

/**
 * Interface for requests that support both user-level and project-level scopes
 */
export interface ScopedRequest {
  scope?: 'user' | 'project';
  location?: 'user' | 'project';
  projectPath?: string;
}

/**
 * Result of validation operations
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}
