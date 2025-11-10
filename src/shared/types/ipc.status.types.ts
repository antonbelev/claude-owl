/**
 * Service Status and Debug Logs IPC type definitions
 */

import type { IPCResponse } from './ipc.common.types';

/**
 * Service Status request/response types
 */

export type ServiceStatusLevel = 'operational' | 'degraded' | 'outage' | 'maintenance' | 'unknown';

export interface ServiceIncidentUpdate {
  status: string; // e.g., "Resolved", "Investigating", "Monitoring"
  message: string;
  timestamp: string; // ISO 8601
}

export interface ServiceIncident {
  id: string;
  title: string;
  url: string;
  publishedAt: string; // ISO 8601
  updates: ServiceIncidentUpdate[];
  resolved: boolean;
}

export interface ServiceStatus {
  level: ServiceStatusLevel;
  message: string;
  lastChecked: string; // ISO 8601
  recentIncidents: ServiceIncident[];
}

export interface GetServiceStatusResponse extends IPCResponse<ServiceStatus> {}

/**
 * Debug Logs request/response types
 */

export interface DebugLog {
  id: string; // UUID filename
  filename: string;
  path: string;
  size: number; // bytes
  timestamp: number; // Unix timestamp (milliseconds)
  content?: string; // Only populated when getting full content
}

export interface ListDebugLogsResponse extends IPCResponse<DebugLog[]> {}

export interface GetDebugLogRequest {
  filename: string;
}

export interface GetDebugLogResponse extends IPCResponse<DebugLog> {}

export interface DeleteDebugLogRequest {
  filename: string;
}

export interface DeleteDebugLogResponse extends IPCResponse {}

export interface SearchDebugLogsRequest {
  query: string;
}

export interface SearchDebugLogsResponse extends IPCResponse<DebugLog[]> {}
