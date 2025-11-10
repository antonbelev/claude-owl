/**
 * Agents and Commands IPC type definitions
 */

import type { Agent, Command } from './agent.types';
import type { IPCResponse } from './ipc.common.types';

/**
 * Agent request/response types
 */

export interface ListAgentsResponse extends IPCResponse<Agent[]> {}

export interface GetAgentRequest {
  filePath: string;
}

export interface GetAgentResponse extends IPCResponse<Agent> {}

export interface SaveAgentRequest {
  agent: Omit<Agent, 'lastModified'>;
}

export interface SaveAgentResponse extends IPCResponse {}

export interface DeleteAgentRequest {
  filePath: string;
}

export interface DeleteAgentResponse extends IPCResponse {}

/**
 * Command request/response types
 */

export interface ListCommandsResponse extends IPCResponse<Command[]> {}

export interface GetCommandRequest {
  filePath: string;
}

export interface GetCommandResponse extends IPCResponse<Command> {}

export interface SaveCommandRequest {
  command: Omit<Command, 'lastModified'>;
}

export interface SaveCommandResponse extends IPCResponse {}

export interface DeleteCommandRequest {
  filePath: string;
}

export interface DeleteCommandResponse extends IPCResponse {}
