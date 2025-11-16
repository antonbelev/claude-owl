/**
 * Skills IPC type definitions
 */

import type { Skill } from './agent.types';
import type { IPCResponse } from './ipc.common.types';

/**
 * Skill request/response types
 */

export interface ListSkillsResponse extends IPCResponse<Skill[]> {}

export interface GetSkillRequest {
  name: string;
  location: 'user' | 'project';
  projectPath?: string;
}

export interface GetSkillResponse extends IPCResponse<Skill> {}

export interface SaveSkillRequest {
  skill: {
    name: string;
    description: string;
    'allowed-tools'?: string[];
    content: string;
    location: 'user' | 'project';
    projectPath?: string;
  };
}

export interface SaveSkillResponse extends IPCResponse<Skill> {}

export interface DeleteSkillRequest {
  name: string;
  location: 'user' | 'project';
  projectPath?: string;
}

export interface DeleteSkillResponse extends IPCResponse {}
