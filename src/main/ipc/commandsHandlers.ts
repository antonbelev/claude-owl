import { ipcMain } from 'electron';
import { COMMANDS_CHANNELS } from '@/shared/types/ipc.commands.types';
import type {
  ListCommandsRequest,
  ListCommandsResponse,
  GetCommandRequest,
  GetCommandResponse,
  CreateCommandRequest,
  CreateCommandResponse,
  UpdateCommandRequest,
  UpdateCommandResponse,
  DeleteCommandRequest,
  DeleteCommandResponse,
  MoveCommandRequest,
  MoveCommandResponse,
} from '@/shared/types/ipc.commands.types';
import { CommandsService } from '../services/CommandsService';

const commandsService = new CommandsService();

/**
 * Register IPC handlers for commands operations
 */
export function registerCommandsHandlers() {
  console.log('[CommandsHandlers] Registering IPC handlers');

  // List all commands
  ipcMain.handle(
    COMMANDS_CHANNELS.LIST_COMMANDS,
    async (_event, request?: ListCommandsRequest): Promise<ListCommandsResponse> => {
      console.log('[CommandsHandlers] LIST_COMMANDS request:', request);

      try {
        const commands = await commandsService.listAllCommands(request?.filter, request?.sort);

        console.log('[CommandsHandlers] LIST_COMMANDS success:', {
          count: commands.length,
        });

        return {
          success: true,
          data: commands,
        };
      } catch (error) {
        console.error('[CommandsHandlers] LIST_COMMANDS error:', error);

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to list commands',
        };
      }
    }
  );

  // Get a specific command
  ipcMain.handle(
    COMMANDS_CHANNELS.GET_COMMAND,
    async (_event, request: GetCommandRequest): Promise<GetCommandResponse> => {
      console.log('[CommandsHandlers] GET_COMMAND request:', {
        filePath: request.filePath,
      });

      try {
        const command = await commandsService.getCommand(request.filePath);

        console.log('[CommandsHandlers] GET_COMMAND success:', {
          name: command.name,
          location: command.location,
        });

        return {
          success: true,
          data: command,
        };
      } catch (error) {
        console.error('[CommandsHandlers] GET_COMMAND error:', error);

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get command',
        };
      }
    }
  );

  // Create a new command
  ipcMain.handle(
    COMMANDS_CHANNELS.CREATE_COMMAND,
    async (_event, request: CreateCommandRequest): Promise<CreateCommandResponse> => {
      console.log('[CommandsHandlers] CREATE_COMMAND request:', {
        name: request.options.name,
        location: request.options.location,
        namespace: request.options.namespace,
      });

      try {
        const filePath = await commandsService.createCommand(request.options);

        console.log('[CommandsHandlers] CREATE_COMMAND success:', {
          filePath,
        });

        return {
          success: true,
          data: { filePath },
        };
      } catch (error) {
        console.error('[CommandsHandlers] CREATE_COMMAND error:', error);

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create command',
        };
      }
    }
  );

  // Update an existing command
  ipcMain.handle(
    COMMANDS_CHANNELS.UPDATE_COMMAND,
    async (_event, request: UpdateCommandRequest): Promise<UpdateCommandResponse> => {
      console.log('[CommandsHandlers] UPDATE_COMMAND request:', {
        filePath: request.options.filePath,
        hasFrontmatter: !!request.options.frontmatter,
        hasContent: request.options.content !== undefined,
        namespace: request.options.namespace,
      });

      try {
        await commandsService.updateCommand(request.options);

        console.log('[CommandsHandlers] UPDATE_COMMAND success');

        return {
          success: true,
        };
      } catch (error) {
        console.error('[CommandsHandlers] UPDATE_COMMAND error:', error);

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update command',
        };
      }
    }
  );

  // Delete a command
  ipcMain.handle(
    COMMANDS_CHANNELS.DELETE_COMMAND,
    async (_event, request: DeleteCommandRequest): Promise<DeleteCommandResponse> => {
      console.log('[CommandsHandlers] DELETE_COMMAND request:', {
        filePath: request.options.filePath,
        location: request.options.location,
      });

      try {
        await commandsService.deleteCommand(request.options);

        console.log('[CommandsHandlers] DELETE_COMMAND success');

        return {
          success: true,
        };
      } catch (error) {
        console.error('[CommandsHandlers] DELETE_COMMAND error:', error);

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete command',
        };
      }
    }
  );

  // Move command to different namespace
  ipcMain.handle(
    COMMANDS_CHANNELS.MOVE_COMMAND,
    async (_event, request: MoveCommandRequest): Promise<MoveCommandResponse> => {
      console.log('[CommandsHandlers] MOVE_COMMAND request:', {
        filePath: request.options.filePath,
        newNamespace: request.options.newNamespace,
      });

      try {
        const newFilePath = await commandsService.moveCommand(request.options);

        console.log('[CommandsHandlers] MOVE_COMMAND success:', {
          newFilePath,
        });

        return {
          success: true,
          data: { newFilePath },
        };
      } catch (error) {
        console.error('[CommandsHandlers] MOVE_COMMAND error:', error);

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to move command',
        };
      }
    }
  );

  console.log('[CommandsHandlers] IPC handlers registered successfully');
}
