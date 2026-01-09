import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
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

/**
 * Structure of the .claude.json config file
 */
interface ClaudeConfigFile {
  mcpServers?: Record<string, ClaudeConfigMCPServer>;
  projects?: Record<string, ClaudeConfigProject>;
  [key: string]: unknown;
}

interface ClaudeConfigProject {
  mcpServers?: Record<string, ClaudeConfigMCPServer>;
  [key: string]: unknown;
}

interface ClaudeConfigMCPServer {
  type: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  headers?: Record<string, string>;
}

export class ClaudeService {
  /**
   * Get the execution environment with proper PATH for different platforms
   * This is needed because packaged Electron apps don't inherit the user's PATH
   */
  private getExecEnv() {
    const env = { ...process.env };

    if (process.platform === 'darwin') {
      // macOS: Add common binary paths that might not be in Electron's PATH
      const paths = [env.PATH || '', '/usr/local/bin', '/opt/homebrew/bin', '/usr/bin', '/bin'];
      env.PATH = paths.filter(p => p).join(':');
    } else if (process.platform === 'win32') {
      // Windows: Add common binary paths
      const userProfile = env.USERPROFILE || 'C:\\Users\\Default';
      const paths = [
        env.PATH || '',
        path.join(userProfile, '.local', 'bin'), // Claude Code default install location
        'C:\\Program Files\\nodejs\\',
        path.join(userProfile, 'AppData', 'Roaming', 'npm'),
        'C:\\Windows\\System32',
        'C:\\Windows',
      ];
      env.PATH = paths.filter(p => p).join(';'); // Windows uses semicolon separator
    }

    return env;
  }

  /**
   * Check if Claude Code CLI is installed and get its version
   */
  async checkInstallation(): Promise<ClaudeInstallationInfo> {
    try {
      const env = this.getExecEnv();
      // Use 'where' on Windows, 'which' on Unix-like systems
      const command = process.platform === 'win32' ? 'where claude' : 'which claude';

      console.log('[ClaudeService] Checking Claude installation with command:', command);

      const { stdout, stderr } = await execAsync(command, { env });

      if (stderr || !stdout.trim()) {
        return {
          installed: false,
          version: null,
          path: null,
        };
      }

      // Windows 'where' may return multiple paths, take the first one
      const claudePath = stdout.trim().split('\n')[0];

      console.log('[ClaudeService] Claude CLI found at:', claudePath);

      // Get version
      try {
        const { stdout: versionOutput } = await execAsync('claude --version', { env });
        const version = versionOutput.trim();

        return {
          installed: true,
          version: version || null,
          path: claudePath || null,
        };
      } catch {
        // Claude is installed but version command failed
        return {
          installed: true,
          version: null,
          path: claudePath || null,
        };
      }
    } catch (error) {
      console.log('[ClaudeService] Claude CLI not found');
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
      const { stdout } = await execAsync('claude --version', { env: this.getExecEnv() });
      return stdout.trim();
    } catch {
      return null;
    }
  }

