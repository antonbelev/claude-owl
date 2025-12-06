/**
 * Model alias constants for Claude Code configuration
 *
 * These aliases are the official model identifiers used in Claude Code settings.
 * Reference: https://code.claude.com/docs/en/model-config
 */

/**
 * Official Claude Code model aliases
 * These are the values that should be used in settings.json
 */
export const MODEL_ALIASES = {
  DEFAULT: 'default',
  SONNET: 'sonnet',
  OPUS: 'opus',
  HAIKU: 'haiku',
  SONNET_EXTENDED: 'sonnet[1m]',
  OPUS_PLAN: 'opusplan',
} as const;

/**
 * Model alias type - union of all valid aliases
 */
export type ModelAlias = (typeof MODEL_ALIASES)[keyof typeof MODEL_ALIASES];

/**
 * Model alias for agents (includes 'inherit' option)
 */
export type AgentModelAlias = ModelAlias | 'inherit';

/**
 * Model alias for commands (excludes 'inherit' and extended options)
 */
export type CommandModelAlias = 'default' | 'sonnet' | 'opus' | 'haiku';

/**
 * Display configuration for each model alias
 */
export interface ModelDisplayInfo {
  alias: ModelAlias;
  label: string;
  description: string;
  recommended?: boolean;
}

/**
 * All available models with their display information
 * Ordered by recommendation/capability
 */
export const MODEL_OPTIONS: ModelDisplayInfo[] = [
  {
    alias: 'default',
    label: 'Default',
    description: 'Recommended model based on your account type',
    recommended: true,
  },
  {
    alias: 'sonnet',
    label: 'Sonnet',
    description: 'Latest Sonnet model for routine coding tasks',
  },
  {
    alias: 'opus',
    label: 'Opus',
    description: 'Most capable model for intricate reasoning tasks',
  },
  {
    alias: 'haiku',
    label: 'Haiku',
    description: 'Fast and efficient for simple tasks',
  },
  {
    alias: 'sonnet[1m]',
    label: 'Sonnet (Extended)',
    description: 'Sonnet with 1M token context for lengthy sessions',
  },
  {
    alias: 'opusplan',
    label: 'Opus Plan',
    description: 'Uses Opus for planning, Sonnet for execution',
  },
];

/**
 * Model options for agent configuration (includes 'inherit')
 */
export const AGENT_MODEL_OPTIONS: (
  | ModelDisplayInfo
  | { alias: 'inherit'; label: string; description: string }
)[] = [
  {
    alias: 'default',
    label: 'Default',
    description: 'Use the default model setting',
  },
  {
    alias: 'inherit',
    label: 'Inherit',
    description: 'Inherit model from parent context',
  },
  {
    alias: 'sonnet',
    label: 'Sonnet',
    description: 'Latest Sonnet model for routine coding tasks',
  },
  {
    alias: 'opus',
    label: 'Opus',
    description: 'Most capable model for intricate reasoning tasks',
  },
  {
    alias: 'haiku',
    label: 'Haiku',
    description: 'Fast and efficient for simple tasks',
  },
  {
    alias: 'sonnet[1m]',
    label: 'Sonnet (Extended)',
    description: 'Sonnet with 1M token context for lengthy sessions',
  },
  {
    alias: 'opusplan',
    label: 'Opus Plan',
    description: 'Uses Opus for planning, Sonnet for execution',
  },
];

/**
 * Model options for command configuration (simpler set)
 */
export const COMMAND_MODEL_OPTIONS: {
  alias: CommandModelAlias;
  label: string;
  description: string;
}[] = [
  {
    alias: 'default',
    label: 'Default (Current Model)',
    description: "Uses the user's current model setting",
  },
  {
    alias: 'opus',
    label: 'Opus (Most capable)',
    description: 'Best for complex reasoning tasks',
  },
  {
    alias: 'sonnet',
    label: 'Sonnet (Balanced)',
    description: 'Good balance of capability and speed',
  },
  {
    alias: 'haiku',
    label: 'Haiku (Fastest)',
    description: 'Best for simple, quick tasks',
  },
];

/**
 * Check if a string is a valid model alias
 */
export function isValidModelAlias(value: string): value is ModelAlias {
  return Object.values(MODEL_ALIASES).includes(value as ModelAlias);
}

/**
 * Check if a string is a valid agent model alias (includes 'inherit')
 */
export function isValidAgentModelAlias(value: string): value is AgentModelAlias {
  return isValidModelAlias(value) || value === 'inherit';
}

/**
 * Get display info for a model alias
 */
export function getModelDisplayInfo(alias: string): ModelDisplayInfo | undefined {
  return MODEL_OPTIONS.find(m => m.alias === alias);
}

/**
 * Get the display label for a model alias
 */
export function getModelLabel(alias: string): string {
  const info = getModelDisplayInfo(alias);
  return info?.label || alias;
}
