/**
 * Platform detection and script execution utilities
 *
 * Provides platform-specific configuration and script execution handling
 * for status line scripts across Windows, macOS, and Linux.
 */

import path from 'path';

/**
 * Detect the current operating system
 */
export function getPlatform(): 'windows' | 'macos' | 'linux' {
  const platform = process.platform;

  if (platform === 'win32') {
    return 'windows';
  } else if (platform === 'darwin') {
    return 'macos';
  } else {
    return 'linux';
  }
}

/**
 * Check if running on Windows
 */
export function isWindows(): boolean {
  return getPlatform() === 'windows';
}

/**
 * Check if running on macOS
 */
export function isMacOS(): boolean {
  return getPlatform() === 'macos';
}

/**
 * Check if running on Linux
 */
export function isLinux(): boolean {
  return getPlatform() === 'linux';
}

/**
 * Get the appropriate script extension for the current platform
 */
export function getScriptExtension(): 'bat' | 'sh' {
  return isWindows() ? 'bat' : 'sh';
}

/**
 * Get the appropriate script interpreter for the current platform
 */
export function getScriptInterpreter(): 'cmd' | 'bash' {
  return isWindows() ? 'cmd' : 'bash';
}

/**
 * Convert PowerShell JSON to command line arguments for batch files
 * Batch files read stdin differently than bash, so we need special handling
 */
export function encodeJsonForBatch(jsonData: Record<string, any>): string {
  // Escape quotes and newlines for batch consumption
  // Use a temporary file approach which is safer than command line encoding
  const jsonStr = JSON.stringify(jsonData);
  // Remove newlines and escape quotes for echo command
  return jsonStr.replace(/\n/g, ' ').replace(/"/g, '\\"');
}

/**
 * Get execution environment with proper PATH configuration
 * Windows: Minimal (native cmd.exe already has PATH)
 * macOS: Add Homebrew and system paths
 * Linux: Add standard paths
 */
export function getExecEnvForPlatform(): NodeJS.ProcessEnv {
  const env = { ...process.env };

  if (isMacOS()) {
    // Add common macOS binary paths that might not be in Electron's PATH
    const paths = [
      env.PATH || '',
      '/usr/local/bin',
      '/opt/homebrew/bin',
      '/opt/local/bin',
      '/usr/bin',
      '/bin'
    ];
    env.PATH = paths.filter(p => p).join(':');
  } else if (isLinux()) {
    // Ensure standard paths for Linux
    const paths = [
      env.PATH || '',
      '/usr/local/bin',
      '/usr/bin',
      '/bin'
    ];
    env.PATH = paths.filter(p => p).join(':');
  }
  // Windows: use existing PATH, cmd.exe handles it natively

  return env;
}

/**
 * Get the shell to use for script execution
 * Windows: cmd.exe (with 'type file | command' for stdin)
 * macOS/Linux: /bin/bash
 */
export function getShell(): string {
  return isWindows() ? 'cmd.exe' : '/bin/bash';
}

/**
 * Build the command to execute a script with input data using temp file approach
 *
 * This approach writes JSON to a temp file and redirects stdin from it,
 * avoiding all shell escaping issues on Windows.
 *
 * @param scriptPath - Path to the script to execute
 * @param tempDir - Directory to create temp file in
 * @param platform - Target platform (windows, macos, linux)
 * @returns Object containing the command string and temp file path
 */
export function buildScriptExecutionCommand(
  scriptPath: string,
  tempDir: string,
  platform: 'windows' | 'macos' | 'linux'
): { command: string; tempFile: string } {
  // Create unique temp file path with timestamp
  const tempFile = path.join(tempDir, `statusline-input-${Date.now()}.json`);

  if (platform === 'windows') {
    // Windows: Use 'type file | command' for stdin (PowerShell doesn't support '<' redirection)
    const ext = scriptPath.toLowerCase().split('.').pop();

    if (ext === 'js') {
      // Node.js script: type input.json | node script.js
      return {
        command: `type "${tempFile}" | node "${scriptPath}"`,
        tempFile
      };
    } else if (ext === 'py') {
      // Python script: type input.json | python script.py
      return {
        command: `type "${tempFile}" | python "${scriptPath}"`,
        tempFile
      };
    } else if (ext === 'bat') {
      // Batch script: type input.json | script.bat
      return {
        command: `type "${tempFile}" | "${scriptPath}"`,
        tempFile
      };
    } else {
      // Default to Node.js
      return {
        command: `type "${tempFile}" | node "${scriptPath}"`,
        tempFile
      };
    }
  } else {
    // Unix: bash script.sh < input.json
    return {
      command: `bash "${scriptPath}" < "${tempFile}"`,
      tempFile
    };
  }
}
