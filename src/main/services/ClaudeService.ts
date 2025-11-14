import { exec } from 'child_process';
import { promisify } from 'util';
import type {
  MCPAddOptions,
  MCPServer,
  MCPScope,
  MCPCommandResult,
} from '../../shared/types/mcp.types';

const execAsync = promisify(exec);

export interface ClaudeInstallationInfo {
  installed: boolean;
  version: string | null;
  path: string | null;
}

export class ClaudeService {
  /**
   * Check if Claude Code CLI is installed and get its version
   */
  async checkInstallation(): Promise<ClaudeInstallationInfo> {
    try {
      const { stdout, stderr } = await execAsync('which claude');

      if (stderr || !stdout.trim()) {
        return {
          installed: false,
          version: null,
          path: null,
        };
      }

      const claudePath = stdout.trim();

      // Get version
      try {
        const { stdout: versionOutput } = await execAsync('claude --version');
        const version = versionOutput.trim();

        return {
          installed: true,
          version,
          path: claudePath,
        };
      } catch {
        // Claude is installed but version command failed
        return {
          installed: true,
          version: null,
          path: claudePath,
        };
      }
    } catch (error) {
      return {
        installed: false,
        version: null,
        path: null,
      };
    }
  }

  /**
   * Get Claude Code version (assumes it's installed)
   */
  async getVersion(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('claude --version');
      return stdout.trim();
    } catch {
      return null;
    }
  }

  // ========================================================================
  // MCP Server Management Methods
  // ========================================================================

  /**
   * Add a new MCP server via `claude mcp add` command
   */
  async addMCPServer(options: MCPAddOptions): Promise<MCPCommandResult> {
    console.log('[ClaudeService] Adding MCP server:', options.name);

    try {
      const command = this.buildMCPAddCommand(options);
      console.log('[ClaudeService] Executing command:', command);

      const { stdout, stderr } = await execAsync(command);

      // Parse output to determine success
      const output = stdout + stderr;
      const success =
        !stderr.toLowerCase().includes('error') && !output.toLowerCase().includes('failed');

      console.log('[ClaudeService] MCP add result:', { success, output });

      return {
        success,
        message: success ? `Successfully added MCP server: ${options.name}` : output,
        error: success ? undefined : output,
      };
    } catch (error) {
      console.error('[ClaudeService] Failed to add MCP server:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to add MCP server: ${errorMessage}`,
      };
    }
  }

  /**
   * Remove an MCP server via `claude mcp remove` command
   */
  async removeMCPServer(name: string, scope: MCPScope): Promise<MCPCommandResult> {
    console.log('[ClaudeService] Removing MCP server:', { name, scope });

    try {
      const command = `claude mcp remove ${this.escapeArg(name)} --scope ${scope}`;
      console.log('[ClaudeService] Executing command:', command);

      const { stdout, stderr } = await execAsync(command);

      const output = stdout + stderr;
      const success =
        !stderr.toLowerCase().includes('error') && !output.toLowerCase().includes('failed');

      console.log('[ClaudeService] MCP remove result:', { success, output });

      return {
        success,
        message: success ? `Successfully removed MCP server: ${name}` : output,
        error: success ? undefined : output,
      };
    } catch (error) {
      console.error('[ClaudeService] Failed to remove MCP server:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to remove MCP server: ${errorMessage}`,
      };
    }
  }

  /**
   * List MCP servers via `claude mcp list` command
   * Note: claude mcp list doesn't support --scope filtering, so we list all servers
   */
  async listMCPServers(scope?: MCPScope): Promise<MCPServer[]> {
    console.log('[ClaudeService] Listing MCP servers (note: scope filter not supported by CLI)');

    try {
      // Try with --format json first
      let command = 'claude mcp list --format json';
      console.log('[ClaudeService] Executing command:', command);

      try {
        const { stdout, stderr } = await execAsync(command);

        // Try to parse as JSON
        if (stdout && stdout.trim()) {
          try {
            const servers = JSON.parse(stdout) as MCPServer[];
            console.log('[ClaudeService] Found MCP servers (JSON):', servers.length);
            return servers;
          } catch (jsonError) {
            console.log('[ClaudeService] JSON parse failed, trying text format');
            // Fall through to text parsing
          }
        }
      } catch (jsonCmdError) {
        console.log('[ClaudeService] --format json not supported, trying without');
      }

      // Fall back to plain text format
      command = 'claude mcp list';
      console.log('[ClaudeService] Executing command:', command);

      const { stdout, stderr } = await execAsync(command);

      if (stderr && stderr.toLowerCase().includes('error')) {
        console.error('[ClaudeService] Error listing MCP servers:', stderr);
        return [];
      }

      // Parse text output
      const servers = this.parseTextServerList(stdout);
      console.log('[ClaudeService] Found MCP servers (text):', servers.length);

      // Note: We ignore the scope parameter since claude mcp list doesn't support filtering by scope
      // The CLI returns all servers from all scopes combined
      return servers;
    } catch (error) {
      console.error('[ClaudeService] Failed to list MCP servers:', error);
      return [];
    }
  }

  /**
   * Get details of a specific MCP server via `claude mcp get` command
   */
  async getMCPServer(name: string): Promise<MCPServer | null> {
    console.log('[ClaudeService] Getting MCP server:', name);

    try {
      const command = `claude mcp get ${this.escapeArg(name)} --format json`;
      console.log('[ClaudeService] Executing command:', command);

      const { stdout, stderr } = await execAsync(command);

      if (stderr && stderr.toLowerCase().includes('error')) {
        console.error('[ClaudeService] Error getting MCP server:', stderr);
        return null;
      }

      // Parse JSON output
      try {
        const server = JSON.parse(stdout) as MCPServer;
        console.log('[ClaudeService] Found MCP server:', server.name);
        return server;
      } catch (parseError) {
        console.error('[ClaudeService] Failed to parse MCP get output:', parseError);
        return null;
      }
    } catch (error) {
      console.error('[ClaudeService] Failed to get MCP server:', error);
      return null;
    }
  }

  // ========================================================================
  // Private Helper Methods for MCP
  // ========================================================================

  /**
   * Build the `claude mcp add` command from options
   */
  private buildMCPAddCommand(options: MCPAddOptions): string {
    const parts: string[] = ['claude', 'mcp', 'add', this.escapeArg(options.name)];

    // Add transport and scope
    parts.push('--transport', options.transport);
    parts.push('--scope', options.scope);

    // Add environment variables
    if (options.env && Object.keys(options.env).length > 0) {
      for (const [key, value] of Object.entries(options.env)) {
        parts.push('--env', this.escapeArg(`${key}=${value}`));
      }
    }

    // Add HTTP headers (for HTTP/SSE transports)
    if (options.headers && Object.keys(options.headers).length > 0) {
      for (const [key, value] of Object.entries(options.headers)) {
        parts.push('--header', this.escapeArg(`${key}: ${value}`));
      }
    }

    // Add command and args for stdio transport
    if (options.transport === 'stdio' && options.command) {
      parts.push('--', this.escapeArg(options.command));
      if (options.args && options.args.length > 0) {
        parts.push(...options.args.map(arg => this.escapeArg(arg)));
      }
    }

    // Add URL for HTTP/SSE transports
    if ((options.transport === 'http' || options.transport === 'sse') && options.url) {
      parts.push(this.escapeArg(options.url));
    }

    return parts.join(' ');
  }

  /**
   * Escape shell arguments to prevent command injection
   */
  private escapeArg(arg: string): string {
    // If arg contains special characters, wrap in quotes and escape internal quotes
    if (
      arg.includes(' ') ||
      arg.includes('"') ||
      arg.includes("'") ||
      arg.includes('$') ||
      arg.includes('`') ||
      arg.includes('\\') ||
      arg.includes('&') ||
      arg.includes('|') ||
      arg.includes(';')
    ) {
      // Escape internal double quotes and wrap in double quotes
      return `"${arg.replace(/"/g, '\\"')}"`;
    }
    return arg;
  }

  /**
   * Parse text output from `claude mcp list` as fallback
   * This parser handles the actual output format from claude mcp list
   */
  private parseTextServerList(output: string): MCPServer[] {
    console.log('[ClaudeService] Parsing text server list (fallback)');
    console.log('[ClaudeService] Raw output:', output);

    const servers: MCPServer[] = [];
    const lines = output.split('\n').filter(line => line.trim());

    for (const line of lines) {
      // Skip header lines like "Checking MCP server health..."
      if (line.includes('Checking') || line.includes('health') || line.trim().length === 0) {
        continue;
      }

      // Parse format: "server-name: command args - ✓ Connected"
      // or: "server-name: command args - ✗ Error message"
      const match = line.match(/^([^:]+):\s+(.+?)\s+-\s+(.+)$/);
      if (match) {
        const [, name, commandPart, statusPart] = match;
        const serverName = name.trim();
        const commandStr = commandPart.trim();

        // Determine transport type
        let transport: 'stdio' | 'http' | 'sse' = 'stdio';
        let command: string | undefined;
        let args: string[] | undefined;
        let url: string | undefined;

        // Check if it's a URL (HTTP/SSE)
        if (commandStr.startsWith('http://') || commandStr.startsWith('https://')) {
          transport = 'http'; // Could be SSE too, but we'll default to http
          url = commandStr;
        } else {
          // It's stdio - parse command and args
          transport = 'stdio';
          const parts = commandStr.split(/\s+/);
          if (parts.length > 0) {
            command = parts[0];
            if (parts.length > 1) {
              args = parts.slice(1);
            }
          }
        }

        // Determine status
        let status: 'connected' | 'error' | 'unknown' = 'unknown';
        if (statusPart.includes('✓') || statusPart.toLowerCase().includes('connected')) {
          status = 'connected';
        } else if (statusPart.includes('✗') || statusPart.toLowerCase().includes('error')) {
          status = 'error';
        }

        const server: MCPServer = {
          name: serverName,
          transport,
          status,
        };

        if (command) server.command = command;
        if (args) server.args = args;
        if (url) server.url = url;

        servers.push(server);
        console.log('[ClaudeService] Parsed server:', server);
      }
    }

    console.log('[ClaudeService] Parsed', servers.length, 'servers from text output');
    return servers;
  }
}
