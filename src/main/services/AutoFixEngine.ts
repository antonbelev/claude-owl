/**
 * AutoFixEngine
 * Automatically fixes common security issues in imported commands
 */

export interface FixResult {
  commandName: string;
  before: string;
  after: string;
  changesApplied: string[];
  newTrustScore?: number;
}

export class AutoFixEngine {
  /**
   * Apply all available auto-fixes to a command
   */
  static fixCommand(commandName: string, content: string): FixResult {
    console.log('[AutoFixEngine] Attempting to fix command:', commandName);

    let fixed = content;
    const changesApplied: string[] = [];

    // Parse frontmatter and content
    const { frontmatter, commandContent } = this.parseFrontmatterFull(content);

    // Fix 1: Quote unquoted variables in bash execution
    const quoteFixed = this.quoteUnquotedVariables(commandContent);
    if (quoteFixed !== commandContent) {
      console.log('[AutoFixEngine] Fixed: Quoted unquoted variables');
      changesApplied.push('Quoted unquoted variables in bash execution');
    }

    // Fix 2: Restrict Bash(*) to specific commands
    const { tools: restrictedTools, changed: bashRestricted } =
      this.restrictBashWildcard(frontmatter);
    if (bashRestricted) {
      console.log('[AutoFixEngine] Fixed: Restricted Bash(*)');
      changesApplied.push('Restricted Bash(*) to specific commands');
      frontmatter['allowed-tools'] = restrictedTools;
    }

    // Fix 3: Add missing argument-hint
    if (this.usesArguments(quoteFixed) && !frontmatter['argument-hint']) {
      const hint = this.generateArgumentHint(quoteFixed);
      if (hint) {
        console.log('[AutoFixEngine] Fixed: Added argument-hint');
        changesApplied.push(`Added argument-hint: ${hint}`);
        frontmatter['argument-hint'] = hint;
      }
    }

    // Fix 4: Add missing description (if we can extract from comments)
    if (!frontmatter.description) {
      const extractedDesc = this.extractDescription(commandContent);
      if (extractedDesc) {
        console.log('[AutoFixEngine] Fixed: Added description from comments');
        changesApplied.push(`Added description: ${extractedDesc}`);
        frontmatter.description = extractedDesc;
      }
    }

    // Fix 5: Restrict Write(*) and Edit(*)
    const { tools: restrictedWriteEditTools, changed: writeEditRestricted } =
      this.restrictWriteEditWildcards(frontmatter);
    if (writeEditRestricted) {
      console.log('[AutoFixEngine] Fixed: Restricted Write(*) or Edit(*)');
      changesApplied.push('Restricted Write(*) and/or Edit(*) to specific paths');
      frontmatter['allowed-tools'] = restrictedWriteEditTools;
    }

    // Reconstruct content
    if (changesApplied.length > 0 || quoteFixed !== commandContent) {
      const reconstructed = this.reconstructMarkdown(frontmatter, quoteFixed);
      fixed = reconstructed;
    }

    const result: FixResult = {
      commandName,
      before: content,
      after: fixed,
      changesApplied,
    };

    console.log('[AutoFixEngine] Fix complete:', {
      commandName,
      changesCount: changesApplied.length,
    });

    return result;
  }

