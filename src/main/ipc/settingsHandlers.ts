import { ipcMain } from 'electron';
import type {
  GetSettingsRequest,
  GetSettingsResponse,
  SaveSettingsRequest,
  SaveSettingsResponse,
  ValidateSettingsRequest,
  ValidateSettingsResponse,
  GetEffectiveSettingsResponse,
  SettingsFileExistsRequest,
  SettingsFileExistsResponse,
  EnsureSettingsFileRequest,
  EnsureSettingsFileResponse,
  DeleteSettingsRequest,
  DeleteSettingsResponse,
  CreateBackupRequest,
  CreateBackupResponse,
  RestoreBackupRequest,
  RestoreBackupResponse,
  ParseRuleRequest,
  ParseRuleResponse,
  FormatRuleRequest,
  FormatRuleResponse,
  ValidateRuleRequest,
  ValidateRuleResponse,
  ValidatePatternRequest,
  ValidatePatternResponse,
  TestRuleRequest,
  TestRuleResponse,
  GetRuleTemplatesResponse,
  ApplyTemplateRequest,
  ApplyTemplateResponse,
} from '@/shared/types';
import { SettingsService } from '../services/SettingsService';
import { PermissionRulesService } from '../services/PermissionRulesService';

const settingsService = new SettingsService();
const permissionRulesService = new PermissionRulesService();

// Define channel strings directly to avoid tree-shaking issues with IPC_CHANNELS object
const CHANNELS = {
  GET_SETTINGS: 'settings:get',
  SAVE_SETTINGS: 'settings:save',
  VALIDATE_SETTINGS: 'settings:validate',
  GET_EFFECTIVE_SETTINGS: 'settings:get-effective',
  SETTINGS_FILE_EXISTS: 'settings:file-exists',
  ENSURE_SETTINGS_FILE: 'settings:ensure-file',
  DELETE_SETTINGS: 'settings:delete',
  CREATE_BACKUP: 'settings:create-backup',
  RESTORE_BACKUP: 'settings:restore-backup',
  PARSE_RULE: 'settings:parse-rule',
  FORMAT_RULE: 'settings:format-rule',
  VALIDATE_RULE: 'settings:validate-rule',
  VALIDATE_PATTERN: 'settings:validate-pattern',
  TEST_RULE: 'settings:test-rule',
  GET_RULE_TEMPLATES: 'settings:get-rule-templates',
  APPLY_TEMPLATE: 'settings:apply-template',
} as const;

