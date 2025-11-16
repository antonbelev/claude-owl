/**
 * Validation utility functions
 */

import pathModule from 'path';
import type { ScopedRequest, ValidationResult } from '../types/validation.types';

/**
 * Validate agent name format (lowercase-with-hyphens)
 */
export function isValidAgentName(name: string): boolean {
  if (!name || name.length === 0 || name.length > 64) return false;
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
}

/**
 * Validate skill name format (lowercase-with-hyphens)
 */
export function isValidSkillName(name: string): boolean {
  if (!name || name.length === 0 || name.length > 64) return false;
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
}

/**
 * Check if a string contains dangerous shell patterns
 */
export function hasDangerousShellPattern(command: string): boolean {
  const dangerousPatterns = [
    /rm\s+-rf/, // rm -rf
    />\s*\/dev\//, // redirect to /dev/
    /\$\(.*\)/, // command substitution without quotes
    /`.*`/, // backtick command substitution
    /\|\s*bash/, // pipe to bash
    /\|\s*sh/, // pipe to sh
    /;\s*rm/, // chained rm command
    /&&\s*rm/, // AND'd rm command
  ];

  return dangerousPatterns.some(pattern => pattern.test(command));
}

/**
 * Check if a string has unquoted variables
 */
export function hasUnquotedVariables(script: string): boolean {
  // Match $VAR but not "$VAR"
  const unquotedVarPattern = /(?<!["])(\$[A-Z_][A-Z0-9_]*)(?!["'])/;
  return unquotedVarPattern.test(script);
}

/**
 * Validate description length
 */
export function isValidDescriptionLength(description: string, maxLength = 1024): boolean {
  return description.length > 0 && description.length <= maxLength;
}

/**
 * Check for path traversal attempt
 */
export function hasPathTraversal(path: string): boolean {
  return path.includes('../') || path.includes('..\\');
}

/**
 * Validates a scoped request to ensure projectPath is provided when scope/location is 'project'
 * @param request - The request object to validate
 * @returns Validation result with error message if invalid
 */
export function validateScopedRequest(request: ScopedRequest): ValidationResult {
  const scope = request.scope || request.location;

  if (scope === 'project' && !request.projectPath) {
    return {
      valid: false,
      error: 'projectPath is required when scope/location is "project"',
    };
  }

  if (scope === 'project' && request.projectPath) {
    return validateProjectPath(request.projectPath);
  }

  return { valid: true };
}

/**
 * Validates a project path
 * @param projectPath - The project path to validate
 * @returns Validation result with error message if invalid
 */
export function validateProjectPath(projectPath: string): ValidationResult {
  // Validate that projectPath is absolute
  if (!pathModule.isAbsolute(projectPath)) {
    return {
      valid: false,
      error: 'projectPath must be an absolute path',
    };
  }

  return { valid: true };
}
