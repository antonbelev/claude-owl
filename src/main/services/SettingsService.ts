import { promises as fs } from 'fs';
import path from 'path';
import { homedir, platform } from 'os';
import type {
  ClaudeSettings,
  ConfigLevel,
  ConfigSource,
  EffectiveConfig,
  SettingsValidationError,
  SettingsValidationResult,
} from '@/shared/types';

/**
 * Service for managing Claude Code settings
 * Handles reading, writing, merging, and validating settings from all levels:
 * - User: ~/.claude/settings.json
 * - Project: {PROJECT}/.claude/settings.json
 * - Local: {PROJECT}/.claude/settings.local.json
 * - Managed: Platform-specific managed settings
 *
 * IMPORTANT: For project-level settings, you MUST provide an explicit projectPath.
 * Do NOT rely on process.cwd() as Claude Owl is a standalone app.
 */
export class SettingsService {
  private userSettingsPath: string;
  private projectPath: string | null;
  private managedSettingsPath: string;

  constructor(projectPath?: string) {
    // User-level settings (always available)
    this.userSettingsPath = path.join(homedir(), '.claude', 'settings.json');

    // Project path (null means user-level only)
    this.projectPath = projectPath || null;

    // Managed settings (platform-specific)
    this.managedSettingsPath = this.getManagedSettingsPath();

    console.log('[SettingsService] Initialized:', {
      userSettingsPath: this.userSettingsPath,
      projectPath: this.projectPath,
      managedSettingsPath: this.managedSettingsPath,
    });
  }

  /**
   * Get platform-specific managed settings path
   */
  private getManagedSettingsPath(): string {
    const platformType = platform();

    if (platformType === 'darwin') {
      // macOS
      return '/Library/Application Support/ClaudeCode/managed-settings.json';
    } else if (platformType === 'win32') {
      // Windows
      return 'C:\\ProgramData\\ClaudeCode\\managed-settings.json';
    } else {
      // Linux/WSL
      return '/etc/claude-code/managed-settings.json';
    }
  }

  /**
   * Get the path for a specific settings level
   * @throws Error if trying to access project/local level without projectPath
   */
  getSettingsPath(level: ConfigLevel): string {
    switch (level) {
      case 'user':
        return this.userSettingsPath;
      case 'project':
        if (!this.projectPath) {
          throw new Error(
            'Cannot access project-level settings without projectPath. ' +
              'Create a new SettingsService instance with projectPath parameter.'
          );
        }
        return path.join(this.projectPath, '.claude', 'settings.json');
      case 'local':
        if (!this.projectPath) {
          throw new Error(
            'Cannot access local settings without projectPath. ' +
              'Create a new SettingsService instance with projectPath parameter.'
          );
        }
        return path.join(this.projectPath, '.claude', 'settings.local.json');
      case 'managed':
        return this.managedSettingsPath;
      default:
        throw new Error(`Unknown config level: ${level}`);
    }
  }

  /**
   * Read settings from a specific level
   */
  async readSettings(level: ConfigLevel): Promise<ConfigSource> {
    const settingsPath = this.getSettingsPath(level);

    try {
      await fs.access(settingsPath);
      const content = await fs.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(content) as ClaudeSettings;

      return {
        level,
        path: settingsPath,
        exists: true,
        content: settings,
      };
    } catch (error) {
      // File doesn't exist or is invalid
      return {
        level,
        path: settingsPath,
        exists: false,
        content: {},
      };
    }
  }

  /**
   * Write settings to a specific level
   */
  async writeSettings(level: ConfigLevel, settings: ClaudeSettings): Promise<void> {
    // Cannot write to managed settings
    if (level === 'managed') {
      throw new Error('Cannot write to managed settings');
    }

    const settingsPath = this.getSettingsPath(level);
    const dirPath = path.dirname(settingsPath);

    // Create directory if it doesn't exist
    await fs.mkdir(dirPath, { recursive: true });

    // Write settings with pretty formatting
    const content = JSON.stringify(settings, null, 2);
    await fs.writeFile(settingsPath, content, 'utf-8');
  }

