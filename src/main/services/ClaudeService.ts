import { exec } from 'child_process';
import { promisify } from 'util';

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
}
