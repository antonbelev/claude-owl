import { randomUUID } from 'crypto';
import type {
  PermissionRule,
  RuleTemplate,
  RuleValidationResult,
  RuleMatchResult,
  ToolType,
} from '@/shared/types/permissions.types';
import { RULE_TEMPLATES, TOOLS_WITHOUT_PATTERNS } from '@/shared/types/permissions.types';

/**
 * Service for managing permission rules
 * Handles parsing, formatting, validation, testing, templates, and suggestions
 */
export class PermissionRulesService {
  /**
   * Parse a rule string like "Bash(npm run test)" into a PermissionRule object
   */
  parseRuleString(ruleString: string): Omit<PermissionRule, 'id' | 'level' | 'createdFrom'> {
    const trimmed = ruleString.trim();

    // Match pattern: ToolName or ToolName(pattern)
    const match = trimmed.match(/^(\w+)(?:\((.*)\))?$/);

    if (!match) {
      throw new Error(
        `Invalid rule format: "${ruleString}". Expected format: "ToolName" or "ToolName(pattern)"`
      );
    }

    const [, tool, pattern] = match;

    // Validate tool exists and is valid
    if (!tool || !this.isValidToolType(tool)) {
      throw new Error(
        `Invalid tool name: "${tool}". Valid tools: Bash, Read, Edit, Write, WebFetch, WebSearch, NotebookEdit, SlashCommand`
      );
    }

    const result: Omit<PermissionRule, 'id' | 'level' | 'createdFrom'> = {
      tool: tool as ToolType,
    };

    if (pattern) {
      result.pattern = pattern;
    }

    return result;
  }

  /**
   * Format a PermissionRule object back to a string
   */
  formatRuleString(rule: Omit<PermissionRule, 'id'>): string {
    if (rule.pattern) {
      return `${rule.tool}(${rule.pattern})`;
    }
    return rule.tool;
  }

  /**
   * Validate a permission rule
   */
  validateRule(rule: Omit<PermissionRule, 'id'>): RuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const examples: string[] = [];

    // Check if tool is valid
    if (!this.isValidToolType(rule.tool)) {
      errors.push(`Invalid tool: "${rule.tool}"`);
      return { valid: false, error: errors.join(', '), warnings, examples };
    }

    // Check if pattern is required
    const requiresPattern = !TOOLS_WITHOUT_PATTERNS.includes(rule.tool);

    if (requiresPattern && !rule.pattern) {
      warnings.push(`Tool "${rule.tool}" typically requires a pattern. Leave blank to match all.`);
    }

    if (!requiresPattern && rule.pattern) {
      warnings.push(
        `Tool "${rule.tool}" doesn't typically use patterns. The pattern will be ignored.`
      );
    }

    // Validate pattern if provided
    if (rule.pattern) {
      const patternValidation = this.validatePattern(rule.tool, rule.pattern);
      if (!patternValidation.valid && patternValidation.error) {
        errors.push(patternValidation.error);
      }
      warnings.push(...(patternValidation.warnings || []));
      examples.push(...(patternValidation.examples || []));
    }

    const result: RuleValidationResult = {
      valid: errors.length === 0,
      warnings,
      examples,
    };

    if (errors.length > 0) {
      result.error = errors.join(', ');
    }

