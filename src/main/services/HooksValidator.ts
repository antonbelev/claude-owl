/**
 * HooksValidator - Security validation for Claude Code hooks
 *
 * Performs security checks on hook configurations to detect:
 * - Unquoted shell variables
 * - Path traversal attempts
 * - Dangerous commands
 * - Missing required fields
 *
 * @see docs/hooks-implementation-plan.md
 */

import type { Hook, HookIssue, HookValidationResult, SecurityScore } from '../../shared/types/hook.types';

export class HooksValidator {
  /**
   * Dangerous command patterns that should trigger Red security score
   */
  private static readonly DANGEROUS_COMMANDS = [
    'rm -rf',
    'rm -fr',
    'chmod 777',
    'chmod -R 777',
    'curl | bash',
    'wget | bash',
    'curl | sh',
    'wget | sh',
    'eval',
    'exec',
    ': () { : | : & }; :', // Fork bomb
    'dd if=/dev/zero',
    'mkfs',
    'format',
  ];

  /**
   * Patterns that should trigger Yellow (caution) warnings
   */
  private static readonly CAUTION_PATTERNS = [
    /sudo\s+/,
    /chmod\s+/,
    /chown\s+/,
    /mv\s+.*\s+\//, // Moving to root
    /cp\s+.*\s+\//, // Copying to root
  ];

  /**
   * Validate a complete hook configuration
   */
  public validateHook(hook: Hook): HookValidationResult {
    console.log('[HooksValidator] Validating hook:', { type: hook.type });

    const issues: HookIssue[] = [];

    // Basic structure validation
    if (!hook.type) {
      issues.push({
        severity: 'error',
        message: 'Hook type is required (must be "command" or "prompt")',
        code: 'MISSING_TYPE',
      });
    }

    if (hook.type !== 'command' && hook.type !== 'prompt') {
      issues.push({
        severity: 'error',
        message: `Invalid hook type: "${hook.type}". Must be "command" or "prompt"`,
        code: 'INVALID_TYPE',
      });
    }

    // Validate command hooks
    if (hook.type === 'command') {
      if (!hook.command) {
        issues.push({
          severity: 'error',
          message: 'Command is required for command hooks',
          code: 'MISSING_COMMAND',
        });
      } else {
        // Perform security checks on the command
        issues.push(...this.validateBashCommand(hook.command));
      }
    }

    // Validate prompt hooks
    if (hook.type === 'prompt') {
      if (!hook.prompt) {
        issues.push({
          severity: 'error',
          message: 'Prompt is required for prompt hooks',
          code: 'MISSING_PROMPT',
        });
      }
    }

    // Check timeout
    if (hook.timeout === undefined) {
      issues.push({
        severity: 'warning',
        message: 'No timeout specified. Default timeout (60s) will be used',
        suggestion: 'Add "timeout": 60 to your hook configuration',
        code: 'MISSING_TIMEOUT',
      });
    } else if (hook.timeout > 300) {
      issues.push({
        severity: 'warning',
        message: `Timeout is very high (${hook.timeout}s). Consider reducing it`,
        suggestion: 'Use a timeout value less than 300 seconds',
        code: 'HIGH_TIMEOUT',
      });
    } else if (hook.timeout <= 0) {
      issues.push({
        severity: 'error',
        message: 'Timeout must be greater than 0',
        code: 'INVALID_TIMEOUT',
      });
    }

    // Calculate security score
    const score = this.scoreHook(issues);
    const valid = !issues.some((issue) => issue.severity === 'error');

    console.log('[HooksValidator] Validation complete:', {
      valid,
      score,
      issueCount: issues.length,
    });

    return { valid, score, issues };
  }

  /**
   * Validate a bash command for security issues
   */
  public validateBashCommand(command: string): HookIssue[] {
    const issues: HookIssue[] = [];

    // Check for unquoted variables
    issues.push(...this.detectUnquotedVariables(command));

    // Check for path traversal
    issues.push(...this.detectPathTraversal(command));

    // Check for dangerous commands
    issues.push(...this.detectDangerousCommands(command));

    // Check for caution patterns
    issues.push(...this.detectCautionPatterns(command));

    return issues;
  }

