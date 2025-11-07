/**
 * Validation utility functions
 */
/**
 * Validate agent name format (lowercase-with-hyphens)
 */
export declare function isValidAgentName(name: string): boolean;
/**
 * Validate skill name format (lowercase-with-hyphens)
 */
export declare function isValidSkillName(name: string): boolean;
/**
 * Check if a string contains dangerous shell patterns
 */
export declare function hasDangerousShellPattern(command: string): boolean;
/**
 * Check if a string has unquoted variables
 */
export declare function hasUnquotedVariables(script: string): boolean;
/**
 * Validate description length
 */
export declare function isValidDescriptionLength(description: string, maxLength?: number): boolean;
/**
 * Check for path traversal attempt
 */
export declare function hasPathTraversal(path: string): boolean;
//# sourceMappingURL=validation.utils.d.ts.map