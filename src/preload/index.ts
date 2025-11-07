import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@/shared/types';

// Define settings channel strings directly to avoid tree-shaking
const SETTINGS_CHANNELS = {
  GET_SETTINGS: 'settings:get',
  SAVE_SETTINGS: 'settings:save',
  VALIDATE_SETTINGS: 'settings:validate',
  GET_EFFECTIVE_SETTINGS: 'settings:get-effective',
  SETTINGS_FILE_EXISTS: 'settings:file-exists',
  ENSURE_SETTINGS_FILE: 'settings:ensure-file',
  DELETE_SETTINGS: 'settings:delete',
} as const;

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // System
  getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.GET_APP_VERSION),
  getClaudeVersion: () => ipcRenderer.invoke(IPC_CHANNELS.GET_CLAUDE_VERSION),
  checkClaudeInstalled: () => ipcRenderer.invoke(IPC_CHANNELS.CHECK_CLAUDE_INSTALLED),
  openExternal: (url: string) => ipcRenderer.invoke('system:open-external', url),

  // Settings
  getSettings: (args: unknown) => ipcRenderer.invoke(SETTINGS_CHANNELS.GET_SETTINGS, args),
  saveSettings: (args: unknown) => ipcRenderer.invoke(SETTINGS_CHANNELS.SAVE_SETTINGS, args),
  validateSettings: (args: unknown) => ipcRenderer.invoke(SETTINGS_CHANNELS.VALIDATE_SETTINGS, args),
  getEffectiveSettings: () => ipcRenderer.invoke(SETTINGS_CHANNELS.GET_EFFECTIVE_SETTINGS),
  settingsFileExists: (args: unknown) => ipcRenderer.invoke(SETTINGS_CHANNELS.SETTINGS_FILE_EXISTS, args),
  ensureSettingsFile: (args: unknown) => ipcRenderer.invoke(SETTINGS_CHANNELS.ENSURE_SETTINGS_FILE, args),
  deleteSettings: (args: unknown) => ipcRenderer.invoke(SETTINGS_CHANNELS.DELETE_SETTINGS, args),

  // Configuration (legacy)
  getConfig: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.GET_CONFIG, args),
  saveConfig: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_CONFIG, args),
  validateConfig: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.VALIDATE_CONFIG, args),
  getEffectiveConfig: () => ipcRenderer.invoke(IPC_CHANNELS.GET_EFFECTIVE_CONFIG),

  // Agents
  listAgents: () => ipcRenderer.invoke(IPC_CHANNELS.LIST_AGENTS),
  getAgent: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.GET_AGENT, args),
  saveAgent: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_AGENT, args),
  deleteAgent: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_AGENT, args),

  // Skills
  listSkills: () => ipcRenderer.invoke(IPC_CHANNELS.LIST_SKILLS),
  getSkill: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.GET_SKILL, args),
  saveSkill: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_SKILL, args),
  deleteSkill: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_SKILL, args),

  // Commands
  listCommands: () => ipcRenderer.invoke(IPC_CHANNELS.LIST_COMMANDS),
  getCommand: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.GET_COMMAND, args),
  saveCommand: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_COMMAND, args),
  deleteCommand: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_COMMAND, args),

  // Claude CLI
  executeCLI: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.EXECUTE_CLI, args),
  stopCLI: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.STOP_CLI, args),

  // File System
  readFile: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.READ_FILE, args),
  writeFile: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.WRITE_FILE, args),
  listDirectory: (args: unknown) => ipcRenderer.invoke(IPC_CHANNELS.LIST_DIRECTORY, args),

  // Event listeners
  onCLIOutput: (callback: (event: unknown, data: unknown) => void) => {
    ipcRenderer.on('cli:output', callback);
    return () => ipcRenderer.removeListener('cli:output', callback);
  },
  onFileChanged: (callback: (event: unknown, data: unknown) => void) => {
    ipcRenderer.on('file:changed', callback);
    return () => ipcRenderer.removeListener('file:changed', callback);
  },
});

// Type definitions for the exposed API
export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getClaudeVersion: () => Promise<string | null>;
  checkClaudeInstalled: () => Promise<unknown>;
  openExternal: (url: string) => Promise<unknown>;
  getSettings: (args: unknown) => Promise<unknown>;
  saveSettings: (args: unknown) => Promise<unknown>;
  validateSettings: (args: unknown) => Promise<unknown>;
  getEffectiveSettings: () => Promise<unknown>;
  settingsFileExists: (args: unknown) => Promise<unknown>;
  ensureSettingsFile: (args: unknown) => Promise<unknown>;
  deleteSettings: (args: unknown) => Promise<unknown>;
  getConfig: (args: unknown) => Promise<unknown>;
  saveConfig: (args: unknown) => Promise<unknown>;
  validateConfig: (args: unknown) => Promise<unknown>;
  getEffectiveConfig: () => Promise<unknown>;
  listAgents: () => Promise<unknown>;
  getAgent: (args: unknown) => Promise<unknown>;
  saveAgent: (args: unknown) => Promise<unknown>;
  deleteAgent: (args: unknown) => Promise<unknown>;
  listSkills: () => Promise<unknown>;
  getSkill: (args: unknown) => Promise<unknown>;
  saveSkill: (args: unknown) => Promise<unknown>;
  deleteSkill: (args: unknown) => Promise<unknown>;
  listCommands: () => Promise<unknown>;
  getCommand: (args: unknown) => Promise<unknown>;
  saveCommand: (args: unknown) => Promise<unknown>;
  deleteCommand: (args: unknown) => Promise<unknown>;
  executeCLI: (args: unknown) => Promise<unknown>;
  stopCLI: (args: unknown) => Promise<unknown>;
  readFile: (args: unknown) => Promise<unknown>;
  writeFile: (args: unknown) => Promise<unknown>;
  listDirectory: (args: unknown) => Promise<unknown>;
  onCLIOutput: (callback: (event: unknown, data: unknown) => void) => () => void;
  onFileChanged: (callback: (event: unknown) => void) => () => void;
}
