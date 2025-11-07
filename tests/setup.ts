import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.electronAPI for tests
global.window.electronAPI = {
  getAppVersion: async () => '0.1.0',
  getClaudeVersion: async () => '1.0.0',
  checkClaudeInstalled: async () => ({ success: true, installed: true, version: '1.0.0' }),
  getConfig: async () => ({ success: true, data: {} }),
  saveConfig: async () => ({ success: true }),
  validateConfig: async () => ({ success: true }),
  getEffectiveConfig: async () => ({ success: true, data: { merged: {}, sources: [] } }),
  listAgents: async () => ({ success: true, data: [] }),
  getAgent: async () => ({ success: true, data: null }),
  saveAgent: async () => ({ success: true }),
  deleteAgent: async () => ({ success: true }),
  listSkills: async () => ({ success: true, data: [] }),
  getSkill: async () => ({ success: true, data: null }),
  saveSkill: async () => ({ success: true }),
  deleteSkill: async () => ({ success: true }),
  listCommands: async () => ({ success: true, data: [] }),
  getCommand: async () => ({ success: true, data: null }),
  saveCommand: async () => ({ success: true }),
  deleteCommand: async () => ({ success: true }),
  executeCLI: async () => ({ success: true, stdout: '', stderr: '', exitCode: 0 }),
  stopCLI: async () => ({ success: true }),
  readFile: async () => ({ success: true, data: '' }),
  writeFile: async () => ({ success: true }),
  listDirectory: async () => ({ success: true, data: [] }),
  onCLIOutput: () => () => {},
  onFileChanged: () => () => {},
};