export function registerSettingsHandlers() {
  // Get settings from a specific level
  ipcMain.handle(
    CHANNELS.GET_SETTINGS,
    async (_event, request: GetSettingsRequest): Promise<GetSettingsResponse> => {
      try {
        const configSource = await settingsService.readSettings(request.level);

        return {
          success: true,
          data: configSource,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Save settings to a specific level
  ipcMain.handle(
    CHANNELS.SAVE_SETTINGS,
    async (_event, request: SaveSettingsRequest): Promise<SaveSettingsResponse> => {
      try {
        await settingsService.writeSettings(request.level, request.settings);

        return {
          success: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Validate settings
  ipcMain.handle(
    CHANNELS.VALIDATE_SETTINGS,
    async (_event, request: ValidateSettingsRequest): Promise<ValidateSettingsResponse> => {
      try {
        const validationResult = settingsService.validateSettings(request.settings);

        return {
          success: true,
          data: validationResult,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get effective (merged) settings
  ipcMain.handle(
    CHANNELS.GET_EFFECTIVE_SETTINGS,
    async (): Promise<GetEffectiveSettingsResponse> => {
      try {
        const effectiveConfig = await settingsService.getEffectiveConfig();

        return {
          success: true,
          data: effectiveConfig,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Check if settings file exists
  ipcMain.handle(
    CHANNELS.SETTINGS_FILE_EXISTS,
    async (_event, request: SettingsFileExistsRequest): Promise<SettingsFileExistsResponse> => {
      try {
        const exists = await settingsService.settingsFileExists(request.level);

        return {
          success: true,
          data: { exists },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Ensure settings file exists
  ipcMain.handle(
    CHANNELS.ENSURE_SETTINGS_FILE,
    async (_event, request: EnsureSettingsFileRequest): Promise<EnsureSettingsFileResponse> => {
      try {
        await settingsService.ensureSettingsFile(request.level);

        return {
          success: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Delete settings file
  ipcMain.handle(
    CHANNELS.DELETE_SETTINGS,
    async (_event, request: DeleteSettingsRequest): Promise<DeleteSettingsResponse> => {
      try {
        await settingsService.deleteSettings(request.level);

        return {
          success: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Create backup of settings file
  ipcMain.handle(
    CHANNELS.CREATE_BACKUP,
    async (_event, request: CreateBackupRequest): Promise<CreateBackupResponse> => {
      console.log('[SettingsHandlers] Create backup request:', request);

      try {
        const backupPath = await settingsService.createBackup(request.level);

        console.log('[SettingsHandlers] Backup created:', backupPath);
        return {
          success: true,
          data: { backupPath },
        };
      } catch (error) {
        console.error('[SettingsHandlers] Backup creation failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Restore settings from backup
  ipcMain.handle(
    CHANNELS.RESTORE_BACKUP,
    async (_event, request: RestoreBackupRequest): Promise<RestoreBackupResponse> => {
      console.log('[SettingsHandlers] Restore backup request:', request);

      try {
        await settingsService.restoreBackup(request.backupPath, request.level);

        console.log('[SettingsHandlers] Backup restored successfully');
        return {
          success: true,
        };
      } catch (error) {
        console.error('[SettingsHandlers] Backup restore failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Parse rule string
  ipcMain.handle(
    CHANNELS.PARSE_RULE,
    async (_event, request: ParseRuleRequest): Promise<ParseRuleResponse> => {
      console.log('[SettingsHandlers] Parse rule request:', request);

      try {
        const parsedRule = permissionRulesService.parseRuleString(request.ruleString);

        return {
          success: true,
          data: { id: '', level: 'allow', ...parsedRule },
        };
      } catch (error) {
        console.error('[SettingsHandlers] Rule parsing failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Format rule to string
  ipcMain.handle(
    CHANNELS.FORMAT_RULE,
    async (_event, request: FormatRuleRequest): Promise<FormatRuleResponse> => {
      console.log('[SettingsHandlers] Format rule request:', request);

      try {
        const ruleString = permissionRulesService.formatRuleString(request.rule);

        return {
          success: true,
          data: { ruleString },
        };
      } catch (error) {
        console.error('[SettingsHandlers] Rule formatting failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Validate rule
  ipcMain.handle(
    CHANNELS.VALIDATE_RULE,
    async (_event, request: ValidateRuleRequest): Promise<ValidateRuleResponse> => {
      console.log('[SettingsHandlers] Validate rule request:', request);

      try {
        const validation = permissionRulesService.validateRule(request.rule);

        return {
          success: true,
          data: validation,
        };
      } catch (error) {
        console.error('[SettingsHandlers] Rule validation failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Validate pattern
  ipcMain.handle(
    CHANNELS.VALIDATE_PATTERN,
    async (_event, request: ValidatePatternRequest): Promise<ValidatePatternResponse> => {
      console.log('[SettingsHandlers] Validate pattern request:', request);

      try {
        const validation = permissionRulesService.validatePattern(request.tool, request.pattern);

        return {
          success: true,
          data: validation,
        };
      } catch (error) {
        console.error('[SettingsHandlers] Pattern validation failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Test rule
  ipcMain.handle(
    CHANNELS.TEST_RULE,
    async (_event, request: TestRuleRequest): Promise<TestRuleResponse> => {
      console.log('[SettingsHandlers] Test rule request:', request);

      try {
        const result = permissionRulesService.testRule(request.rule, request.testInput);

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error('[SettingsHandlers] Rule testing failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get rule templates
  ipcMain.handle(CHANNELS.GET_RULE_TEMPLATES, async (): Promise<GetRuleTemplatesResponse> => {
    console.log('[SettingsHandlers] Get rule templates request');

    try {
      const templates = permissionRulesService.getTemplates();

      return {
        success: true,
        data: { templates },
      };
    } catch (error) {
      console.error('[SettingsHandlers] Get templates failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Apply template
  ipcMain.handle(
    CHANNELS.APPLY_TEMPLATE,
    async (_event, request: ApplyTemplateRequest): Promise<ApplyTemplateResponse> => {
      console.log('[SettingsHandlers] Apply template request:', request);

      try {
        const rules = permissionRulesService.applyTemplate(request.templateId);

        console.log('[SettingsHandlers] Template applied, generated rules:', rules.length);
        return {
          success: true,
          data: { rules },
        };
      } catch (error) {
        console.error('[SettingsHandlers] Apply template failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
}
