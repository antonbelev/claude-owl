/**
 * Validation utility functions
 */
/**
 * Validate agent name format (lowercase-with-hyphens)
 */
export function isValidAgentName(name) {
    if (!name || name.length === 0 || name.length > 64)
        return false;
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
}
/**
 * Validate skill name format (lowercase-with-hyphens)
 */
export function isValidSkillName(name) {
    if (!name || name.length === 0 || name.length > 64)
        return false;
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
}
/**
 * Check if a string contains dangerous shell patterns
 */
export function hasDangerousShellPattern(command) {
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
export function hasUnquotedVariables(script) {
    // Match $VAR but not "$VAR"
    const unquotedVarPattern = /(?<!["])(\$[A-Z_][A-Z0-9_]*)(?!["'])/;
    return unquotedVarPattern.test(script);
}
/**
 * Validate description length
 */
export function isValidDescriptionLength(description, maxLength = 1024) {
    return description.length > 0 && description.length <= maxLength;
}
/**
 * Check for path traversal attempt
 */
export function hasPathTraversal(path) {
    return path.includes('../') || path.includes('..\\');
}
//# sourceMappingURL=validation.utils.js.map