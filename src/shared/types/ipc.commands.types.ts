/**
 * Commands IPC type definitions
 * Extends basic command IPC types from ipc.agents.types.ts
 */

import type {
  Command,
  CommandWithMetadata,
  CommandCreateOptions,
  CommandUpdateOptions,
  CommandDeleteOptions,
  CommandMoveOptions,
  CommandFilter,
  CommandSortOptions,
  CommandValidationResult,
  GitHubImportValidation,
  CommandTemplate,
  ImportCommandOptions,
  ImportCommandResult,
  ExportCommandOptions,
  ExportCommandResult,
  BatchImportOptions,
  BatchImportResult,
  AutoFixResult,
} from './command.types';
import type { IPCResponse } from './ipc.common.types';

/**
 * Channel names for commands IPC
 */
export const COMMANDS_CHANNELS = {
  // CRUD operations
  LIST_COMMANDS: 'commands:list',
  GET_COMMAND: 'commands:get',
  CREATE_COMMAND: 'commands:create',
  UPDATE_COMMAND: 'commands:update',
  DELETE_COMMAND: 'commands:delete',
  MOVE_COMMAND: 'commands:move',

  // Validation
  VALIDATE_COMMAND: 'commands:validate',
  VALIDATE_GITHUB_IMPORT: 'commands:validate-github-import',
  AUTO_FIX: 'commands:auto-fix',

  // Templates
  LIST_TEMPLATES: 'commands:templates:list',
  GET_TEMPLATE: 'commands:templates:get',
  RENDER_TEMPLATE: 'commands:templates:render',

  // Import/Export
  IMPORT_COMMAND: 'commands:import',
  EXPORT_COMMAND: 'commands:export',
  IMPORT_BATCH: 'commands:import-batch',

  // GitHub operations
  DISCOVER_GITHUB_COMMANDS: 'commands:github:discover',
  FETCH_GITHUB_FILE: 'commands:github:fetch-file',
} as const;

/**
 * List commands
 */
export interface ListCommandsRequest {
  filter?: CommandFilter;
  sort?: CommandSortOptions;
}

export interface ListCommandsResponse extends IPCResponse<CommandWithMetadata[]> {}

/**
 * Get single command
 */
export interface GetCommandRequest {
  filePath: string;
}

export interface GetCommandResponse extends IPCResponse<CommandWithMetadata> {}

/**
 * Create command
 */
export interface CreateCommandRequest {
  options: CommandCreateOptions;
}

export interface CreateCommandResponse extends IPCResponse<{ filePath: string }> {}

/**
 * Update command
 */
export interface UpdateCommandRequest {
  options: CommandUpdateOptions;
}

export interface UpdateCommandResponse extends IPCResponse {}

/**
 * Delete command
 */
export interface DeleteCommandRequest {
  options: CommandDeleteOptions;
}

export interface DeleteCommandResponse extends IPCResponse {}

/**
 * Move command to different namespace
 */
export interface MoveCommandRequest {
  options: CommandMoveOptions;
}

export interface MoveCommandResponse extends IPCResponse<{ newFilePath: string }> {}

/**
 * Validate command
 */
export interface ValidateCommandRequest {
  command: Command;
  source?: {
    type: 'builtin' | 'curated' | 'github' | 'file' | 'clipboard';
    url?: string;
  };
}

export interface ValidateCommandResponse extends IPCResponse<CommandValidationResult> {}

/**
 * Validate GitHub import
 */
export interface ValidateGitHubImportRequest {
  command: Command;
  repoUrl: string;
  author: string;
}

export interface ValidateGitHubImportResponse extends IPCResponse<GitHubImportValidation> {}

/**
 * Auto-fix command issues
 */
export interface AutoFixCommandRequest {
  command: Command;
  issues: string[]; // Issue types to fix
}

export interface AutoFixCommandResponse extends IPCResponse<AutoFixResult> {}

/**
 * Template operations
 */
export interface ListTemplatesRequest {
  category?: string;
  difficulty?: string;
}

export interface ListTemplatesResponse extends IPCResponse<CommandTemplate[]> {}

export interface GetTemplateRequest {
  id: string;
}

export interface GetTemplateResponse extends IPCResponse<CommandTemplate> {}

export interface RenderTemplateRequest {
  id: string;
  variables: Record<string, string | number | boolean>;
}

export interface RenderTemplateResponse extends IPCResponse<Command> {}

/**
 * Import/Export
 */
export interface ImportCommandRequest {
  options: ImportCommandOptions;
}

export interface ImportCommandResponse extends IPCResponse<ImportCommandResult> {}

export interface ExportCommandRequest {
  options: ExportCommandOptions;
}

export interface ExportCommandResponse extends IPCResponse<ExportCommandResult> {}

export interface BatchImportRequest {
  options: BatchImportOptions;
}

export interface BatchImportResponse extends IPCResponse<BatchImportResult> {}

/**
 * GitHub discovery
 */
export interface DiscoverGitHubCommandsRequest {
  repoUrl: string;
}

export interface DiscoverGitHubCommandsResponse
  extends IPCResponse<{
    commands: Array<{
      name: string;
      path: string;
      url: string;
    }>;
  }> {}

export interface FetchGitHubFileRequest {
  url: string;
}

export interface FetchGitHubFileResponse
  extends IPCResponse<{
    content: string;
    command: Command;
  }> {}