    return result;
  }

  /**
   * Validate a pattern for a specific tool
   */
  validatePattern(tool: ToolType, pattern: string): RuleValidationResult {
    const warnings: string[] = [];
    const examples: string[] = [];

    if (!pattern || pattern.trim() === '') {
      return {
        valid: true,
        warnings: ['Empty pattern will match everything'],
        examples: [],
      };
    }

    // Tool-specific validation and examples
    switch (tool) {
      case 'Bash':
        // Bash uses prefix matching
        examples.push(`${pattern}`, `${pattern}:something`, `${pattern} --flag`);

        if (pattern.includes('rm -rf')) {
          warnings.push('⚠️ This allows destructive delete operations');
        }
        if (pattern.includes('sudo')) {
          warnings.push('⚠️ This allows elevated privilege commands');
        }
        break;

      case 'Read':
      case 'Edit':
      case 'Write':
        // File operations use glob patterns
        if (pattern.includes('*')) {
          examples.push('Uses glob pattern matching');
        }
        if (pattern.includes('.env')) {
          warnings.push('⚠️ This affects environment files which may contain secrets');
        }
        if (pattern.includes('secret') || pattern.includes('key') || pattern.includes('password')) {
          warnings.push('⚠️ This pattern matches files that may contain sensitive data');
        }
        break;

      case 'WebFetch':
        // WebFetch uses domain patterns
        if (pattern.startsWith('domain:')) {
          const domain = pattern.substring(7);
          examples.push(`Fetches from ${domain}`);
        } else {
          warnings.push('WebFetch patterns should use "domain:example.com" format');
        }
        break;

      case 'SlashCommand':
        // Slash command names
        examples.push(`Matches the /${pattern} command`);
        break;

      default:
        // Other tools don't typically use patterns
        break;
    }

    return {
      valid: true,
      warnings,
      examples,
    };
  }

  /**
   * Test if a rule matches a given input
   */
  testRule(rule: Omit<PermissionRule, 'id'>, testInput: string): RuleMatchResult {
    const { tool, pattern } = rule;

    // If no pattern, matches all for that tool
    if (!pattern) {
      return {
        matches: true,
        reason: `Matches all ${tool} operations (no pattern specified)`,
      };
    }

    let matches = false;
    let reason = '';

    switch (tool) {
      case 'Bash':
        // Bash uses prefix matching
        matches = testInput.startsWith(pattern);
        reason = matches
          ? `Input "${testInput}" starts with pattern "${pattern}"`
          : `Input "${testInput}" does not start with pattern "${pattern}"`;
        break;

      case 'Read':
      case 'Edit':
      case 'Write':
        // File operations - simple glob matching (would use micromatch in production)
        matches = this.simpleGlobMatch(testInput, pattern);
        reason = matches
          ? `Path "${testInput}" matches glob pattern "${pattern}"`
          : `Path "${testInput}" does not match glob pattern "${pattern}"`;
        break;

      case 'WebFetch':
        if (pattern.startsWith('domain:')) {
          const domain = pattern.substring(7);
          matches = testInput.includes(domain);
          reason = matches
            ? `URL contains domain "${domain}"`
            : `URL does not contain domain "${domain}"`;
        } else {
          matches = testInput.includes(pattern);
          reason = matches ? `URL contains "${pattern}"` : `URL does not contain "${pattern}"`;
        }
        break;

      case 'SlashCommand':
        matches = testInput === pattern || testInput === `/${pattern}`;
        reason = matches ? `Command matches "/${pattern}"` : `Command does not match "/${pattern}"`;
        break;

      default:
        matches = false;
        reason = `Testing not supported for tool type "${tool}"`;
        break;
    }

    return { matches, reason };
  }

  /**
   * Get all available rule templates
   */
  getTemplates(): RuleTemplate[] {
    return RULE_TEMPLATES;
  }

  /**
   * Apply a template and return the generated rules
   */
  applyTemplate(templateId: string): PermissionRule[] {
    const template = RULE_TEMPLATES.find(t => t.id === templateId);

    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    console.log(`[PermissionRulesService] Applying template: ${template.name}`);

    // Generate rules from template
    return template.rules.map(rule => ({
      id: randomUUID(),
      ...rule,
    }));
  }

  /**
   * Check if a string is a valid tool type
   */
  private isValidToolType(tool: string): tool is ToolType {
    const validTools: ToolType[] = [
      'Bash',
      'Read',
      'Edit',
      'Write',
      'WebFetch',
      'WebSearch',
      'NotebookEdit',
      'SlashCommand',
      'Glob',
      'Grep',
      'NotebookRead',
      'Task',
    ];
    return validTools.includes(tool as ToolType);
  }

  /**
   * Simple glob pattern matching (basic implementation)
   * In production, would use a library like micromatch or minimatch
   */
  private simpleGlobMatch(text: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(text);
  }
}