  /**
   * Read and parse the ~/.claude.json config file
   */
  private async readClaudeConfigFile(): Promise<ClaudeConfigFile | null> {
    try {
      const homeDir = os.homedir();
      const configPath = path.join(homeDir, '.claude.json');

      console.log('[ClaudeService] Reading config file:', configPath);

      const fileContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(fileContent) as ClaudeConfigFile;

      console.log('[ClaudeService] Config file loaded successfully');
      return config;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('[ClaudeService] Config file not found, no MCP servers configured');
        return null;
      }
      console.error('[ClaudeService] Failed to read config file:', error);
      return null;
    }
  }

  /**
   * Parse MCP servers from the .claude.json config file
   */
  private parseServersFromConfig(config: ClaudeConfigFile): MCPServer[] {
    const servers: MCPServer[] = [];

    // Parse global/user-level servers
    if (config.mcpServers) {
      for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
        const server = this.convertConfigServerToMCPServer(name, serverConfig, 'user');
        if (server) {
          servers.push(server);
        }
      }
    }

    // Parse project-level servers
    if (config.projects) {
      for (const [projectPath, projectConfig] of Object.entries(config.projects)) {
        if (projectConfig.mcpServers) {
          for (const [name, serverConfig] of Object.entries(projectConfig.mcpServers)) {
            const server = this.convertConfigServerToMCPServer(
              name,
              serverConfig,
              'project',
              projectPath
            );
            if (server) {
              servers.push(server);
            }
          }
        }
      }
    }

    console.log('[ClaudeService] Parsed', servers.length, 'servers from config file');
    return servers;
  }

  /**
   * Convert a config file server entry to MCPServer type
   */
  private convertConfigServerToMCPServer(
    name: string,
    config: ClaudeConfigMCPServer,
    scope: MCPScope,
    projectPath?: string
  ): MCPServer | null {
    try {
      const server: MCPServer = {
        name,
        transport: config.type,
        scope,
      };

      // Add stdio-specific fields
      if (config.type === 'stdio') {
        if (config.command) {
          server.command = config.command;
        }
        if (config.args) {
          server.args = config.args;
        }
      }

      // Add HTTP/SSE-specific fields
      if (config.type === 'http' || config.type === 'sse') {
        if (config.url) {
          server.url = config.url;
        }
      }

      // Add optional metadata
      if (config.env) {
        server.env = config.env;
      }
      if (config.headers) {
        server.headers = config.headers;
      }

      // Add project path for project-scoped servers
      if (projectPath) {
        server.projectPath = projectPath;
      }

      return server;
    } catch (error) {
      console.error('[ClaudeService] Failed to convert server config:', name, error);
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
    console.log('[ClaudeService] Adding MCP server:', {
      name: options.name,
      scope: options.scope,
      projectPath: options.projectPath,
    });

    // Validate project path if scope is 'project'
    if (options.scope === 'project' && !options.projectPath) {
      return {
        success: false,
        error: 'projectPath is required when scope is "project"',
      };
    }

    try {
      const command = this.buildMCPAddCommand(options);
      const cwd =
        options.scope === 'project' && options.projectPath ? options.projectPath : undefined;

      console.log('[ClaudeService] Executing command:', command, { cwd });

      const { stdout, stderr } = await execAsync(command, { cwd, env: this.getExecEnv() });

      // Parse output to determine success
      const output = stdout + stderr;
      const success =
        !stderr.toLowerCase().includes('error') && !output.toLowerCase().includes('failed');

      console.log('[ClaudeService] MCP add result:', { success, output });

      const result: MCPCommandResult = {
        success,
        message: success ? `Successfully added MCP server: ${options.name}` : output,
      };
      if (!success) {
        result.error = output;
      }
      return result;
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
   * Note: We don't pass --scope because the CLI automatically finds the server
   * across all config files (.claude.json, .mcp.json, etc.)
   */
  async removeMCPServer(
    name: string,
    scope: MCPScope,
    projectPath?: string
  ): Promise<MCPCommandResult> {
    console.log('[ClaudeService] Removing MCP server:', { name, scope, projectPath });

    // Validate project path if scope is 'project'
    if (scope === 'project' && !projectPath) {
      return {
        success: false,
        error: 'projectPath is required when scope is "project"',
      };
    }

    try {
      // Don't pass --scope - let the CLI find and remove the server automatically
      // This fixes the issue where --scope project looks in .mcp.json,
      // but project servers are actually in .claude.json under projects[path].mcpServers
      const command = `claude mcp remove ${this.escapeArg(name)}`;
      const cwd = scope === 'project' && projectPath ? projectPath : undefined;

      console.log('[ClaudeService] Executing command:', command, { cwd });

      const { stdout, stderr } = await execAsync(command, { cwd, env: this.getExecEnv() });

      const output = stdout + stderr;
      const success =
        !stderr.toLowerCase().includes('error') && !output.toLowerCase().includes('failed');

      console.log('[ClaudeService] MCP remove result:', { success, output });

      const result: MCPCommandResult = {
        success,
        message: success ? `Successfully removed MCP server: ${name}` : output,
      };
      if (!success) {
        result.error = output;
      }
      return result;
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
   * List MCP servers by reading the ~/.claude.json config file
   * This provides accurate scope and project information, unlike the CLI
   */
  async listMCPServers(scope?: MCPScope): Promise<MCPServer[]> {
    console.log('[ClaudeService] Listing MCP servers from config file, scope:', scope || 'all');

    try {
      // Read the config file
      const config = await this.readClaudeConfigFile();
      if (!config) {
        console.log('[ClaudeService] No config file found, returning empty list');
        return [];
      }

      // Parse all servers from the config
      let servers = this.parseServersFromConfig(config);

      // Filter by scope if specified
      if (scope) {
        servers = servers.filter(server => server.scope === scope);
        console.log('[ClaudeService] Filtered to', servers.length, 'servers with scope:', scope);
      }

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

      const { stdout, stderr } = await execAsync(command, { env: this.getExecEnv() });

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
   *
   * Command syntax: claude mcp add [options] <name> <commandOrUrl> [args...]
   *
   * Note: --env and --header are variadic options and must come AFTER the
   * positional arguments (name and URL), otherwise the CLI gets confused.
   *
   * Correct order:
   *   claude mcp add --transport http --scope user <name> <url> --env KEY=value --header "Header: value"
   */
  private buildMCPAddCommand(options: MCPAddOptions): string {
    const parts: string[] = ['claude', 'mcp', 'add'];

    // Add transport and scope options first (non-variadic)
    parts.push('--transport', options.transport);
    parts.push('--scope', options.scope);

    // Add positional arguments: <name> <commandOrUrl>
    parts.push(this.escapeArg(options.name));

    // Add URL for HTTP/SSE transports
    if ((options.transport === 'http' || options.transport === 'sse') && options.url) {
      parts.push(this.escapeArg(options.url));
    }

    // Add command and args for stdio transport
    if (options.transport === 'stdio' && options.command) {
      // Windows-specific: Wrap npx with cmd /c
      // See: https://code.claude.com/docs/en/mcp
      if (process.platform === 'win32' && options.command.toLowerCase().includes('npx')) {
        console.log('[ClaudeService] Adding Windows cmd /c wrapper for npx command');
        parts.push('cmd', '/c', this.escapeArg(options.command));
      } else {
        parts.push(this.escapeArg(options.command));
      }

      if (options.args && options.args.length > 0) {
        parts.push(...options.args.map(arg => this.escapeArg(arg)));
      }
    }

    // Add variadic options AFTER positional arguments
    // (--env and --header consume all following values until next option)

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
   * @deprecated Reserved for future use if JSON parsing fails
   */
  // @ts-expect-error - Reserved for future use if JSON parsing fails
  private _parseTextServerList(output: string): MCPServer[] {
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
      if (match && match[1] && match[2] && match[3]) {
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

  // ========================================================================
  // Plugin Management Methods
  // ========================================================================

  /**
   * Install a plugin via `claude plugin install` command
   */
  async installPlugin(
    pluginName: string,
    marketplaceName: string,
    projectPath?: string
  ): Promise<MCPCommandResult> {
    console.log('[ClaudeService] Installing plugin:', { pluginName, marketplaceName, projectPath });

    try {
      // Construct the full plugin identifier and escape it as a single argument
      const pluginId = `${pluginName}@${marketplaceName}`;
      const command = `claude plugin install ${this.escapeArg(pluginId)}`;
      const cwd = projectPath || undefined;

      console.log('[ClaudeService] Executing command:', command, { cwd });

      const { stdout, stderr } = await execAsync(command, { cwd, env: this.getExecEnv() });

      const output = stdout + stderr;
      const success =
        !stderr.toLowerCase().includes('error') &&
        !output.toLowerCase().includes('failed') &&
        (output.toLowerCase().includes('successfully installed') ||
          output.toLowerCase().includes('installed'));

      console.log('[ClaudeService] Plugin install result:', { success, output });

      const result: MCPCommandResult = {
        success,
        message: success ? `Successfully installed plugin: ${pluginName}` : output,
      };
      if (!success) {
        result.error = output;
      }
      return result;
    } catch (error) {
      console.error('[ClaudeService] Failed to install plugin:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to install plugin: ${errorMessage}`,
      };
    }
  }

  /**
   * Uninstall a plugin via `claude plugin uninstall` command
   */
  async uninstallPlugin(
    pluginName: string,
    marketplaceName: string,
    projectPath?: string
  ): Promise<MCPCommandResult> {
    console.log('[ClaudeService] Uninstalling plugin:', {
      pluginName,
      marketplaceName,
      projectPath,
    });

    try {
      // Construct the full plugin identifier and escape it as a single argument
      const pluginId = `${pluginName}@${marketplaceName}`;
      const command = `claude plugin uninstall ${this.escapeArg(pluginId)}`;
      const cwd = projectPath || undefined;

      console.log('[ClaudeService] Executing command:', command, { cwd });

      const { stdout, stderr } = await execAsync(command, { cwd, env: this.getExecEnv() });

      const output = stdout + stderr;
      const success =
        !stderr.toLowerCase().includes('error') && !output.toLowerCase().includes('failed');

      console.log('[ClaudeService] Plugin uninstall result:', { success, output });

      const result: MCPCommandResult = {
        success,
        message: success ? `Successfully uninstalled plugin: ${pluginName}` : output,
      };
      if (!success) {
        result.error = output;
      }
      return result;
    } catch (error) {
      console.error('[ClaudeService] Failed to uninstall plugin:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to uninstall plugin: ${errorMessage}`,
      };
    }
  }

  /**
   * Enable a plugin via `claude plugin enable` command
   */
  async enablePlugin(
    pluginName: string,
    marketplaceName: string,
    projectPath?: string
  ): Promise<MCPCommandResult> {
    console.log('[ClaudeService] Enabling plugin:', { pluginName, marketplaceName, projectPath });

    try {
      // Construct the full plugin identifier and escape it as a single argument
      const pluginId = `${pluginName}@${marketplaceName}`;
      const command = `claude plugin enable ${this.escapeArg(pluginId)}`;
      const cwd = projectPath || undefined;

      console.log('[ClaudeService] Executing command:', command, { cwd });

      const { stdout, stderr } = await execAsync(command, { cwd, env: this.getExecEnv() });

      const output = stdout + stderr;
      const success =
        !stderr.toLowerCase().includes('error') && !output.toLowerCase().includes('failed');

      console.log('[ClaudeService] Plugin enable result:', { success, output });

      const result: MCPCommandResult = {
        success,
        message: success ? `Successfully enabled plugin: ${pluginName}` : output,
      };
      if (!success) {
        result.error = output;
      }
      return result;
    } catch (error) {
      console.error('[ClaudeService] Failed to enable plugin:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to enable plugin: ${errorMessage}`,
      };
    }
  }

  /**
   * Disable a plugin via `claude plugin disable` command
   */
  async disablePlugin(
    pluginName: string,
    marketplaceName: string,
    projectPath?: string
  ): Promise<MCPCommandResult> {
    console.log('[ClaudeService] Disabling plugin:', { pluginName, marketplaceName, projectPath });

    try {
      // Construct the full plugin identifier and escape it as a single argument
      const pluginId = `${pluginName}@${marketplaceName}`;
      const command = `claude plugin disable ${this.escapeArg(pluginId)}`;
      const cwd = projectPath || undefined;

      console.log('[ClaudeService] Executing command:', command, { cwd });

      const { stdout, stderr } = await execAsync(command, { cwd, env: this.getExecEnv() });

      const output = stdout + stderr;
      const success =
        !stderr.toLowerCase().includes('error') && !output.toLowerCase().includes('failed');

      console.log('[ClaudeService] Plugin disable result:', { success, output });

      const result: MCPCommandResult = {
        success,
        message: success ? `Successfully disabled plugin: ${pluginName}` : output,
      };
      if (!success) {
        result.error = output;
      }
      return result;
    } catch (error) {
      console.error('[ClaudeService] Failed to disable plugin:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to disable plugin: ${errorMessage}`,
      };
    }
  }

  /**
   * Add a marketplace via `claude plugin marketplace add` command
   */
  async addPluginMarketplace(source: string): Promise<MCPCommandResult> {
    console.log('[ClaudeService] Adding plugin marketplace:', source);

    try {
      const command = `claude plugin marketplace add ${this.escapeArg(source)}`;

      console.log('[ClaudeService] Executing command:', command);

      const { stdout, stderr } = await execAsync(command, { env: this.getExecEnv() });

      const output = stdout + stderr;
      const success =
        !stderr.toLowerCase().includes('error') && !output.toLowerCase().includes('failed');

      console.log('[ClaudeService] Marketplace add result:', { success, output });

      const result: MCPCommandResult = {
        success,
        message: success ? `Successfully added marketplace: ${source}` : output,
      };
      if (!success) {
        result.error = output;
      }
      return result;
    } catch (error) {
      console.error('[ClaudeService] Failed to add marketplace:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to add marketplace: ${errorMessage}`,
      };
    }
  }

  /**
   * Remove a marketplace via `claude plugin marketplace remove` command
   */
  async removePluginMarketplace(name: string): Promise<MCPCommandResult> {
    console.log('[ClaudeService] Removing plugin marketplace:', name);

    try {
      const command = `claude plugin marketplace remove ${this.escapeArg(name)}`;

      console.log('[ClaudeService] Executing command:', command);

      const { stdout, stderr } = await execAsync(command, { env: this.getExecEnv() });

      const output = stdout + stderr;
      const success =
        !stderr.toLowerCase().includes('error') && !output.toLowerCase().includes('failed');

      console.log('[ClaudeService] Marketplace remove result:', { success, output });

      const result: MCPCommandResult = {
        success,
        message: success ? `Successfully removed marketplace: ${name}` : output,
      };
      if (!success) {
        result.error = output;
      }
      return result;
    } catch (error) {
      console.error('[ClaudeService] Failed to remove marketplace:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to remove marketplace: ${errorMessage}`,
      };
    }
  }

  // ========================================================================
  // MCP Authentication Methods
  // ========================================================================

  /**
   * Check authentication status for an MCP server
   * This runs `claude mcp get <serverName>` to check if the server is authenticated
   */
  async checkMCPAuthStatus(serverName: string): Promise<{
    authStatus: 'authenticated' | 'not_authenticated' | 'unknown' | 'not_required';
    isInstalled: boolean;
    configLocation?: string;
  }> {
    console.log('[ClaudeService] Checking MCP auth status for:', serverName);

    try {
      // First, check if the server is installed
      const servers = await this.listMCPServers();
      const installedServer = servers.find(s => s.name === serverName);

      if (!installedServer) {
        console.log('[ClaudeService] Server not installed:', serverName);
        return {
          authStatus: 'unknown',
          isInstalled: false,
        };
      }

      // For stdio servers, auth is not typically required
      if (installedServer.transport === 'stdio') {
        return {
          authStatus: 'not_required',
          isInstalled: true,
          configLocation: installedServer.projectPath
            ? path.join(installedServer.projectPath, '.claude.json')
            : path.join(os.homedir(), '.claude.json'),
        };
      }

      // For http/sse servers, check auth via /mcp command (non-interactive check)
      // We'll parse the output of `claude /mcp` to see if this server shows as authenticated
      const command = `claude /mcp --json`;
      console.log('[ClaudeService] Executing command:', command);

      try {
        const { stdout, stderr } = await execAsync(command, {
          env: this.getExecEnv(),
          timeout: 15000,
        });

        const output = stdout + stderr;

        // Parse the output to find auth status
        // The /mcp command shows server status including auth state
        if (output.includes(`"${serverName}"`) || output.includes(`'${serverName}'`)) {
          // Check for auth-related indicators
          if (
            output.toLowerCase().includes('not authenticated') ||
            output.toLowerCase().includes('auth: x') ||
            output.toLowerCase().includes('no token')
          ) {
            return {
              authStatus: 'not_authenticated',
              isInstalled: true,
              configLocation: installedServer.projectPath
                ? path.join(installedServer.projectPath, '.claude.json')
                : path.join(os.homedir(), '.claude.json'),
            };
          }

          if (
            output.toLowerCase().includes('authenticated') ||
            output.toLowerCase().includes('auth: ✓') ||
            output.toLowerCase().includes('connected')
          ) {
            return {
              authStatus: 'authenticated',
              isInstalled: true,
              configLocation: installedServer.projectPath
                ? path.join(installedServer.projectPath, '.claude.json')
                : path.join(os.homedir(), '.claude.json'),
            };
          }
        }

        // Couldn't determine status
        return {
          authStatus: 'unknown',
          isInstalled: true,
          configLocation: installedServer.projectPath
            ? path.join(installedServer.projectPath, '.claude.json')
            : path.join(os.homedir(), '.claude.json'),
        };
      } catch {
        // /mcp command might fail or require interaction
        // Fall back to unknown status
        return {
          authStatus: 'unknown',
          isInstalled: true,
          configLocation: installedServer.projectPath
            ? path.join(installedServer.projectPath, '.claude.json')
            : path.join(os.homedir(), '.claude.json'),
        };
      }
    } catch (error) {
      console.error('[ClaudeService] Failed to check MCP auth status:', error);
      return {
        authStatus: 'unknown',
        isInstalled: false,
      };
    }
  }

  /**
   * Launch Claude Code's /mcp command for OAuth authentication
   * This opens a new terminal window with `claude /mcp` where users can select their server and authenticate
   * Note: The server should already be added via addMCPServer before calling this
   */
  async launchOAuthFlow(
    serverName: string,
    projectPath?: string,
    _serverUrl?: string,
    _transport?: 'http' | 'sse'
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    console.log('[ClaudeService] Launching OAuth flow for:', serverName, {
      projectPath,
    });

    try {
      const env = this.getExecEnv();

      // Open the MCP manager where users can select the server and authenticate
      const mcpCommand = 'claude /mcp';

      console.log('[ClaudeService] Opening MCP manager:', mcpCommand);

      if (process.platform === 'darwin') {
        // macOS: Open Terminal.app with claude /mcp command
        const cdCommand = projectPath ? `cd "${projectPath}" && ` : '';
        const script = `
          tell application "Terminal"
            activate
            do script "${cdCommand}${mcpCommand}"
          end tell
        `;

        await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, { env });

        return {
          success: true,
          message: `Opened Claude Code MCP manager. Select "${serverName}" and choose "Authenticate" to complete setup.`,
        };
      } else if (process.platform === 'win32') {
        // Windows: Open cmd.exe with claude /mcp
        const cdCommand = projectPath ? `cd /d "${projectPath}" && ` : '';
        await execAsync(`start cmd /k "${cdCommand}${mcpCommand}"`, { env });

        return {
          success: true,
          message: `Opened Claude Code MCP manager. Select "${serverName}" and choose "Authenticate" to complete setup.`,
        };
      } else {
        // Linux: Try common terminals
        const cdCommand = projectPath ? `cd "${projectPath}" && ` : '';
        const terminals = ['gnome-terminal', 'konsole', 'xterm', 'x-terminal-emulator'];

        for (const terminal of terminals) {
          try {
            if (terminal === 'gnome-terminal') {
              await execAsync(
                `${terminal} -- bash -c '${cdCommand}${mcpCommand}; echo "Press Enter to close..."; read'`,
                { env }
              );
            } else if (terminal === 'konsole') {
              await execAsync(
                `${terminal} -e bash -c '${cdCommand}${mcpCommand}; echo "Press Enter to close..."; read'`,
                { env }
              );
            } else {
              await execAsync(`${terminal} -e bash -c '${cdCommand}${mcpCommand}'`, { env });
            }

            return {
              success: true,
              message: `Opened Claude Code MCP manager. Select "${serverName}" and choose "Authenticate" to complete setup.`,
            };
          } catch {
            // Try next terminal
            continue;
          }
        }

        return {
          success: false,
          error: `Could not open a terminal. Please run 'claude /mcp' manually and select "${serverName}" to authenticate.`,
        };
      }
    } catch (error) {
      console.error('[ClaudeService] Failed to launch OAuth flow:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to launch: ${errorMessage}`,
      };
    }
  }

  /**
   * Add an MCP server with API key authentication
   * Uses `claude mcp add-json` to properly configure headers for HTTP transport.
   *
   * Note: Claude Code CLI does NOT substitute ${ENV_VAR} in headers - it requires
   * the literal token value directly in the Authorization header.
   * See: https://github.com/github/github-mcp-server/issues/552
   */
  async addMCPServerWithApiKey(options: {
    name: string;
    url: string;
    transport: 'http' | 'sse';
    scope: MCPScope;
    projectPath?: string;
    envVarName: string;
    apiKeyValue: string;
    headerName?: string;
  }): Promise<MCPCommandResult> {
    console.log('[ClaudeService] Adding MCP server with API key (using add-json):', {
      name: options.name,
      scope: options.scope,
      headerName: options.headerName || 'Authorization',
    });

    // Validate project path if scope is 'project'
    if (options.scope === 'project' && !options.projectPath) {
      return {
        success: false,
        error: 'projectPath is required when scope is "project"',
      };
    }

    try {
      // Build the server config JSON for add-json command
      // Note: We must put the actual token in the header value - Claude Code
      // does NOT substitute ${ENV_VAR} patterns in headers
      const headerName = options.headerName || 'Authorization';
      const headerValue =
        headerName === 'Authorization'
          ? `Bearer ${options.apiKeyValue}`
          : options.apiKeyValue;

      const serverConfig = {
        type: options.transport,
        url: options.url,
        headers: {
          [headerName]: headerValue,
        },
      };

      // Build the add-json command
      const command = this.buildMCPAddJsonCommand({
        name: options.name,
        scope: options.scope,
        config: serverConfig,
      });

      const cwd =
        options.scope === 'project' && options.projectPath ? options.projectPath : undefined;

      console.log('[ClaudeService] Executing add-json command:', command, { cwd });

      const { stdout, stderr } = await execAsync(command, { cwd, env: this.getExecEnv() });

      // Parse output to determine success
      const output = stdout + stderr;
      const success =
        !stderr.toLowerCase().includes('error') && !output.toLowerCase().includes('failed');

      console.log('[ClaudeService] MCP add-json result:', { success, output });

      if (success) {
        return {
          success: true,
          message: `Successfully configured ${options.name} with API key authentication.`,
        };
      }

      return {
        success: false,
        error: output,
      };
    } catch (error) {
      console.error('[ClaudeService] Failed to add MCP server with API key:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to configure API key authentication: ${errorMessage}`,
      };
    }
  }

  /**
   * Build the `claude mcp add-json` command
   *
   * Command syntax: claude mcp add-json [options] <name> <json>
   *
   * This command properly handles headers for HTTP transport, unlike `claude mcp add --header`.
   */
  private buildMCPAddJsonCommand(options: {
    name: string;
    scope: MCPScope;
    config: {
      type: 'http' | 'sse';
      url: string;
      headers?: Record<string, string>;
      env?: Record<string, string>;
    };
  }): string {
    const parts: string[] = ['claude', 'mcp', 'add-json'];

    // Add scope option
    parts.push('--scope', options.scope);

    // Add server name
    parts.push(this.escapeArg(options.name));

    // Add JSON config - use single quotes to prevent shell variable expansion
    // The JSON contains ${ENV_VAR} patterns that must be preserved literally
    const jsonConfig = JSON.stringify(options.config);
    // Escape any single quotes in the JSON and wrap in single quotes
    const escapedJson = "'" + jsonConfig.replace(/'/g, "'\\''") + "'";
    parts.push(escapedJson);

    return parts.join(' ');
  }

}
