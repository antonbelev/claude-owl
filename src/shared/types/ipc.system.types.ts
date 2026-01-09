/**
 * System, CLI, and CCUsage IPC type definitions
 */

import type { IPCResponse } from './ipc.common.types';

/**
 * CLI request/response types
 */

export interface ExecuteCLIRequest {
  command: string;
  args: string[];
  cwd?: string;
}

export interface ExecuteCLIResponse
  extends IPCResponse<{
    stdout?: string;
    stderr?: string;
    exitCode?: number;
  }> {}

/**
 * System request/response types
 */

export interface CheckClaudeInstalledResponse extends IPCResponse {
  installed?: boolean;
  version?: string;
  path?: string;
}

/**
 * CCUsage request/response types
 */

export interface UsageDay {
  date: string;
  models: string[];
  input: number;
  output: number;
  cacheCreate: number;
  cacheRead: number;
  totalTokens: number;
  cost: number;
}

export interface UsageReport {
  days: UsageDay[];
  total: {
    input: number;
    output: number;
    cacheCreate: number;
    cacheRead: number;
    totalTokens: number;
    cost: number;
  };
}

export interface CheckCCUsageInstalledResponse extends IPCResponse {
  installed?: boolean;
}

export interface GetCCUsageVersionResponse extends IPCResponse {
  version?: string | null;
}

export interface GetUsageReportResponse extends IPCResponse<UsageReport> {}

/**
 * Version checking request/response types
 */

export interface VersionInfo {
  currentVersion: string;
  latestVersion: string;
  isOutdated: boolean;
  releaseUrl?: string;
  releaseNotes?: string;
  publishedAt?: string;
}

export interface CheckVersionResponse extends IPCResponse<VersionInfo> {}