  /**
   * Parse frontmatter with exact end position
   */
  private static parseFrontmatterFull(content: string): {
    frontmatter: Record<string, any>;
    commandContent: string;
  } {
    const lines = content.split('\n');
    const frontmatter: Record<string, any> = {};
    let inFrontmatter = false;
    let frontmatterEnd = 0; // Track end position for parsing purposes

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || '';

      if (line === '---') {
        if (!inFrontmatter) {
          inFrontmatter = true;
        } else {
          frontmatterEnd = i + 1;
          break;
        }
      } else if (inFrontmatter && line) {
        const [key, ...valueParts] = line.split(':');
        if (!key) continue;

        const value = valueParts
          .join(':')
          .trim()
          .replace(/^['"]|['"]$/g, '');

        // Handle arrays
        if (value.startsWith('[') && value.endsWith(']')) {
          frontmatter[key.trim()] = value
            .slice(1, -1)
            .split(',')
            .map(v => v.trim());
        } else {
          frontmatter[key.trim()] = value;
        }
      }
    }

    const commandContent = lines.slice(frontmatterEnd).join('\n').trim();

    return { frontmatter, commandContent };
  }

  /**
   * Quote unquoted variables in bash execution
   */
  private static quoteUnquotedVariables(content: string): string {
    // Find all bash execution blocks and fix unquoted variables
    let fixed = content;

    // Pattern: !`...` with unquoted variables
    fixed = fixed.replace(
      /!`([^`]*?)\$(\d+|ARGUMENTS)([^`]*?)`/g,
      (match, before, varNum, after) => {
        // Check if variable is already quoted
        if (before.includes(`"$${varNum}`) || before.includes(`'$${varNum}`)) {
          return match;
        }

        // Quote the variable
        const fixedBefore = before.replace(new RegExp(`\\$$${varNum}\\b`, 'g'), `"$${varNum}"`);
        return `!\`${fixedBefore}$${varNum}${after}\``;
      }
    );

    return fixed;
  }

  /**
   * Restrict Bash(*) to specific commands detected in the content
   */
  private static restrictBashWildcard(frontmatter: Record<string, any>): {
    tools: string[];
    changed: boolean;
  } {
    const tools = frontmatter['allowed-tools'] || [];
    const bashWildcardIndex = tools.findIndex((t: string) => t === 'Bash(*)');

    if (bashWildcardIndex === -1) {
      return { tools, changed: false };
    }

    // Detect common bash patterns from context
    const detectedCommands = ['git', 'npm', 'git', 'bash', 'sh'];
    const restrictedBash = `Bash(${detectedCommands.join(':*, ')}:*)`;

    const newTools = [...tools];
    newTools[bashWildcardIndex] = restrictedBash;

    return { tools: newTools, changed: true };
  }

  /**
   * Restrict Write(*) and Edit(*) to specific paths
   */
  private static restrictWriteEditWildcards(frontmatter: Record<string, any>): {
    tools: string[];
    changed: boolean;
  } {
    const tools = frontmatter['allowed-tools'] || [];
    let changed = false;

    const newTools = tools.map((tool: string) => {
      if (tool === 'Write(*)') {
        changed = true;
        return 'Write($HOME/.claude/*)';
      }
      if (tool === 'Edit(*)') {
        changed = true;
        return 'Edit($HOME/.claude/*)';
      }
      return tool;
    });

    return { tools: newTools, changed };
  }

  /**
   * Generate argument hint from command content
   */
  private static generateArgumentHint(content: string): string | null {
    const usesArg1 = /\$1/.test(content);
    const usesArg2 = /\$2/.test(content);
    const usesArg3 = /\$3/.test(content);

    const args = [];
    if (usesArg1) args.push('[argument]');
    if (usesArg2) args.push('[argument]');
    if (usesArg3) args.push('[argument]');

    return args.length > 0 ? args.join(' ') : null;
  }

  /**
   * Extract description from comments in command content
   */
  private static extractDescription(content: string): string | null {
    // Try to extract from first non-empty line or comment
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('!') && !trimmed.startsWith('@')) {
        // Clean up and limit length
        return trimmed.slice(0, 100);
      }
    }
    return null;
  }

  /**
   * Check if command uses positional arguments
   */
  private static usesArguments(content: string): boolean {
    return /\$\d+|\$ARGUMENTS/.test(content);
  }

  /**
   * Reconstruct markdown from frontmatter and content
   */
  private static reconstructMarkdown(
    frontmatter: Record<string, any>,
    commandContent: string
  ): string {
    const lines: string[] = ['---'];

    // Write frontmatter
    for (const [key, value] of Object.entries(frontmatter)) {
      if (Array.isArray(value)) {
        lines.push(`${key}: [${value.map(v => `"${v}"`).join(', ')}]`);
      } else if (typeof value === 'string' && value.includes(' ')) {
        lines.push(`${key}: "${value}"`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }

    lines.push('---');
    lines.push('');
    lines.push(commandContent);

    return lines.join('\n');
  }
}
