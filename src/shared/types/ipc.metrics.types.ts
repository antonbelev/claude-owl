/**
 * IPC type definitions for Metrics system
 */

import type { MetricsData, MetricsFilter } from './metrics.types';

/**
 * Request to compute metrics from JSONL files
 */
export interface ComputeMetricsRequest {
  filter?: MetricsFilter;
}

/**
 * Response from computing metrics
 */
export interface ComputeMetricsResponse {
  success: boolean;
  data?: MetricsData;
  error?: string;
}
