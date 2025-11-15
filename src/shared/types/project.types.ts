/**
 * Project discovery and .claude.json type definitions
 *
 * IMPORTANT: .claude.json is CLI-managed and READ-ONLY for Claude Owl
 * We use it only for project discovery, not for writing
 */

import type { MCPServerConfig } from './mcp.types';

/**
 * Structure of ~/.claude.json (CLI-managed, read-only)
 * Contains user preferences and project tracking
 */
export interface ClaudeConfig {
  // User preferences (CLI-managed)
  installMethod?: string;
  autoUpdates?: boolean;
  cachedStatsigGates?: Record<string, unknown>;
  firstStartTime?: string;
  userID?: string;
  sonnet45MigrationComplete?: boolean;
  fallbackAvailableWarningThreshold?: number;

  // Project tracking (our primary interest)
  projects?: Record<string, ClaudeProjectData>;

  // Allow unknown fields from CLI
  [key: string]: unknown;
}

/**
 * Project-specific data stored in .claude.json
 * Each project path maps to this configuration
 */
export interface ClaudeProjectData {
  // MCP Server configurations (read-only for display)
  mcpServers?: Record<string, MCPServerConfig>;
  enabledMcpjsonServers?: string[];
  disabledMcpjsonServers?: string[];
  mcpContextUris?: string[];

  // Tool permissions (deprecated but may exist)
  allowedTools?: string[];

  // Project metadata
  ignorePatterns?: string[];
  lastSessionId?: string;
  hasTrustDialogAccepted?: boolean;
  projectOnboardingSeenCount?: number;
  hasClaudeMdExternalIncludesApproved?: boolean;
  exampleFiles?: string[];

  // Allow unknown fields from CLI
  [key: string]: unknown;
}

/**
 * Project information extracted from .claude.json
 * Used for displaying project list in UI
 */
export interface ProjectInfo {
  // File system path to project
  path: string;

  // Display name (derived from path)
  name: string;

  // Project metadata
  lastSessionId?: string | undefined;
  hasTrustAccepted: boolean;

  // Feature counts for display
  mcpServerCount: number;
  mcpServerNames: string[];

  // Last modified (for sorting)
  lastModified?: Date | undefined;
}

/**
 * Project selection state
 * Tracks which project the user has selected
 */
export interface ProjectSelection {
  // Currently selected project path
  projectPath: string | null;

  // Project info for selected project
  projectInfo: ProjectInfo | null;
}

/**
 * Project scope for configuration editing
 * Determines which settings file to edit
 */
export type ProjectScope = 'user' | 'project';

/**
 * Project context for components
 * Provides project information throughout the app
 */
export interface ProjectContext {
  // Current scope (user or project)
  scope: ProjectScope;

  // Selected project (if scope is 'project')
  selectedProject: ProjectInfo | null;

  // Available projects
  availableProjects: ProjectInfo[];

  // Actions
  selectProject: (projectPath: string) => void;
  clearSelection: () => void;
  refreshProjects: () => Promise<void>;
}
