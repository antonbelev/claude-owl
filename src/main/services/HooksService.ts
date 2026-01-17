/**
 * HooksService - Read, validate, and manage Claude Code hooks
 *
 * Manages hooks from user and project settings.json files.
 * Supports full CRUD operations for hooks.
 *
 * @see docs/hooks-implementation-plan.md
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type {
  HooksSettings,
  HookEventSummary,
  HookWithMetadata,
  HookTemplate,
  SecurityScore,
  HookEvent,
  Hook,
  HookConfiguration,
} from '../../shared/types/hook.types';
import type { HookDefinition } from '../../shared/types/ipc.hooks.types';
import { HooksValidator } from './HooksValidator';
import { getHookTemplates } from './hookTemplates';
import { getAllHookEventsInfo } from './hookEventInfo';

export class HooksService {
  private validator: HooksValidator;

  constructor() {
    this.validator = new HooksValidator();
    console.log('[HooksService] Service initialized');
  }

  /**
   * Get hooks from user settings (~/.claude/settings.json)
   */
  async getUserHooks(): Promise<HooksSettings> {
    console.log('[HooksService] Reading user hooks');

    const userClaudeDir = path.join(os.homedir(), '.claude');
    const settingsPath = path.join(userClaudeDir, 'settings.json');

    try {
      const content = await fs.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(content);

      console.log('[HooksService] User hooks loaded:', {
        hasHooks: !!settings.hooks,
        events: settings.hooks ? Object.keys(settings.hooks) : [],
      });

      return { hooks: settings.hooks || {} };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('[HooksService] User settings.json not found');
        return { hooks: {} };
      }

      console.error('[HooksService] Failed to read user hooks:', error);
      throw error;
    }
  }

  /**
   * Get hooks from project settings (.claude/settings.json in current directory)
   */
  async getProjectHooks(projectPath: string): Promise<HooksSettings> {
    console.log('[HooksService] Reading project hooks from:', projectPath);

    const settingsPath = path.join(projectPath, '.claude', 'settings.json');

    try {
      const content = await fs.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(content);

      console.log('[HooksService] Project hooks loaded:', {
        hasHooks: !!settings.hooks,
        events: settings.hooks ? Object.keys(settings.hooks) : [],
      });

      return { hooks: settings.hooks || {} };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('[HooksService] Project settings.json not found');
        return { hooks: {} };
      }

      console.error('[HooksService] Failed to read project hooks:', error);
      throw error;
    }
  }

  /**
   * Get all hooks (user + project) with metadata and validation
   */
  async getAllHooksWithMetadata(projectPath?: string): Promise<HookEventSummary[]> {
    console.log('[HooksService] Getting all hooks with metadata');

    // Get hooks from both sources
    const userHooks = await this.getUserHooks();
    const projectHooks = projectPath ? await this.getProjectHooks(projectPath) : { hooks: {} };

    // Get all event info
    const allEvents = getAllHookEventsInfo();

    // Build summaries for each event
    const summaries: HookEventSummary[] = allEvents.map(eventInfo => {
      const event = eventInfo.event;
      const hooks: HookWithMetadata[] = [];

      // Process user hooks for this event
      const userConfigs = userHooks.hooks?.[event] || [];
      userConfigs.forEach((config, configIndex) => {
        config.hooks.forEach((hook, hookIndex) => {
          const validation = this.validator.validateHook(hook);
          hooks.push({
            event,
            configIndex,
            hookIndex,
            configuration: config,
            hook,
            validation,
            location: 'user',
          });
        });
      });

      // Process project hooks for this event
      const projectConfigs = projectHooks.hooks?.[event] || [];
      projectConfigs.forEach((config, configIndex) => {
        config.hooks.forEach((hook, hookIndex) => {
          const validation = this.validator.validateHook(hook);
          hooks.push({
            event,
            configIndex,
            hookIndex,
            configuration: config,
            hook,
            validation,
            location: 'project',
          });
        });
      });

      // Calculate summary metrics
      const hasIssues = hooks.some(h => h.validation.issues.length > 0);
      const worstScore = this.calculateWorstScore(hooks.map(h => h.validation.score));

      return {
        event,
        info: eventInfo,
        count: hooks.length,
        hooks,
        hasIssues,
        worstScore,
      };
    });

    console.log('[HooksService] Hooks metadata built:', {
      totalEvents: summaries.length,
      eventsWithHooks: summaries.filter(s => s.count > 0).length,
      totalHooks: summaries.reduce((sum, s) => sum + s.count, 0),
    });

    return summaries;
  }

  /**
   * Get hook templates
   */
  getTemplates(): HookTemplate[] {
    console.log('[HooksService] Getting hook templates');
    return getHookTemplates();
  }

  /**
   * Check if settings.json file exists
   */
  async checkSettingsExists(location: 'user' | 'project', projectPath?: string): Promise<boolean> {
    try {
      const settingsPath =
        location === 'user'
          ? path.join(os.homedir(), '.claude', 'settings.json')
          : path.join(projectPath || '', '.claude', 'settings.json');

      await fs.access(settingsPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get path to settings.json file for external editor
   */
  getSettingsPath(location: 'user' | 'project', projectPath?: string): string {
    if (location === 'user') {
      return path.join(os.homedir(), '.claude', 'settings.json');
    }
    return path.join(projectPath || '', '.claude', 'settings.json');
  }

  /**
   * Calculate the worst security score from a list
   */
  private calculateWorstScore(scores: SecurityScore[]): SecurityScore {
    if (scores.includes('red')) return 'red';
    if (scores.includes('yellow')) return 'yellow';
    return 'green';
  }

  /**
   * Create a new hook
   */
  async createHook(
    hookDef: HookDefinition,
    scope: 'user' | 'project',
    projectPath?: string
  ): Promise<{ success: boolean; hookId?: string; error?: string }> {
    console.log('[HooksService] Creating hook:', { event: hookDef.event, scope, projectPath });

    try {
      // Validate required fields
      if (!hookDef.event) {
        return { success: false, error: 'Event type is required' };
      }
      if (!hookDef.type) {
        return { success: false, error: 'Hook type is required' };
      }
      if (hookDef.type === 'command' && !hookDef.command) {
        return { success: false, error: 'Command is required for command hooks' };
      }
      if (hookDef.type === 'prompt' && !hookDef.prompt) {
        return { success: false, error: 'Prompt is required for prompt hooks' };
      }
      if (scope === 'project' && !projectPath) {
        return { success: false, error: 'Project path is required for project scope' };
      }

      // Get settings path
      const settingsPath = this.getSettingsPath(scope, projectPath);

      // Read existing settings or create empty object
      let settings: Record<string, unknown> = {};
      try {
        const content = await fs.readFile(settingsPath, 'utf-8');
        settings = JSON.parse(content);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
        // File doesn't exist, create directory and use empty settings
        const dir = path.dirname(settingsPath);
        await fs.mkdir(dir, { recursive: true });
      }

      // Initialize hooks structure if needed
      if (!settings.hooks) {
        settings.hooks = {};
      }
      const hooks = settings.hooks as Record<string, HookConfiguration[]>;

      // Initialize event array if needed
      const event = hookDef.event as HookEvent;
      if (!hooks[event]) {
        hooks[event] = [];
      }

      // Create the hook configuration
      const hookConfig: Hook = {
        type: hookDef.type,
      };
      if (hookDef.command) {
        hookConfig.command = hookDef.command;
      }
      if (hookDef.prompt) {
        hookConfig.prompt = hookDef.prompt;
      }
      if (hookDef.timeout) {
        hookConfig.timeout = hookDef.timeout;
      }

      // Find or create configuration with matching matcher
      const matcherValue = hookDef.matcher || '';
      const eventConfigs = hooks[event]!; // We just initialized this above
      let configIndex = eventConfigs.findIndex(c => (c.matcher || '') === matcherValue);

      let hookIndex: number;

      if (configIndex === -1) {
        // Create new configuration
        const newConfig: HookConfiguration = {
          hooks: [hookConfig],
        };
        if (hookDef.matcher) {
          newConfig.matcher = hookDef.matcher;
        }
        eventConfigs.push(newConfig);
        configIndex = eventConfigs.length - 1;
        hookIndex = 0;
      } else {
        // Add to existing configuration
        const config = eventConfigs[configIndex];
        if (!config) {
          return { success: false, error: 'Configuration not found' };
        }
        config.hooks.push(hookConfig);
        hookIndex = config.hooks.length - 1;
      }

      // Write settings back
      await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');

      const hookId = `${event}:${configIndex}:${hookIndex}`;
      console.log('[HooksService] Hook created successfully:', hookId);

      return { success: true, hookId };
    } catch (error) {
      console.error('[HooksService] Failed to create hook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create hook',
      };
    }
  }

  /**
   * Update an existing hook
   */
  async updateHook(
    hookId: string,
    updates: Partial<HookDefinition>,
    scope: 'user' | 'project',
    projectPath?: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log('[HooksService] Updating hook:', { hookId, scope, projectPath });

    try {
      if (scope === 'project' && !projectPath) {
        return { success: false, error: 'Project path is required for project scope' };
      }

      // Parse hook ID (event:configIndex:hookIndex)
      const parts = hookId.split(':');
      const event = parts[0];
      const configIndexStr = parts[1];
      const hookIndexStr = parts[2];

      if (!event || !configIndexStr || !hookIndexStr) {
        return { success: false, error: 'Invalid hook ID format' };
      }

      const configIndex = parseInt(configIndexStr, 10);
      const hookIndex = parseInt(hookIndexStr, 10);

      if (isNaN(configIndex) || isNaN(hookIndex)) {
        return { success: false, error: 'Invalid hook ID format' };
      }

      // Get settings path
      const settingsPath = this.getSettingsPath(scope, projectPath);

      // Read existing settings
      let settings: Record<string, unknown>;
      try {
        const content = await fs.readFile(settingsPath, 'utf-8');
        settings = JSON.parse(content);
      } catch (error) {
        return { success: false, error: 'Settings file not found' };
      }

      // Navigate to the hook
      const hooks = settings.hooks as Record<string, HookConfiguration[]> | undefined;
      if (!hooks?.[event]?.[configIndex]?.hooks?.[hookIndex]) {
        return { success: false, error: 'Hook not found' };
      }

      const hook = hooks[event][configIndex].hooks[hookIndex];
      const config = hooks[event][configIndex];

      // Apply updates
      if (updates.type !== undefined) {
        hook.type = updates.type;
      }
      if (updates.command !== undefined) {
        if (updates.command) {
          hook.command = updates.command;
        } else {
          delete hook.command;
        }
      }
      if (updates.prompt !== undefined) {
        if (updates.prompt) {
          hook.prompt = updates.prompt;
        } else {
          delete hook.prompt;
        }
      }
      if (updates.timeout !== undefined) {
        if (updates.timeout) {
          hook.timeout = updates.timeout;
        } else {
          delete hook.timeout;
        }
      }
      if (updates.matcher !== undefined) {
        if (updates.matcher) {
          config.matcher = updates.matcher;
        } else {
          delete config.matcher;
        }
      }

      // Validate the updated hook
      if (hook.type === 'command' && !hook.command) {
        return { success: false, error: 'Command is required for command hooks' };
      }
      if (hook.type === 'prompt' && !hook.prompt) {
        return { success: false, error: 'Prompt is required for prompt hooks' };
      }

      // Write settings back
      await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');

      console.log('[HooksService] Hook updated successfully:', hookId);

      return { success: true };
    } catch (error) {
      console.error('[HooksService] Failed to update hook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update hook',
      };
    }
  }

  /**
   * Delete a hook
   */
  async deleteHook(
    hookId: string,
    scope: 'user' | 'project',
    projectPath?: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log('[HooksService] Deleting hook:', { hookId, scope, projectPath });

    try {
      if (scope === 'project' && !projectPath) {
        return { success: false, error: 'Project path is required for project scope' };
      }

      // Parse hook ID (event:configIndex:hookIndex)
      const parts = hookId.split(':');
      const event = parts[0];
      const configIndexStr = parts[1];
      const hookIndexStr = parts[2];

      if (!event || !configIndexStr || !hookIndexStr) {
        return { success: false, error: 'Invalid hook ID format' };
      }

      const configIndex = parseInt(configIndexStr, 10);
      const hookIndex = parseInt(hookIndexStr, 10);

      if (isNaN(configIndex) || isNaN(hookIndex)) {
        return { success: false, error: 'Invalid hook ID format' };
      }

      // Get settings path
      const settingsPath = this.getSettingsPath(scope, projectPath);

      // Read existing settings
      let settings: Record<string, unknown>;
      try {
        const content = await fs.readFile(settingsPath, 'utf-8');
        settings = JSON.parse(content);
      } catch (error) {
        return { success: false, error: 'Settings file not found' };
      }

      // Navigate to the hook
      const hooks = settings.hooks as Record<string, HookConfiguration[]> | undefined;
      if (!hooks?.[event]?.[configIndex]?.hooks?.[hookIndex]) {
        return { success: false, error: 'Hook not found' };
      }

      // Remove the hook
      hooks[event][configIndex].hooks.splice(hookIndex, 1);

      // If configuration has no more hooks, remove it
      if (hooks[event][configIndex].hooks.length === 0) {
        hooks[event].splice(configIndex, 1);
      }

      // If event has no more configurations, remove it
      if (hooks[event].length === 0) {
        delete hooks[event];
      }

      // If no hooks left, remove hooks key
      if (Object.keys(hooks).length === 0) {
        delete settings.hooks;
      }

      // Write settings back
      await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');

      console.log('[HooksService] Hook deleted successfully:', hookId);

      return { success: true };
    } catch (error) {
      console.error('[HooksService] Failed to delete hook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete hook',
      };
    }
  }
}
