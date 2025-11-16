/**
 * Status Line IPC type definitions
 */

import type {
  StatusLineConfig,
  StatusLineTemplate,
  StatusLinePreviewResult,
  SecurityScanResult,
  MockSessionData,
} from './statusline.types';
import type { IPCResponse } from './ipc.common.types';

/**
 * Get active status line configuration
 */
export interface GetActiveStatusLineResponse extends IPCResponse<StatusLineConfig | null> {}

/**
 * List all available templates
 */
export interface ListTemplatesResponse extends IPCResponse<StatusLineTemplate[]> {}

/**
 * Set status line from a template
 */
export interface SetTemplateRequest {
  /** Template ID to activate */
  templateId: string;
}

export interface SetTemplateResponse extends IPCResponse {
  /** Path where the script was written */
  scriptPath?: string;
}

/**
 * Set custom status line script
 */
export interface SetCustomScriptRequest {
  /** Script content */
  scriptContent: string;

  /** Script language/interpreter */
  language?: 'bash' | 'python' | 'node';
}

export interface SetCustomScriptResponse extends IPCResponse {
  /** Path where the script was written */
  scriptPath?: string;
}

/**
 * Preview status line with mock data
 */
export interface PreviewStatusLineRequest {
  /** Template ID or custom script to preview */
  templateId?: string;

  /** Custom script content to preview */
  scriptContent?: string;

  /** Optional mock data (uses default if not provided) */
  mockData?: Partial<MockSessionData>;
}

export interface PreviewStatusLineResponse extends IPCResponse<StatusLinePreviewResult> {}

/**
 * Disable status line
 */
export interface DisableStatusLineResponse extends IPCResponse {}

/**
 * Scan script for security issues
 */
export interface ScanScriptRequest {
  /** Script content to scan */
  scriptContent: string;
}

export interface ScanScriptResponse extends IPCResponse<SecurityScanResult> {}

/**
 * Export template to standalone script file
 */
export interface ExportScriptRequest {
  /** Template ID to export */
  templateId: string;

  /** Target file path (optional, will prompt user if not provided) */
  targetPath?: string;
}

export interface ExportScriptResponse extends IPCResponse {
  /** Path where the script was exported */
  exportPath?: string;
}