  /**
   * Get effective (merged) configuration from all sources
   * Hierarchy (lowest to highest priority):
   * 1. User settings
   * 2. Project settings
   * 3. Local settings
   * 4. Managed settings (highest priority, cannot be overridden)
   *
   * Note: If projectPath is not set, project and local settings will be skipped gracefully
   */
  async getEffectiveConfig(): Promise<EffectiveConfig> {
    // Helper to safely read settings, returning empty if projectPath is missing
    const safeReadSettings = async (level: ConfigLevel): Promise<ConfigSource> => {
      try {
        return await this.readSettings(level);
      } catch (error) {
        // If trying to access project/local without projectPath, return empty source
        if ((level === 'project' || level === 'local') && !this.projectPath) {
          const settingsPath = this.getSettingsPathWithoutValidation(level);
          return {
            level,
            path: settingsPath,
            exists: false,
            content: {},
          };
        }
        throw error;
      }
    };

    // Read all settings levels
    const [userSource, projectSource, localSource, managedSource] = await Promise.all([
      this.readSettings('user'),
      safeReadSettings('project'),
      safeReadSettings('local'),
      this.readSettings('managed'),
    ]);

    // Merge settings (later sources override earlier ones)
    const merged = this.mergeSettings([
      userSource.content,
      projectSource.content,
      localSource.content,
      managedSource.content,
    ]);

    return {
      merged,
      sources: [userSource, projectSource, localSource, managedSource],
    };
  }

  /**
   * Get settings path without validation (for returning paths when projectPath is missing)
   */
  private getSettingsPathWithoutValidation(level: ConfigLevel): string {
    switch (level) {
      case 'user':
        return this.userSettingsPath;
      case 'project':
        return this.projectPath ? path.join(this.projectPath, '.claude', 'settings.json') : '';
      case 'local':
        return this.projectPath
          ? path.join(this.projectPath, '.claude', 'settings.local.json')
          : '';
      case 'managed':
        return this.managedSettingsPath;
      default:
        return '';
    }
  }

  /**
   * Deep merge settings objects
   * Arrays are concatenated and deduplicated
   * Objects are recursively merged
   * Primitives from later sources override earlier ones
   */
  private mergeSettings(settingsArray: ClaudeSettings[]): ClaudeSettings {
    const result: ClaudeSettings = {};

    for (const settings of settingsArray) {
      for (const [key, value] of Object.entries(settings)) {
        if (value === undefined || value === null) {
          continue;
        }

        const existingValue = result[key];

        // Handle special cases
        if (this.isArrayKey(key)) {
          // Arrays: concatenate and deduplicate
          result[key] = this.mergeArrays(
            Array.isArray(existingValue) ? existingValue : [],
            Array.isArray(value) ? value : []
          );
        } else if (this.isObjectKey(key)) {
          // Objects: deep merge
          result[key] = this.mergeObjects(
            typeof existingValue === 'object' && existingValue !== null
              ? (existingValue as Record<string, unknown>)
              : {},
            typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
          );
        } else {
          // Primitives: override
          result[key] = value;
        }
      }
    }

    return result;
  }

  /**
   * Check if a key should be treated as an array
   */
  private isArrayKey(key: string): boolean {
    return [
      'allow',
      'deny',
      'ask',
      'additionalDirectories',
      'enabledMcpjsonServers',
      'disabledMcpjsonServers',
      'allowedMcpServers',
      'deniedMcpServers',
      'excludedCommands',
      'allowUnixSockets',
    ].includes(key);
  }

  /**
   * Check if a key should be treated as an object
   */
  private isObjectKey(key: string): boolean {
    return [
      'permissions',
      'sandbox',
      'network',
      'hooks',
      'env',
      'enabledPlugins',
      'statusLine',
    ].includes(key);
  }

  /**
   * Merge two arrays, removing duplicates
   */
  private mergeArrays<T>(arr1: T[], arr2: T[]): T[] {
    return Array.from(new Set([...arr1, ...arr2]));
  }

