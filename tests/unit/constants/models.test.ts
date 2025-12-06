/**
 * Unit tests for model alias constants and utilities
 */

import { describe, it, expect } from 'vitest';
import {
  MODEL_ALIASES,
  MODEL_OPTIONS,
  AGENT_MODEL_OPTIONS,
  COMMAND_MODEL_OPTIONS,
  isValidModelAlias,
  isValidAgentModelAlias,
  getModelDisplayInfo,
  getModelLabel,
  type ModelAlias,
  type AgentModelAlias,
  type CommandModelAlias,
} from '@/shared/constants/models';

describe('Model Constants', () => {
  describe('MODEL_ALIASES', () => {
    it('should contain all official Claude Code model aliases', () => {
      expect(MODEL_ALIASES.DEFAULT).toBe('default');
      expect(MODEL_ALIASES.SONNET).toBe('sonnet');
      expect(MODEL_ALIASES.OPUS).toBe('opus');
      expect(MODEL_ALIASES.HAIKU).toBe('haiku');
      expect(MODEL_ALIASES.SONNET_EXTENDED).toBe('sonnet[1m]');
      expect(MODEL_ALIASES.OPUS_PLAN).toBe('opusplan');
    });

    it('should have exactly 6 model aliases', () => {
      expect(Object.keys(MODEL_ALIASES)).toHaveLength(6);
    });
  });

  describe('MODEL_OPTIONS', () => {
    it('should contain all model aliases with display info', () => {
      const aliases = MODEL_OPTIONS.map(m => m.alias);

      expect(aliases).toContain('default');
      expect(aliases).toContain('sonnet');
      expect(aliases).toContain('opus');
      expect(aliases).toContain('haiku');
      expect(aliases).toContain('sonnet[1m]');
      expect(aliases).toContain('opusplan');
    });

    it('should have labels and descriptions for all options', () => {
      MODEL_OPTIONS.forEach(option => {
        expect(option.alias).toBeTruthy();
        expect(option.label).toBeTruthy();
        expect(option.description).toBeTruthy();
      });
    });

    it('should mark default as recommended', () => {
      const defaultOption = MODEL_OPTIONS.find(m => m.alias === 'default');
      expect(defaultOption?.recommended).toBe(true);
    });
  });

  describe('AGENT_MODEL_OPTIONS', () => {
    it('should include inherit option for agents', () => {
      const aliases = AGENT_MODEL_OPTIONS.map(m => m.alias);
      expect(aliases).toContain('inherit');
    });

    it('should include all base model options', () => {
      const aliases = AGENT_MODEL_OPTIONS.map(m => m.alias);

      expect(aliases).toContain('default');
      expect(aliases).toContain('sonnet');
      expect(aliases).toContain('opus');
      expect(aliases).toContain('haiku');
    });
  });

  describe('COMMAND_MODEL_OPTIONS', () => {
    it('should only include basic model aliases for commands', () => {
      const aliases = COMMAND_MODEL_OPTIONS.map(m => m.alias);

      expect(aliases).toContain('default');
      expect(aliases).toContain('sonnet');
      expect(aliases).toContain('opus');
      expect(aliases).toContain('haiku');
    });

    it('should not include extended options for commands', () => {
      const aliases = COMMAND_MODEL_OPTIONS.map(m => m.alias);

      expect(aliases).not.toContain('sonnet[1m]');
      expect(aliases).not.toContain('opusplan');
      expect(aliases).not.toContain('inherit');
    });

    it('should have exactly 4 command model options', () => {
      expect(COMMAND_MODEL_OPTIONS).toHaveLength(4);
    });
  });
});

describe('Model Utilities', () => {
  describe('isValidModelAlias', () => {
    it('should return true for valid model aliases', () => {
      expect(isValidModelAlias('default')).toBe(true);
      expect(isValidModelAlias('sonnet')).toBe(true);
      expect(isValidModelAlias('opus')).toBe(true);
      expect(isValidModelAlias('haiku')).toBe(true);
      expect(isValidModelAlias('sonnet[1m]')).toBe(true);
      expect(isValidModelAlias('opusplan')).toBe(true);
    });

    it('should return false for invalid aliases', () => {
      expect(isValidModelAlias('invalid')).toBe(false);
      expect(isValidModelAlias('claude-sonnet-4-5')).toBe(false);
      expect(isValidModelAlias('')).toBe(false);
      expect(isValidModelAlias('inherit')).toBe(false); // inherit is agent-only
    });
  });

  describe('isValidAgentModelAlias', () => {
    it('should return true for model aliases including inherit', () => {
      expect(isValidAgentModelAlias('default')).toBe(true);
      expect(isValidAgentModelAlias('sonnet')).toBe(true);
      expect(isValidAgentModelAlias('opus')).toBe(true);
      expect(isValidAgentModelAlias('haiku')).toBe(true);
      expect(isValidAgentModelAlias('inherit')).toBe(true);
    });

    it('should return false for invalid aliases', () => {
      expect(isValidAgentModelAlias('invalid')).toBe(false);
      expect(isValidAgentModelAlias('')).toBe(false);
    });
  });

  describe('getModelDisplayInfo', () => {
    it('should return display info for valid aliases', () => {
      const info = getModelDisplayInfo('sonnet');

      expect(info).toBeDefined();
      expect(info?.alias).toBe('sonnet');
      expect(info?.label).toBe('Sonnet');
      expect(info?.description).toBeTruthy();
    });

    it('should return undefined for invalid aliases', () => {
      expect(getModelDisplayInfo('invalid')).toBeUndefined();
      expect(getModelDisplayInfo('')).toBeUndefined();
    });
  });

  describe('getModelLabel', () => {
    it('should return the label for valid aliases', () => {
      expect(getModelLabel('default')).toBe('Default');
      expect(getModelLabel('sonnet')).toBe('Sonnet');
      expect(getModelLabel('opus')).toBe('Opus');
      expect(getModelLabel('haiku')).toBe('Haiku');
      expect(getModelLabel('sonnet[1m]')).toBe('Sonnet (Extended)');
      expect(getModelLabel('opusplan')).toBe('Opus Plan');
    });

    it('should return the alias itself for unknown aliases', () => {
      expect(getModelLabel('unknown')).toBe('unknown');
      expect(getModelLabel('custom-model')).toBe('custom-model');
    });
  });
});

describe('Type Safety', () => {
  it('should correctly type ModelAlias', () => {
    const validAliases: ModelAlias[] = [
      'default',
      'sonnet',
      'opus',
      'haiku',
      'sonnet[1m]',
      'opusplan',
    ];

    expect(validAliases).toHaveLength(6);
  });

  it('should correctly type AgentModelAlias', () => {
    const validAgentAliases: AgentModelAlias[] = [
      'default',
      'sonnet',
      'opus',
      'haiku',
      'sonnet[1m]',
      'opusplan',
      'inherit',
    ];

    expect(validAgentAliases).toHaveLength(7);
  });

  it('should correctly type CommandModelAlias', () => {
    const validCommandAliases: CommandModelAlias[] = [
      'default',
      'sonnet',
      'opus',
      'haiku',
    ];

    expect(validCommandAliases).toHaveLength(4);
  });
});
