/**
 * Permission Rules type definitions
 * For managing Claude Code tool access permissions
 */

/**
 * Available Claude Code tools that can be restricted
 */
export type ToolType =
  | 'Bash'
  | 'Read'
  | 'Edit'
  | 'Write'
  | 'WebFetch'
  | 'WebSearch'
  | 'NotebookEdit'
  | 'SlashCommand'
  | 'Glob'
  | 'Grep'
  | 'NotebookRead'
  | 'Task';

/**
 * Permission level for a rule
 */
export type PermissionLevel = 'allow' | 'ask' | 'deny';

/**
 * Structured representation of a permission rule
 * Parsed from string format like "Bash(npm run test)"
 */
export interface PermissionRule {
  id: string; // UUID for React keys
  tool: ToolType;
  pattern?: string; // Optional pattern (some tools like 'WebFetch' can be tool-only)
  level: PermissionLevel;
  description?: string; // User-added note
  createdFrom?: 'template' | 'custom' | 'suggested';
}

/**
 * Template for creating multiple permission rules at once
 */
export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon identifier
  category: 'security' | 'development' | 'deployment' | 'custom';
  rules: Omit<PermissionRule, 'id'>[];
}

/**
 * Result of validating a permission rule or pattern
 */
export interface RuleValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  examples?: string[]; // Example strings that would match this pattern
}

/**
 * Result of testing a rule against an input
 */
export interface RuleMatchResult {
  matches: boolean;
  rule?: PermissionRule;
  reason?: string;
}

/**
 * Project detection result for smart suggestions
 */
export interface ProjectDetection {
  hasNpm: boolean;
  hasYarn: boolean;
  hasGit: boolean;
  hasEnvFiles: boolean;
  hasTypeScript: boolean;
  hasDocker: boolean;
  frameworks: string[]; // 'react', 'vue', 'next', etc.
}

/**
 * Suggested permission rules based on project detection
 */
