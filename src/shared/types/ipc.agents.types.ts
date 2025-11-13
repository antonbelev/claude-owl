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

/**
 * GitHub Import types
 */

export interface DiscoveredCommand {
  name: string;
  path: string;
  content: string;
  hash: string;
  size: number;
  lastModified: Date;
}

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  sha?: string;
}

export interface GitHubRepoStructure {
  owner: string;
  repo: string;
  branch: string;
  files: GitHubFile[];
  detectedPaths: {
    tools?: string;
    workflows?: string;
    commands?: string;
    other: string[];
  };
}

export interface DiscoverGitHubCommandsRequest {
  repoUrl: string;
  branch?: string;
  targetPath?: string;
}

export interface DiscoverGitHubCommandsResponse extends IPCResponse<DiscoveredCommand[]> {}

export interface BrowseGitHubRepoRequest {
  repoUrl: string;
  path?: string;
  branch?: string;
}

export interface BrowseGitHubRepoResponse extends IPCResponse<GitHubRepoStructure> {}

export interface FetchGitHubFilesRequest {
  repoUrl: string;
  filePaths: string[];
  branch?: string;
}

export interface FetchGitHubFilesResponse extends IPCResponse<DiscoveredCommand[]> {}

export interface ScanCommandSecurityRequest {
  commands: Array<{
    name: string;
    content: string;
  }>;
  repoUrl?: string;
}

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  line?: number;
  message: string;
  recommendation: string;
  autoFixable: boolean;
  fix?: string;
}

export interface ScanResult {
  commandName: string;
  trustScore: number;
  trustLevel: 'trusted' | 'curated' | 'unknown' | 'dangerous';
  issues: SecurityIssue[];
}

export interface ScanCommandSecurityResponse extends IPCResponse<ScanResult[]> {}

export interface AutoFixCommandRequest {
  commandName: string;
  content: string;
}

export interface FixResult {
  commandName: string;
  before: string;
  after: string;
  changesApplied: string[];
  newTrustScore?: number;
}

export interface AutoFixCommandResponse extends IPCResponse<FixResult> {}

export interface ImportGitHubCommandsRequest {
  commands: Array<{
    name: string;
    content: string;
  }>;
  location: 'user' | 'project';
  repoUrl: string;
  namespace?: string;
}

export interface ImportGitHubCommandsResponse
  extends IPCResponse<{
    imported: string[];
    failed: Array<{ name: string; reason: string }>;
  }> {}
