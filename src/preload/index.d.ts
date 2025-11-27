/**
 * Type definitions for Electron API exposed to renderer process
 */

export interface ElectronAPI {
  // System
  getAppVersion: () => Promise<unknown>;
  getClaudeVersion: () => Promise<unknown>;
  checkClaudeInstalled: () => Promise<unknown>;
  openExternal: (url: string) => Promise<unknown>;

  // Settings
  getSettings: (args: unknown) => Promise<unknown>;
  saveSettings: (args: unknown) => Promise<unknown>;
  validateSettings: (args: unknown) => Promise<unknown>;
  getEffectiveSettings: () => Promise<unknown>;
  settingsFileExists: (args: unknown) => Promise<unknown>;
  ensureSettingsFile: (args: unknown) => Promise<unknown>;
  deleteSettings: (args: unknown) => Promise<unknown>;

  // Configuration (legacy)
  getConfig: (args: unknown) => Promise<unknown>;
  saveConfig: (args: unknown) => Promise<unknown>;
  validateConfig: (args: unknown) => Promise<unknown>;
  getEffectiveConfig: () => Promise<unknown>;

  // Agents
  listAgents: () => Promise<unknown>;
  getAgent: (args: unknown) => Promise<unknown>;
  saveAgent: (args: unknown) => Promise<unknown>;
  deleteAgent: (args: unknown) => Promise<unknown>;

  // Skills
  listSkills: () => Promise<unknown>;
  getSkill: (args: unknown) => Promise<unknown>;
  saveSkill: (args: unknown) => Promise<unknown>;
  deleteSkill: (args: unknown) => Promise<unknown>;

  // Commands
  listCommands: () => Promise<unknown>;
  getCommand: (args: unknown) => Promise<unknown>;
  saveCommand: (args: unknown) => Promise<unknown>;
  deleteCommand: (args: unknown) => Promise<unknown>;

  // Plugins
  getMarketplaces: () => Promise<unknown>;
  addMarketplace: (args: unknown) => Promise<unknown>;
  removeMarketplace: (args: unknown) => Promise<unknown>;
  getAvailablePlugins: () => Promise<unknown>;
  getInstalledPlugins: () => Promise<unknown>;
  installPlugin: (args: unknown) => Promise<unknown>;
  uninstallPlugin: (args: unknown) => Promise<unknown>;
  togglePlugin: (args: unknown) => Promise<unknown>;
  getGitHubRepoInfo: (args: unknown) => Promise<unknown>;
  getPluginHealth: (args: unknown) => Promise<unknown>;

  // CCUsage (deprecated - replaced by Metrics)
  checkCCUsageInstalled: () => Promise<unknown>;
  getCCUsageVersion: () => Promise<unknown>;
  getUsageReport: () => Promise<unknown>;
  getCCUsageRawOutput: () => Promise<unknown>;

  // Metrics
  computeMetrics: (request?: import('../shared/types').ComputeMetricsRequest) => Promise<import('../shared/types').ComputeMetricsResponse>;

  // Hooks
  getAllHooks: (args: unknown) => Promise<unknown>;
  getHookTemplates: () => Promise<unknown>;
  getHookSettingsPath: (args: unknown) => Promise<unknown>;
  openHookSettingsFile: (args: unknown) => Promise<unknown>;

  // Claude CLI
  executeCLI: (args: unknown) => Promise<unknown>;
  stopCLI: (args: unknown) => Promise<unknown>;

  // File System
  readFile: (args: unknown) => Promise<unknown>;
  writeFile: (args: unknown) => Promise<unknown>;
  listDirectory: (args: unknown) => Promise<unknown>;

  // Event listeners
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  off: (channel: string, callback: (...args: unknown[]) => void) => void;
  once: (channel: string, callback: (...args: unknown[]) => void) => void;
}
