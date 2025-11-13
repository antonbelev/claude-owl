import { useState, useCallback } from 'react';
import type {
  PermissionRule,
  RuleTemplate,
  RuleValidationResult,
  RuleMatchResult,
  ToolType,
} from '@/shared/types';

export interface PermissionRulesState {
  templates: RuleTemplate[];
  loadingTemplates: boolean;
  error: string | null;
}

/**
 * Hook for managing permission rules
 * Provides methods for parsing, formatting, validating, testing, and working with templates
 */
export function usePermissionRules() {
  const [state, setState] = useState<PermissionRulesState>({
    templates: [],
    loadingTemplates: false,
    error: null,
  });

  /**
   * Parse a rule string into a structured PermissionRule object
   */
  const parseRule = useCallback(
    async (ruleString: string): Promise<Omit<PermissionRule, 'id' | 'level'> | null> => {
      if (!window.electronAPI) {
        return null;
      }

      try {
        const response = (await window.electronAPI.parseRule({ ruleString })) as {
          success: boolean;
          data?: PermissionRule;
          error?: string;
        };

        if (response.success && response.data) {
          const { id: _id, level: _level, ...rest } = response.data;
          return rest;
        }

        return null;
      } catch (error) {
        console.error('Failed to parse rule:', error);
        return null;
      }
    },
    []
  );

  /**
   * Format a PermissionRule object back to a string
   */
  const formatRule = useCallback(
    async (rule: Omit<PermissionRule, 'id'>): Promise<string | null> => {
      if (!window.electronAPI) {
        return null;
      }

      try {
        const response = (await window.electronAPI.formatRule({ rule })) as {
          success: boolean;
          data?: { ruleString: string };
          error?: string;
        };

        if (response.success && response.data) {
          return response.data.ruleString;
        }

        return null;
      } catch (error) {
        console.error('Failed to format rule:', error);
        return null;
      }
    },
    []
  );

  /**
   * Validate a permission rule
   */
  const validateRule = useCallback(
    async (rule: Omit<PermissionRule, 'id'>): Promise<RuleValidationResult | null> => {
      if (!window.electronAPI) {
        return null;
      }

      try {
        const response = (await window.electronAPI.validateRule({ rule })) as {
          success: boolean;
          data?: RuleValidationResult;
          error?: string;
        };

        if (response.success && response.data) {
          return response.data;
        }

        return null;
      } catch (error) {
        console.error('Failed to validate rule:', error);
        return null;
      }
    },
    []
  );

  /**
   * Validate a pattern for a specific tool
   */
  const validatePattern = useCallback(
    async (tool: ToolType, pattern: string): Promise<RuleValidationResult | null> => {
      if (!window.electronAPI) {
        return null;
      }

      try {
        const response = (await window.electronAPI.validatePattern({ tool, pattern })) as {
          success: boolean;
          data?: RuleValidationResult;
          error?: string;
        };

        if (response.success && response.data) {
          return response.data;
        }

        return null;
      } catch (error) {
        console.error('Failed to validate pattern:', error);
        return null;
      }
    },
    []
  );

  /**
   * Test a rule against an input string
   */
  const testRule = useCallback(
    async (
      rule: Omit<PermissionRule, 'id'>,
      testInput: string
    ): Promise<RuleMatchResult | null> => {
      if (!window.electronAPI) {
        return null;
      }

      try {
        const response = (await window.electronAPI.testRule({ rule, testInput })) as {
          success: boolean;
          data?: RuleMatchResult;
          error?: string;
        };

        if (response.success && response.data) {
          return response.data;
        }

        return null;
      } catch (error) {
        console.error('Failed to test rule:', error);
        return null;
      }
    },
    []
  );

  /**
   * Load all available rule templates
   */
  const loadTemplates = useCallback(async () => {
    setState(prev => ({ ...prev, loadingTemplates: true, error: null }));

    if (!window.electronAPI) {
      setState(prev => ({
        ...prev,
        loadingTemplates: false,
        error: 'Not running in Electron',
      }));
      return;
    }

    try {
      const response = (await window.electronAPI.getRuleTemplates()) as {
        success: boolean;
        data?: { templates: RuleTemplate[] };
        error?: string;
      };

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          templates: response.data!.templates,
          loadingTemplates: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          loadingTemplates: false,
          error: response.error ?? 'Failed to load templates',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loadingTemplates: false,
        error: error instanceof Error ? error.message : 'Failed to load templates',
      }));
    }
  }, []);

  /**
   * Apply a template and get the generated rules
   */
  const applyTemplate = useCallback(
    async (templateId: string): Promise<PermissionRule[] | null> => {
      if (!window.electronAPI) {
        return null;
      }

      try {
        const response = (await window.electronAPI.applyTemplate({ templateId })) as {
          success: boolean;
          data?: { rules: PermissionRule[] };
          error?: string;
        };

        if (response.success && response.data) {
          return response.data.rules;
        }

        return null;
      } catch (error) {
        console.error('Failed to apply template:', error);
        return null;
      }
    },
    []
  );

  return {
    ...state,
    parseRule,
    formatRule,
    validateRule,
    validatePattern,
    testRule,
    loadTemplates,
    applyTemplate,
  };
}
