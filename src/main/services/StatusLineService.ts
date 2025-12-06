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
  getTemplatesForPlatform,
  generateMockSessionData,
} from './statusLineTemplates';
import {
  getPlatform,
  isWindows,
  getExecEnvForPlatform,
  buildScriptExecutionCommand,
} from '@/shared/utils/platform.utils';

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
   * Get the execution environment with proper PATH for the current platform
   * This is needed because packaged Electron apps don't inherit the user's PATH
   */
  private getExecEnv() {
    return getExecEnvForPlatform();
  }

  /**
   * Detect script language from content
   * Supports: Node.js, Python, Bash, and Windows Batch
   */
  private detectScriptLanguage(script: string): 'bash' | 'node' | 'python' | 'batch' {
    // Check for Node.js shebang or JavaScript comments
    if (script.includes('#!/usr/bin/env node') || script.startsWith('// ')) {
      return 'node';
    }
    // Check for Python shebang
    if (script.includes('#!/usr/bin/env python') || script.includes('#!/usr/bin/python')) {
      return 'python';
    }
    // Check for Windows batch syntax
    if (script.includes('@echo off') || script.includes('@echo on') || script.startsWith('REM ')) {
      return 'batch';
    }
    // Default to bash
    return 'bash';
  }

  /**
   * Get file extension for script based on language
   * IMPORTANT: Language determines extension, NOT platform
   * - Node.js → .js (all platforms)
   * - Python → .py (all platforms)
   * - Bash → .sh (Unix only)
   * - Batch → .bat (Windows only)
   */
  private getScriptExtensionForLanguage(language: 'bash' | 'node' | 'python' | 'batch'): string {
    switch (language) {
      case 'node':
        return 'js';
      case 'python':
        return 'py';
      case 'batch':
        return 'bat';
      case 'bash':
      default:
        return 'sh';
    }
  }

  /**
   * Build the full command to execute a script
   * On Windows, we need to prefix with the interpreter (e.g., "node script.js")
   * On Unix, scripts with shebang can be executed directly
   *
   * @param scriptPath - Full path to the script file
   * @param language - Script language (bash, node, python, batch)
   * @returns Full command string to execute the script
   */
  private buildExecutionCommand(
    scriptPath: string,
    language: 'bash' | 'node' | 'python' | 'batch'
  ): string {
    if (isWindows()) {
      // Windows: Need explicit interpreter for non-.bat files
      switch (language) {
        case 'node':
          return `node "${scriptPath}"`;
        case 'python':
          return `python "${scriptPath}"`;
        case 'batch':
          return scriptPath; // Batch files can execute directly
        case 'bash':
        default:
          return scriptPath; // Should not happen on Windows (filtered out)
      }
    } else {
      // Unix: Scripts with shebang can execute directly
      return scriptPath;
    }
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
   * List available templates for the current platform
   * Automatically filters out templates that are incompatible with the user's OS
   */
  async listTemplates(): Promise<StatusLineTemplate[]> {
    const platform = getPlatform();
    const compatibleTemplates = getTemplatesForPlatform(platform);

    console.log('[StatusLineService] Listing templates for platform:', {
      platform,
      totalTemplates: BUILT_IN_TEMPLATES.length,
      compatibleTemplates: compatibleTemplates.length,
      filtered: BUILT_IN_TEMPLATES.length - compatibleTemplates.length,
    });

    return compatibleTemplates;
  }

  /**
   * Set status line from a template
   */
  async setTemplate(templateId: string): Promise<{ scriptPath: string; scriptContent: string }> {
    console.log('[StatusLineService] Setting template:', { templateId, platform: getPlatform() });

    // Get template
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Check platform compatibility
    const platform = getPlatform();
    const platformKey = platform === 'windows' ? 'windows' : 'unix';

    if (template.platforms && !template.platforms.includes(platformKey)) {
      throw new Error(
        `Template "${template.name}" is not available for ${platform}. ` +
          `Supported platforms: ${template.platforms.join(', ')}`
      );
    }

    // Ensure .claude directory exists
    await fs.mkdir(this.userClaudeDir, { recursive: true });

    // Detect script language and get appropriate extension
    const language = this.detectScriptLanguage(template.script);
    const ext = this.getScriptExtensionForLanguage(language);
    const scriptPath = path.join(this.userClaudeDir, `statusline-${templateId}.${ext}`);

    // Write script file with platform-specific permissions
    await fs.writeFile(scriptPath, template.script, { mode: 0o755 });

    // Ensure executable permissions on Unix-like systems
    if (!isWindows()) {
      await fs.chmod(scriptPath, 0o755);
    }

    console.log('[StatusLineService] Wrote script to:', { scriptPath, platform, language });

    // Build full execution command (with interpreter prefix on Windows)
    const command = this.buildExecutionCommand(scriptPath, language);

    console.log('[StatusLineService] Full command for settings.json:', { command });

    // Update settings.json
    await this.updateSettings({
      type: 'command',
      command,
      padding: 0,
    });

    return { scriptPath, scriptContent: template.script };
  }

  /**
   * Set custom status line script
   */
  async setCustomScript(
    scriptContent: string,
    language?: 'bash' | 'python' | 'node' | 'batch'
  ): Promise<{ scriptPath: string }> {
    console.log('[StatusLineService] Setting custom script:', {
      language,
      platform: getPlatform(),
    });

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

    // Detect or use provided language
    const detectedLanguage = language || this.detectScriptLanguage(scriptContent);
    const ext = this.getScriptExtensionForLanguage(detectedLanguage);

    // Write script file
    const scriptPath = path.join(this.userClaudeDir, `statusline-custom.${ext}`);
    await fs.writeFile(scriptPath, scriptContent, { mode: 0o755 });

    // Ensure executable permissions on Unix-like systems
    if (!isWindows()) {
      await fs.chmod(scriptPath, 0o755);
    }

    console.log('[StatusLineService] Wrote custom script to:', {
      scriptPath,
      platform: getPlatform(),
      language: detectedLanguage,
    });

    // Build full execution command (with interpreter prefix on Windows)
    const command = this.buildExecutionCommand(scriptPath, detectedLanguage);

    console.log('[StatusLineService] Full command for settings.json:', { command });

    // Update settings.json
    await this.updateSettings({
      type: 'command',
      command,
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
    const platform = getPlatform();
    console.log('[StatusLineService] Previewing status line:', {
      templateId,
      hasCustomScript: !!scriptContent,
      platform,
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

        // Validate platform compatibility
        const platformKey = platform === 'windows' ? 'windows' : 'unix';
        if (!template.platforms?.includes(platformKey)) {
          const supportedPlatforms = template.platforms?.join(' or ') || 'unknown';
          throw new Error(
            `Template "${template.name}" is not compatible with ${platform}. ` +
              `Supported platforms: ${supportedPlatforms}. ` +
              `Please select a cross-platform template (Node.js-based).`
          );
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
      const mockDataJson = JSON.stringify(mockData, null, 2);

      // Create temporary script file with platform-appropriate extension
      // Detect language to use correct extension
      const language = this.detectScriptLanguage(script);
      const ext = this.getScriptExtensionForLanguage(language);
      const tmpScriptPath = path.join(
        this.userClaudeDir,
        `statusline-preview-${Date.now()}.${ext}`
      );
      await fs.mkdir(this.userClaudeDir, { recursive: true });
      await fs.writeFile(tmpScriptPath, script, { mode: 0o755 });

      // Build command using temp file approach (avoids shell escaping issues)
      const { command, tempFile } = buildScriptExecutionCommand(
        tmpScriptPath,
        this.userClaudeDir,
        platform
      );

      // Write JSON to the temporary input file that the command expects
      await fs.writeFile(tempFile, mockDataJson, 'utf8');

      console.log('[StatusLineService] Created temp input file:', tempFile);
      console.log('[StatusLineService] Executing preview command:', command);

      try {
        const { stdout, stderr } = await execAsync(command, {
          timeout: 2000,
          shell: isWindows() ? 'cmd.exe' : '/bin/bash',
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
        // Clean up temporary files
        await fs.unlink(tmpScriptPath).catch(() => {
          /* ignore */
        });
        await fs.unlink(tempFile).catch(() => {
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