export interface RuleSuggestion {
  rule: Omit<PermissionRule, 'id'>;
  reason: string; // Why this rule is suggested
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Built-in rule templates
 */
export const RULE_TEMPLATES: RuleTemplate[] = [
  {
    id: 'block-env-files',
    name: 'Block Environment Files',
    description: 'Prevent reading or editing .env files that may contain secrets',
    icon: '🔒',
    category: 'security',
    rules: [
      {
        tool: 'Read',
        pattern: '.env',
        level: 'deny',
        description: 'Block reading .env file',
        createdFrom: 'template',
      },
      {
        tool: 'Read',
        pattern: '.env.*',
        level: 'deny',
        description: 'Block reading .env variants',
        createdFrom: 'template',
      },
      {
        tool: 'Edit',
        pattern: '.env',
        level: 'deny',
        description: 'Block editing .env file',
        createdFrom: 'template',
      },
      {
        tool: 'Edit',
        pattern: '.env.*',
        level: 'deny',
        description: 'Block editing .env variants',
        createdFrom: 'template',
      },
    ],
  },
  {
    id: 'allow-npm-scripts',
    name: 'Allow npm Scripts',
    description: 'Allow common npm commands for building, testing, and linting',
    icon: '📦',
    category: 'development',
    rules: [
      {
        tool: 'Bash',
        pattern: 'npm run lint',
        level: 'allow',
        description: 'Allow npm lint',
        createdFrom: 'template',
      },
      {
        tool: 'Bash',
        pattern: 'npm run test',
        level: 'allow',
        description: 'Allow npm test (all variants)',
        createdFrom: 'template',
      },
      {
        tool: 'Bash',
        pattern: 'npm run build',
        level: 'allow',
        description: 'Allow npm build',
        createdFrom: 'template',
      },
      {
        tool: 'Bash',
        pattern: 'npm install',
        level: 'ask',
        description: 'Ask before installing dependencies',
        createdFrom: 'template',
      },
    ],
  },
  {
    id: 'git-readonly',
    name: 'Git Read-Only',
    description: 'Allow reading git status/diffs, but ask before commits and pushes',
    icon: '🔍',
    category: 'development',
    rules: [
      {
        tool: 'Bash',
        pattern: 'git status',
        level: 'allow',
        description: 'Allow git status',
        createdFrom: 'template',
      },
      {
        tool: 'Bash',
        pattern: 'git diff',
        level: 'allow',
        description: 'Allow git diff',
        createdFrom: 'template',
      },
      {
        tool: 'Bash',
        pattern: 'git log',
        level: 'allow',
        description: 'Allow git log',
        createdFrom: 'template',
      },
      {
        tool: 'Bash',
        pattern: 'git commit',
        level: 'ask',
        description: 'Ask before committing',
        createdFrom: 'template',
      },
      {
        tool: 'Bash',
        pattern: 'git push',
        level: 'ask',
        description: 'Ask before pushing',
        createdFrom: 'template',
      },
    ],
  },
  {
    id: 'block-secrets-dir',
    name: 'Block Secrets Directory',
    description: 'Prevent access to a secrets/ directory',
    icon: '🛡️',
    category: 'security',
    rules: [
      {
        tool: 'Read',
        pattern: './secrets/**',
        level: 'deny',
        description: 'Block reading secrets directory',
        createdFrom: 'template',
      },
      {
        tool: 'Edit',
        pattern: './secrets/**',
        level: 'deny',
        description: 'Block editing secrets directory',
        createdFrom: 'template',
      },
    ],
  },
  {
    id: 'allow-trusted-domains',
    name: 'Allow Trusted Domains',
    description: 'Allow web fetch to specific trusted domains',
    icon: '🌐',
    category: 'security',
    rules: [
      {
        tool: 'WebFetch',
        pattern: 'domain:anthropic.com',
        level: 'allow',
        description: 'Allow Anthropic domain',
        createdFrom: 'template',
      },
      {
        tool: 'WebFetch',
        pattern: 'domain:github.com',
        level: 'allow',
        description: 'Allow GitHub domain',
        createdFrom: 'template',
      },
      {
        tool: 'WebFetch',
        pattern: 'domain:npmjs.com',
        level: 'allow',
        description: 'Allow npm registry',
        createdFrom: 'template',
      },
    ],
  },
  {
    id: 'block-dangerous-commands',
    name: 'Block Dangerous Commands',
    description: 'Prevent potentially destructive system operations',
    icon: '⚠️',
    category: 'security',
    rules: [
      {
        tool: 'Bash',
        pattern: 'rm -rf',
        level: 'deny',
        description: 'Block recursive force delete',
        createdFrom: 'template',
      },
      {
        tool: 'Bash',
        pattern: 'sudo',
        level: 'deny',
        description: 'Block sudo commands',
        createdFrom: 'template',
      },
      {
        tool: 'Bash',
        pattern: 'chmod 777',
        level: 'deny',
        description: 'Block overly permissive chmod',
        createdFrom: 'template',
      },
    ],
  },
];

/**
 * Tool-specific pattern help text
 */
export const TOOL_PATTERN_HELP: Record<ToolType, string> = {
  Bash: 'Uses prefix matching. Example: "npm run test" matches "npm run test:unit"',
  Read: 'Uses glob patterns. Example: ".env*" matches ".env.local", ".env.production"',
  Edit: 'Uses glob patterns. Example: "./src/**/*.ts" matches all TypeScript files in src/',
  Write: 'Uses glob patterns. Example: "./dist/**" matches everything in dist directory',
  WebFetch: 'Use "domain:example.com" to restrict by domain, or leave blank for all domains',
  WebSearch: 'No pattern needed - this tool is allowed or denied entirely',
  NotebookEdit: 'Uses file path patterns. Example: "./notebooks/**/*.ipynb"',
  SlashCommand: 'Uses command name. Example: "deploy" matches the /deploy command',
  Glob: 'No pattern needed - this tool is allowed or denied entirely',
  Grep: 'No pattern needed - this tool is allowed or denied entirely',
  NotebookRead: 'No pattern needed - this tool is allowed or denied entirely',
  Task: 'No pattern needed - this tool is allowed or denied entirely',
};

/**
 * Tools that don't require patterns
 */
export const TOOLS_WITHOUT_PATTERNS: ToolType[] = [
  'WebSearch',
  'Glob',
  'Grep',
  'NotebookRead',
  'Task',
];