  /**
   * Validate a matcher pattern
   */
  public validateMatcher(matcher: string): boolean {
    if (!matcher) return true; // Empty matcher is valid (matches all)

    try {
      // Try to create a regex from the matcher
      new RegExp(matcher);
      return true;
    } catch (error) {
      console.error('[HooksValidator] Invalid matcher pattern:', matcher, error);
      return false;
    }
  }

  /**
   * Scan for all security issues in a hook
   */
  public scanSecurityIssues(hook: Hook): HookIssue[] {
    if (hook.type === 'command' && hook.command) {
      return this.validateBashCommand(hook.command);
    }
    return [];
  }

  /**
   * Calculate security score based on issues
   */
  public scoreHook(issues: HookIssue[]): SecurityScore {
    const hasErrors = issues.some((issue) => issue.severity === 'error');
    const hasWarnings = issues.some((issue) => issue.severity === 'warning');

    // Check for critical security issues
    const hasCriticalSecurity = issues.some(
      (issue) =>
        issue.code === 'UNQUOTED_VARIABLE' ||
        issue.code === 'PATH_TRAVERSAL' ||
        issue.code === 'DANGEROUS_COMMAND',
    );

    if (hasErrors || hasCriticalSecurity) {
      return 'red';
    }

    if (hasWarnings) {
      return 'yellow';
    }

    return 'green';
  }

  /**
   * Detect unquoted shell variables
   */
  private detectUnquotedVariables(command: string): HookIssue[] {
    const issues: HookIssue[] = [];

    // Pattern: $VAR or ${VAR} not surrounded by quotes
    // This is a simplified check - real-world bash parsing is complex
    const unquotedPattern = /(?<!")(\$\{?[A-Z_][A-Z0-9_]*\}?)(?!")/g;
    const matches = command.matchAll(unquotedPattern);

    for (const match of matches) {
      // Skip if it's in a quoted context (basic check)
      const beforeMatch = command.substring(0, match.index || 0);
      const openQuotes = (beforeMatch.match(/"/g) || []).length;

      // If odd number of quotes before, we're inside a string
      if (openQuotes % 2 === 1) continue;

      issues.push({
        severity: 'error',
        message: `Unquoted variable: ${match[1]}`,
        suggestion: `Use "${match[1]}" instead of ${match[1]} to prevent injection attacks`,
        code: 'UNQUOTED_VARIABLE',
      });
    }

    return issues;
  }

  /**
   * Detect path traversal attempts
   */
  private detectPathTraversal(command: string): HookIssue[] {
    const issues: HookIssue[] = [];

    if (command.includes('../') || command.includes('..\\')) {
      issues.push({
        severity: 'error',
        message: 'Path traversal detected (../ or ..\\)',
        suggestion: 'Use absolute paths or validate inputs to prevent directory traversal',
        code: 'PATH_TRAVERSAL',
      });
    }

    return issues;
  }

  /**
   * Detect dangerous commands
   */
  private detectDangerousCommands(command: string): HookIssue[] {
    const issues: HookIssue[] = [];

    for (const dangerous of HooksValidator.DANGEROUS_COMMANDS) {
      if (command.includes(dangerous)) {
        issues.push({
          severity: 'error',
          message: `Dangerous command detected: ${dangerous}`,
          suggestion: 'Review this command carefully. It can cause data loss or system damage',
          code: 'DANGEROUS_COMMAND',
        });
      }
    }

    return issues;
  }

  /**
   * Detect patterns that should trigger caution warnings
   */
  private detectCautionPatterns(command: string): HookIssue[] {
    const issues: HookIssue[] = [];

    for (const pattern of HooksValidator.CAUTION_PATTERNS) {
      if (pattern.test(command)) {
        issues.push({
          severity: 'warning',
          message: `Use caution with this command: ${pattern.source}`,
          suggestion: 'Ensure this command is necessary and safe for your use case',
          code: 'CAUTION_PATTERN',
        });
      }
    }

    return issues;
  }
}
