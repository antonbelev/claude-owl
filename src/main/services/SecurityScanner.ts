/**
 * SecurityScanner Service
 * Analyzes slash commands for security issues and calculates trust scores
 */

export type TrustLevel = 'trusted' | 'curated' | 'unknown' | 'dangerous';
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SecurityIssue {
  severity: IssueSeverity;
  line?: number;
  message: string;
  recommendation: string;
  autoFixable: boolean;
  fix?: string;
}

export interface ScanResult {
  commandName: string;
  trustScore: number;
  trustLevel: TrustLevel;
  issues: SecurityIssue[];
}

// Curated repos that get a +10 bonus
const CURATED_REPOS = [
  'github.com/hesreallyhim/awesome-claude-code',
  'github.com/wshobson/commands',
  'github.com/anthropics/claude-code-commands',
  'github.com/anthropics/claude-examples',
];

export class SecurityScanner {
  /**
   * Scan a single command for security issues and calculate trust score
   */
  static scanCommand(
    commandName: string,
    content: string,
    repoUrl?: string
  ): ScanResult {
    console.log('[SecurityScanner] Scanning command:', commandName);

    const issues: SecurityIssue[] = [];
    let score = 100;

    // Check for unknown source (not in CURATED_REPOS)
    if (repoUrl && !this.isCuratedRepo(repoUrl)) {
      console.log('[SecurityScanner] Unknown source detected');
      score -= 30;
    } else if (repoUrl) {
      console.log('[SecurityScanner] Curated repo detected, +10 bonus');
      score = Math.min(100, score + 10);
    }

    // Parse YAML frontmatter and command content
    const { frontmatter, commandContent } = this.parseFrontmatter(content);

    // Validate frontmatter structure
    if (!frontmatter.description) {
      console.log('[SecurityScanner] Missing description');
      issues.push({
        severity: 'medium',
        message: 'Missing description field in frontmatter',
        recommendation: 'Add a description to help users understand what this command does',
        autoFixable: false,
      });
      score -= 5;
    }

    // Check for missing argument-hint if command uses arguments
    if (this.usesArguments(commandContent) && !frontmatter['argument-hint']) {
      console.log('[SecurityScanner] Missing argument-hint');
      issues.push({
        severity: 'medium',
        message: 'Missing argument-hint field but command uses arguments ($1, $2, etc)',
        recommendation: 'Add argument-hint to show users what arguments are expected',
        autoFixable: true,
      });
      score -= 5;
    }

    // Check for bash execution patterns
    const bashIssues = this.checkBashPatterns(commandContent, frontmatter);
    issues.push(...bashIssues);
    score = Math.max(0, score - bashIssues.reduce((sum, issue) => {
      if (issue.severity === 'critical') return sum + 50;
      if (issue.severity === 'high') return sum + 20;
      if (issue.severity === 'medium') return sum + 10;
      return sum + 0;
    }, 0));

    // Check for overly permissive tool permissions
    const toolIssues = this.checkToolPermissions(frontmatter);
    issues.push(...toolIssues);
    score = Math.max(0, score - toolIssues.reduce((sum, issue) => {
      if (issue.severity === 'critical') return sum + 50;
      if (issue.severity === 'high') return sum + 20;
      if (issue.severity === 'medium') return sum + 10;
      return sum + 0;
    }, 0));

    // Determine trust level
    const trustLevel = this.getTrustLevel(score);
    console.log('[SecurityScanner] Scan complete:', { commandName, score, trustLevel, issueCount: issues.length });

    return {
      commandName,
      trustScore: Math.max(0, Math.min(100, score)),
      trustLevel,
      issues,
    };
  }

  /**
   * Check if repo is in the curated list
   */
  private static isCuratedRepo(repoUrl: string): boolean {
    const normalizedUrl = repoUrl.toLowerCase().replace('https://', '').replace('.git', '');
    return CURATED_REPOS.some(repo => normalizedUrl.includes(repo));
  }

  /**
   * Get trust level based on score
   */
  private static getTrustLevel(score: number): TrustLevel {
    if (score >= 90) return 'trusted';
    if (score >= 70) return 'curated';
    if (score >= 40) return 'unknown';
    return 'dangerous';
  }

