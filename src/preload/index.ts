import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@/shared/types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // System
  getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.GET_APP_VERSION),
  getClaudeVersion: () => ipcRenderer.invoke(IPC_CHANNELS.GET_CLAUDE_VERSION),
  checkClaudeInstalled: () => ipcRenderer.invoke(IPC_CHANNELS.CHECK_CLAUDE_INSTALLED),

  // Configuration
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
  onFileChanged: (callback: (event: unknown, data: unknown) => void) => () => void;
}