  /**
   * Deep merge two objects
   */
  private mergeObjects(
    obj1: Record<string, unknown>,
    obj2: Record<string, unknown>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = { ...obj1 };

    for (const [key, value] of Object.entries(obj2)) {
      if (value === undefined || value === null) {
        continue;
      }

      const existingValue = result[key];

      if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof existingValue === 'object' &&
        !Array.isArray(existingValue) &&
        existingValue !== null
      ) {
        // Recursive merge for nested objects
        result[key] = this.mergeObjects(
          existingValue as Record<string, unknown>,
          value as Record<string, unknown>
        );
      } else if (Array.isArray(value) && Array.isArray(existingValue)) {
        // Merge arrays
        result[key] = this.mergeArrays(existingValue, value);
      } else {
        // Override
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Validate settings for errors and warnings
   */
  validateSettings(settings: ClaudeSettings): SettingsValidationResult {
    const errors: SettingsValidationError[] = [];
    const warnings: SettingsValidationError[] = [];

    // Validate forceLoginMethod
    if (settings.forceLoginMethod && !['claudeai', 'console'].includes(settings.forceLoginMethod)) {
      errors.push({
        path: 'forceLoginMethod',
        message: 'Must be either "claudeai" or "console"',
        severity: 'error',
      });
    }

    // Validate cleanupPeriodDays
    if (settings.cleanupPeriodDays !== undefined) {
      if (typeof settings.cleanupPeriodDays !== 'number' || settings.cleanupPeriodDays < 0) {
        errors.push({
          path: 'cleanupPeriodDays',
          message: 'Must be a positive number',
          severity: 'error',
        });
      }
    }

    // Validate permissions
    if (settings.permissions) {
      const { allow, deny, ask, additionalDirectories } = settings.permissions;

      // Check for array types
      if (allow && !Array.isArray(allow)) {
        errors.push({
          path: 'permissions.allow',
          message: 'Must be an array of strings',
          severity: 'error',
        });
      }

      if (deny && !Array.isArray(deny)) {
        errors.push({
          path: 'permissions.deny',
          message: 'Must be an array of strings',
          severity: 'error',
        });
      }

      if (ask && !Array.isArray(ask)) {
        errors.push({
          path: 'permissions.ask',
          message: 'Must be an array of strings',
          severity: 'error',
        });
      }

      if (additionalDirectories && !Array.isArray(additionalDirectories)) {
        errors.push({
          path: 'permissions.additionalDirectories',
          message: 'Must be an array of strings',
          severity: 'error',
        });
      }

      // Warn about conflicting permissions
      if (allow && deny) {
        const denySet = new Set(deny);
        const conflicts = allow.filter(item => denySet.has(item));

        if (conflicts.length > 0) {
          warnings.push({
            path: 'permissions',
            message: `Conflicting allow/deny rules: ${conflicts.join(', ')}`,
            severity: 'warning',
          });
        }
      }
    }

    // Validate sandbox config
    if (settings.sandbox) {
      const { enabled, network } = settings.sandbox;

      if (enabled !== undefined && typeof enabled !== 'boolean') {
        errors.push({
          path: 'sandbox.enabled',
          message: 'Must be a boolean',
          severity: 'error',
        });
      }

      if (network) {
        if (network.httpProxyPort !== undefined) {
          if (
            typeof network.httpProxyPort !== 'number' ||
            network.httpProxyPort < 1 ||
            network.httpProxyPort > 65535
          ) {
            errors.push({
              path: 'sandbox.network.httpProxyPort',
              message: 'Must be a valid port number (1-65535)',
              severity: 'error',
            });
          }
        }

        if (network.socksProxyPort !== undefined) {
          if (
            typeof network.socksProxyPort !== 'number' ||
            network.socksProxyPort < 1 ||
            network.socksProxyPort > 65535
          ) {
            errors.push({
              path: 'sandbox.network.socksProxyPort',
              message: 'Must be a valid port number (1-65535)',
              severity: 'error',
            });
          }
        }
      }
    }

    // Validate environment variables
    if (settings.env) {
      if (typeof settings.env !== 'object' || Array.isArray(settings.env)) {
        errors.push({
          path: 'env',
          message: 'Must be an object with string values',
          severity: 'error',
        });
      } else {
        // Check for invalid environment variable names
        for (const [key, value] of Object.entries(settings.env)) {
          if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
            warnings.push({
              path: `env.${key}`,
              message:
                'Environment variable names should contain only letters, numbers, and underscores',
              severity: 'warning',
            });
          }

          if (typeof value !== 'string') {
            errors.push({
              path: `env.${key}`,
              message: 'Environment variable values must be strings',
              severity: 'error',
            });
          }
        }
      }
    }

    // Validate enabledPlugins
    if (settings.enabledPlugins) {
      if (typeof settings.enabledPlugins !== 'object' || Array.isArray(settings.enabledPlugins)) {
        errors.push({
          path: 'enabledPlugins',
          message: 'Must be an object with boolean values',
          severity: 'error',
        });
      } else {
        for (const [key, value] of Object.entries(settings.enabledPlugins)) {
          if (typeof value !== 'boolean') {
            errors.push({
              path: `enabledPlugins.${key}`,
              message: 'Plugin enabled status must be a boolean',
              severity: 'error',
            });
          }
        }
      }
    }

    // Validate extraKnownMarketplaces
    if (settings.extraKnownMarketplaces) {
      if (!Array.isArray(settings.extraKnownMarketplaces)) {
        errors.push({
          path: 'extraKnownMarketplaces',
          message: 'Must be an array of marketplace configurations',
          severity: 'error',
        });
      } else {
        settings.extraKnownMarketplaces.forEach((marketplace, index) => {
          if (!marketplace.name) {
            errors.push({
              path: `extraKnownMarketplaces[${index}].name`,
              message: 'Marketplace name is required',
              severity: 'error',
            });
          }

          if (!marketplace.type || !['github', 'git', 'directory'].includes(marketplace.type)) {
            errors.push({
              path: `extraKnownMarketplaces[${index}].type`,
              message: 'Marketplace type must be "github", "git", or "directory"',
              severity: 'error',
            });
          }

          if (marketplace.type === 'github' && !marketplace.repo) {
            errors.push({
              path: `extraKnownMarketplaces[${index}].repo`,
              message: 'GitHub marketplace requires a "repo" field',
              severity: 'error',
            });
          }

          if (marketplace.type === 'git' && !marketplace.url) {
            errors.push({
              path: `extraKnownMarketplaces[${index}].url`,
              message: 'Git marketplace requires a "url" field',
              severity: 'error',
            });
          }

          if (marketplace.type === 'directory' && !marketplace.path) {
            errors.push({
              path: `extraKnownMarketplaces[${index}].path`,
              message: 'Directory marketplace requires a "path" field',
              severity: 'error',
            });
          }
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if a settings file exists
   */
  async settingsFileExists(level: ConfigLevel): Promise<boolean> {
    const settingsPath = this.getSettingsPath(level);

    try {
      await fs.access(settingsPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create default settings file if it doesn't exist
   */
  async ensureSettingsFile(level: ConfigLevel): Promise<void> {
    const exists = await this.settingsFileExists(level);

    if (!exists && level !== 'managed') {
      // Create with empty object
      await this.writeSettings(level, {});
    }
  }

  /**
   * Delete a settings file
   */
  async deleteSettings(level: ConfigLevel): Promise<void> {
    if (level === 'managed') {
      throw new Error('Cannot delete managed settings');
    }

    const settingsPath = this.getSettingsPath(level);

    try {
      await fs.unlink(settingsPath);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Create a backup of settings file
   * Returns the path to the backup file
   */
  async createBackup(level: ConfigLevel): Promise<string> {
    const settingsPath = this.getSettingsPath(level);
    const exists = await this.settingsFileExists(level);

    if (!exists) {
      throw new Error(`Settings file does not exist at ${level} level`);
    }

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(path.dirname(settingsPath), '.backups');
    const backupFilename = `settings.${level}.${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFilename);

    console.log(`[SettingsService] Creating backup: ${backupPath}`);

    // Create backup directory if it doesn't exist
    await fs.mkdir(backupDir, { recursive: true });

    // Copy settings file to backup
    await fs.copyFile(settingsPath, backupPath);

    console.log(`[SettingsService] Backup created successfully`);
    return backupPath;
  }

  /**
   * Restore settings from a backup file
   */
  async restoreBackup(backupPath: string, level: ConfigLevel): Promise<void> {
    if (level === 'managed') {
      throw new Error('Cannot restore to managed settings');
    }

    console.log(`[SettingsService] Restoring from backup: ${backupPath}`);

    // Verify backup file exists
    try {
      await fs.access(backupPath);
    } catch {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    // Read and validate backup content
    const backupContent = await fs.readFile(backupPath, 'utf-8');
    const backupSettings = JSON.parse(backupContent) as ClaudeSettings;

    // Validate backup settings
    const validation = this.validateSettings(backupSettings);
    if (!validation.valid) {
      console.error(`[SettingsService] Backup validation failed:`, validation.errors);
      throw new Error(
        `Backup file contains invalid settings: ${validation.errors.map(e => e.message).join(', ')}`
      );
    }

    // Create a backup of current settings before restoring
    const currentExists = await this.settingsFileExists(level);
    if (currentExists) {
      await this.createBackup(level);
      console.log(`[SettingsService] Created backup of current settings before restore`);
    }

    // Restore from backup
    await this.writeSettings(level, backupSettings);
    console.log(`[SettingsService] Settings restored successfully from backup`);
  }

  /**
   * List all available backups for a level
   */
  async listBackups(level: ConfigLevel): Promise<string[]> {
    const settingsPath = this.getSettingsPath(level);
    const backupDir = path.join(path.dirname(settingsPath), '.backups');

    try {
      const files = await fs.readdir(backupDir);
      const backupFiles = files
        .filter(file => file.startsWith(`settings.${level}.`) && file.endsWith('.json'))
        .map(file => path.join(backupDir, file))
        .sort()
        .reverse(); // Most recent first

      return backupFiles;
    } catch (error) {
      // Backup directory doesn't exist
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}
