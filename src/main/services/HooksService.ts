/**
 * HooksService - Read and validate Claude Code hooks
 *
 * Manages hooks from user and project settings.json files.
 * Phase 1: Read-only access with validation
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
} from '../../shared/types/hook.types';
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
}
