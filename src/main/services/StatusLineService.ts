import { promises as fs } from 'fs';
import path from 'path';
import { homedir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import type {
  StatusLineConfig,
  StatusLineTemplate,
  StatusLinePreviewResult,
  SecurityScanResult,
  SecurityIssue,
} from '@/shared/types/statusline.types';
import { SettingsService } from './SettingsService';
import {
  BUILT_IN_TEMPLATES,
  getTemplateById,
  generateMockSessionData,
} from './statusLineTemplates';

const execAsync = promisify(exec);

/**
 * Service for managing Claude Code status lines
 *
 * Status lines are terminal footers that display contextual session information.
 * This service manages templates, custom scripts, and settings.json integration.
 *
 * IMPORTANT: Status lines are user-level settings only. We write to ~/.claude/settings.json
 * and create script files in ~/.claude/
 */
export class StatusLineService {
  private userClaudeDir: string;
  private settingsService: SettingsService;

  constructor() {
    this.userClaudeDir = path.join(homedir(), '.claude');
    this.settingsService = new SettingsService();

    console.log('[StatusLineService] Initialized:', {
      userClaudeDir: this.userClaudeDir,
    });
  }

  /**
   * Get the execution environment with proper PATH for macOS
   * This is needed because packaged Electron apps don't inherit the user's PATH
   */
  private getExecEnv() {
    const env = { ...process.env };

    // On macOS, add common binary paths that might not be in Electron's PATH
    if (process.platform === 'darwin') {
      const paths = [env.PATH || '', '/usr/local/bin', '/opt/homebrew/bin', '/usr/bin', '/bin'];
      env.PATH = paths.filter(p => p).join(':');
    }

    return env;
  }

  /**
   * Get active status line configuration from settings.json
   */
  async getActiveConfig(): Promise<StatusLineConfig | null> {
    console.log('[StatusLineService] Getting active config');

    try {
      const configSource = await this.settingsService.readSettings('user');

      if (!configSource.exists || !configSource.content) {
        console.log('[StatusLineService] No settings file found');
        return null;
      }

      const statusLine = configSource.content.statusLine;

      if (!statusLine) {
        console.log('[StatusLineService] No statusLine config found');
        return null;
      }

      return statusLine as StatusLineConfig;
    } catch (error) {
      console.error('[StatusLineService] Failed to get active config:', error);
      throw error;
    }
  }

  /**
   * List all available templates
   */
  async listTemplates(): Promise<StatusLineTemplate[]> {
    console.log('[StatusLineService] Listing templates');
    return BUILT_IN_TEMPLATES;
  }

  /**
   * Set status line from a template
   */
  async setTemplate(templateId: string): Promise<{ scriptPath: string; scriptContent: string }> {
    console.log('[StatusLineService] Setting template:', templateId);

    // Get template
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Ensure .claude directory exists
    await fs.mkdir(this.userClaudeDir, { recursive: true });

    // Write script file
    const scriptPath = path.join(this.userClaudeDir, `statusline-${templateId}.sh`);
    await fs.writeFile(scriptPath, template.script, { mode: 0o755 });

    // Ensure executable permissions (extra safety)
    await fs.chmod(scriptPath, 0o755);

    console.log('[StatusLineService] Wrote executable script to:', scriptPath);

    // Update settings.json
    await this.updateSettings({
      type: 'command',
      command: scriptPath,
      padding: 0,
    });

    return { scriptPath, scriptContent: template.script };
  }

  /**
   * Set custom status line script
   */
  async setCustomScript(
    scriptContent: string,
    language?: 'bash' | 'python' | 'node'
  ): Promise<{ scriptPath: string }> {
    console.log('[StatusLineService] Setting custom script:', { language });

    // Scan for security issues
    const scanResult = await this.scanScript(scriptContent);
    if (!scanResult.passed && scanResult.issues.some(i => i.severity === 'high')) {
      throw new Error(
        'Script contains high-severity security issues. Please review and fix: ' +
          scanResult.issues
            .filter(i => i.severity === 'high')
            .map(i => i.message)
            .join(', ')
      );
    }

    // Ensure .claude directory exists
    await fs.mkdir(this.userClaudeDir, { recursive: true });

    // Determine file extension
    const ext = language === 'python' ? 'py' : language === 'node' ? 'js' : 'sh';

    // Write script file
    const scriptPath = path.join(this.userClaudeDir, `statusline-custom.${ext}`);
    await fs.writeFile(scriptPath, scriptContent, { mode: 0o755 });

    // Ensure executable permissions (extra safety)
    await fs.chmod(scriptPath, 0o755);

    console.log('[StatusLineService] Wrote executable custom script to:', scriptPath);

    // Update settings.json
    await this.updateSettings({
      type: 'command',
      command: scriptPath,
      padding: 0,
    });

    return { scriptPath };
  }

  /**
   * Preview a status line with mock data
   */
  async previewStatusLine(
    templateId?: string,
    scriptContent?: string
  ): Promise<StatusLinePreviewResult> {
    console.log('[StatusLineService] Previewing status line:', {
      templateId,
      hasCustomScript: !!scriptContent,
    });

    const startTime = Date.now();

    try {
      let script: string;

      if (templateId) {
        // Preview a template
        const template = getTemplateById(templateId);
        if (!template) {
          throw new Error(`Template not found: ${templateId}`);
        }
        script = template.script;
      } else if (scriptContent) {
        // Preview custom script
        script = scriptContent;
      } else {
        throw new Error('Must provide either templateId or scriptContent');
      }

      // Generate mock session data
      const mockData = generateMockSessionData();

      // Create temporary script file
      const tmpScriptPath = path.join(this.userClaudeDir, `statusline-preview-${Date.now()}.sh`);
      await fs.mkdir(this.userClaudeDir, { recursive: true });
      await fs.writeFile(tmpScriptPath, script, { mode: 0o755 });

      try {
        // Execute script with mock data via stdin
        const mockDataJson = JSON.stringify(mockData, null, 2);
        const command = `echo '${mockDataJson.replace(/'/g, "'\\''")}' | ${tmpScriptPath}`;

        const { stdout, stderr } = await execAsync(command, {
          timeout: 2000,
          shell: '/bin/bash',
          env: this.getExecEnv(),
        });

        if (stderr) {
          console.warn('[StatusLineService] Script stderr:', stderr);
        }

        const executionTime = Date.now() - startTime;
        const output = stdout.trim();

        // Strip ANSI codes for plain output
        const plainOutput = output.replace(
          // eslint-disable-next-line no-control-regex
          /\x1b\[[0-9;]*m/g,
          ''
        );

        return {
          success: true,
          output,
          plainOutput,
          executionTime,
        };
      } finally {
        // Clean up temporary script
        await fs.unlink(tmpScriptPath).catch(() => {
          /* ignore */
        });
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('[StatusLineService] Preview failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      };
    }
  }

  /**
   * Disable status line
   */
  async disable(): Promise<void> {
    console.log('[StatusLineService] Disabling status line');

    // Read current settings
    const configSource = await this.settingsService.readSettings('user');
    const settings = configSource.content || {};

    // Remove statusLine property
    delete settings.statusLine;

    // Write back to settings.json
    await this.settingsService.writeSettings('user', settings);

    console.log('[StatusLineService] Status line disabled');
  }

  /**
   * Scan script for security issues
   */
  async scanScript(scriptContent: string): Promise<SecurityScanResult> {
    console.log('[StatusLineService] Scanning script for security issues');

    const issues: SecurityIssue[] = [];

    // Define security patterns
    const patterns: Array<{
      regex: RegExp;
      severity: 'low' | 'medium' | 'high';
      message: string;
      suggestion?: string;
    }> = [
      {
        regex: /\$\{?AWS_ACCESS_KEY_ID\}?|\$\{?AWS_SECRET_ACCESS_KEY\}?/g,
        severity: 'high',
        message: 'References AWS credentials',
        suggestion: 'Remove AWS credential references',
      },
      {
        regex: /\$\{?ANTHROPIC_API_KEY\}?|\$\{?API_KEY\}?/g,
        severity: 'high',
        message: 'References API keys',
        suggestion: 'Remove API key references',
      },
      {
        regex: /\$\{?[A-Z_]*PASSWORD[A-Z_]*\}?/gi,
        severity: 'high',
        message: 'References password variables',
        suggestion: 'Remove password references',
      },
      {
        regex: /\$\{?[A-Z_]*TOKEN[A-Z_]*\}?/gi,
        severity: 'medium',
        message: 'References token variables',
        suggestion: 'Verify token is not sensitive',
      },
      {
        regex: /\$\{?[A-Z_]*SECRET[A-Z_]*\}?/gi,
        severity: 'medium',
        message: 'References secret variables',
        suggestion: 'Verify secret is not sensitive',
      },
      {
        regex: /curl |wget |fetch /g,
        severity: 'medium',
        message: 'Makes network requests',
        suggestion: 'Status lines should not make network calls',
      },
      {
        regex: /rm -rf|rm\s+-[rf]{2}/g,
        severity: 'high',
        message: 'Destructive file system operation detected',
        suggestion: 'Remove destructive commands',
      },
    ];

    // Scan for each pattern
    const lines = scriptContent.split('\n');
    for (const pattern of patterns) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        const matches = line.match(pattern.regex);
        if (matches) {
          const issue: SecurityIssue = {
            line: i + 1,
            severity: pattern.severity,
            message: pattern.message,
          };
          if (pattern.suggestion) {
            issue.suggestion = pattern.suggestion;
          }
          issues.push(issue);
        }
      }
    }

    // Determine overall risk level
    const hasHigh = issues.some(i => i.severity === 'high');
    const hasMedium = issues.some(i => i.severity === 'medium');
    const riskLevel = hasHigh ? 'high' : hasMedium ? 'medium' : 'low';

    return {
      passed: !hasHigh,
      issues,
      riskLevel,
    };
  }

  /**
   * Export template to standalone script file
   */
  async exportScript(templateId: string, targetPath?: string): Promise<{ exportPath: string }> {
    console.log('[StatusLineService] Exporting script:', { templateId, targetPath });

    // Get template
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Determine export path
    const exportPath =
      targetPath || path.join(homedir(), 'Downloads', `statusline-${templateId}.sh`);

    // Write script
    await fs.writeFile(exportPath, template.script, { mode: 0o755 });

    console.log('[StatusLineService] Exported script to:', exportPath);

    return { exportPath };
  }

  /**
   * Update settings.json with new statusLine configuration
   */
  private async updateSettings(config: StatusLineConfig): Promise<void> {
    console.log('[StatusLineService] Updating settings.json:', config);

    // Read current settings
    const configSource = await this.settingsService.readSettings('user');
    const settings = configSource.content || {};

    // Update statusLine
    settings.statusLine = config;

    // Write back to settings.json
    await this.settingsService.writeSettings('user', settings);

    console.log('[StatusLineService] Settings updated successfully');
  }
}