  /**
   * Parse YAML frontmatter from markdown content
   */
  private static parseFrontmatter(content: string): {
    frontmatter: Record<string, any>;
    commandContent: string;
  } {
    const lines = content.split('\n');
    const frontmatter: Record<string, any> = {};
    let inFrontmatter = false;
    let frontmatterEndIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || '';

      if (line === '---') {
        if (!inFrontmatter) {
          inFrontmatter = true;
        } else {
          frontmatterEndIndex = i + 1;
          break;
        }
      } else if (inFrontmatter && line) {
        const [key, ...valueParts] = line.split(':');
        if (!key) continue;

        const value = valueParts.join(':').trim().replace(/^['"]|['"]$/g, '');

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

    const commandContent = lines.slice(frontmatterEndIndex).join('\n').trim();

    return { frontmatter, commandContent };
  }

  /**
   * Check if command uses positional arguments
   */
  private static usesArguments(content: string): boolean {
    return /\$\d+|\$ARGUMENTS/.test(content);
  }

  /**
   * Check for bash execution patterns and vulnerabilities
   */
  private static checkBashPatterns(
    content: string,
    frontmatter: Record<string, any>
  ): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // Check for bash execution
    if (!content.includes('!`')) {
      return issues; // No bash execution
    }

    const hasBashPermission = (frontmatter['allowed-tools'] || []).some((tool: string) =>
      tool.startsWith('Bash(')
    );

    if (!hasBashPermission) {
      console.log('[SecurityScanner] Bash execution without permission');
      issues.push({
        severity: 'critical',
        message: 'Command contains bash execution (!`) but Bash is not in allowed-tools',
        recommendation: 'Add Bash tool to allowed-tools or remove bash execution',
        autoFixable: false,
      });
    }

    // Check for unquoted variables in bash
    const unquotedVarPattern = /!`[^`]*?\$(?:ARGUMENTS|[1-9])(?!["'])/g;
    if (unquotedVarPattern.test(content)) {
      console.log('[SecurityScanner] Unquoted variables in bash');
      issues.push({
        severity: 'critical',
        message: 'Unquoted variables in bash execution can be dangerous (shell injection risk)',
        recommendation: 'Quote all variables: !`cmd "$1" "$2"`',
        autoFixable: true,
      });
    }

    // Check for dangerous bash patterns
    const dangerousPatterns = [
      { pattern: /rm\s+-rf\s+\//g, message: 'rm -rf / pattern detected (recursive root deletion)' },
      { pattern: /:\s*\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\};:/g, message: 'Fork bomb pattern detected' },
      {
        pattern: /curl\s+[^\s]*\s*\|\s*sh/g,
        message: 'curl | sh pattern detected (arbitrary code execution)',
      },
      { pattern: /eval\s+\$(?:ARGUMENTS|[1-9])/g, message: 'eval with user input detected' },
    ];

    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(content)) {
        console.log('[SecurityScanner] Dangerous bash pattern:', message);
        issues.push({
          severity: 'critical',
          message,
          recommendation: 'Remove or rewrite this pattern. It poses significant security risks.',
          autoFixable: false,
        });
      }
    }

    // Check for overly permissive Bash(*)
    if ((frontmatter['allowed-tools'] || []).includes('Bash(*)')) {
      console.log('[SecurityScanner] Overly permissive Bash(*)');
      issues.push({
        severity: 'high',
        message: 'Bash(*) allows ANY bash command execution',
        recommendation: 'Restrict to specific commands: Bash(git:*, npm:*, etc)',
        autoFixable: true,
      });
    }

    return issues;
  }

  /**
   * Check for overly permissive tool permissions
   */
  private static checkToolPermissions(frontmatter: Record<string, any>): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const allowedTools = frontmatter['allowed-tools'] || [];

    if (allowedTools.includes('Write(*)')) {
      console.log('[SecurityScanner] Overly permissive Write(*)');
      issues.push({
        severity: 'high',
        message: 'Write(*) allows modifying ANY file on the system',
        recommendation: 'Restrict to specific paths: Write(/path/to/dir/*)',
        autoFixable: true,
      });
    }

    if (allowedTools.includes('Edit(*)')) {
      console.log('[SecurityScanner] Overly permissive Edit(*)');
      issues.push({
        severity: 'high',
        message: 'Edit(*) allows editing ANY file on the system',
        recommendation: 'Restrict to specific paths: Edit(/path/to/dir/*)',
        autoFixable: true,
      });
    }

    return issues;
  }
}
