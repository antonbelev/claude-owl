/**
 * IPC (Inter-Process Communication) type definitions
 *
 * This file re-exports all IPC types from domain-specific type files
 * for backward compatibility. New code should import from specific domain files.
 *
 * Domain files:
 * - ipc.common.types - Common types and channels
 * - ipc.settings.types - Settings and configuration
 * - ipc.agents.types - Agents and commands
 * - ipc.skills.types - Skills
 * - ipc.plugins.types - Plugins and marketplaces
 * - ipc.hooks.types - Hooks
 * - ipc.mcp.types - MCP server management
 * - ipc.projects.types - Project discovery
 * - ipc.system.types - System, CLI, and CCUsage
 * - ipc.status.types - Service status and debug logs
 */

// Re-export common types and channels
export {
  IPC_CHANNELS,
  type IPCResponse,
  type CLIOutputEvent,
  type FileChangedEvent,
  type ValidationErrorEvent,
} from './ipc.common.types';

// Re-export settings types
export type {
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
  GetConfigRequest,
  GetConfigResponse,
  SaveConfigRequest,
  SaveConfigResponse,
  GetEffectiveConfigResponse,
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
} from './ipc.settings.types';

// Re-export agent types
export type {
  ListAgentsResponse,
  GetAgentRequest,
  GetAgentResponse,
  SaveAgentRequest,
  SaveAgentResponse,
  DeleteAgentRequest,
  DeleteAgentResponse,
  ListCommandsResponse,
  GetCommandRequest,
  GetCommandResponse,
  SaveCommandRequest,
  SaveCommandResponse,
  DeleteCommandRequest,
  DeleteCommandResponse,
} from './ipc.agents.types';

// Re-export skill types
export type {
  ListSkillsResponse,
  GetSkillRequest,
  GetSkillResponse,
  SaveSkillRequest,
  SaveSkillResponse,
  DeleteSkillRequest,
  DeleteSkillResponse,
} from './ipc.skills.types';

// Re-export plugin types
export type {
  GetMarketplacesResponse,
  AddMarketplaceRequest,
  AddMarketplaceResponse,
  RemoveMarketplaceRequest,
  RemoveMarketplaceResponse,
  GetAvailablePluginsResponse,
  GetInstalledPluginsResponse,
  InstallPluginRequest,
  InstallPluginResponse,
  UninstallPluginRequest,
  UninstallPluginResponse,
  TogglePluginRequest,
  TogglePluginResponse,
  GetGitHubRepoInfoRequest,
  GetGitHubRepoInfoResponse,
  GetPluginHealthRequest,
  GetPluginHealthResponse,
} from './ipc.plugins.types';

// Re-export hooks types
export type {
  GetAllHooksRequest,
  GetAllHooksResponse,
  GetTemplatesResponse,
  GetSettingsPathRequest,
  GetSettingsPathResponse,
  OpenSettingsFileRequest,
  OpenSettingsFileResponse,
} from './ipc.hooks.types';

// Re-export MCP types
export type {
  MCPServer,
  MCPScope,
  MCPTransport,
  MCPServerConfig,
  MCPConnectionTestResult,
  MCPConnectionTestStep,
  AddMCPServerRequest,
  AddMCPServerResponse,
  RemoveMCPServerRequest,
  RemoveMCPServerResponse,
  ListMCPServersRequest,
  ListMCPServersResponse,
  GetMCPServerRequest,
  GetMCPServerResponse,
} from './ipc.mcp.types';

// Re-export project discovery types
export type {
  GetProjectsRequest,
  GetProjectsResponse,
  GetProjectInfoRequest,
  GetProjectInfoResponse,
  GetProjectMCPServersRequest,
  GetProjectMCPServersResponse,
  CheckClaudeConfigRequest,
  CheckClaudeConfigResponse,
  ReadClaudeConfigRequest,
  ReadClaudeConfigResponse,
} from './ipc.projects.types';

// Re-export system types
export type {
  ExecuteCLIRequest,
  ExecuteCLIResponse,
  CheckClaudeInstalledResponse,
  UsageDay,
  UsageReport,
  CheckCCUsageInstalledResponse,
  GetCCUsageVersionResponse,
  GetUsageReportResponse,
} from './ipc.system.types';

// Re-export status types
export type {
  ServiceStatusLevel,
  ServiceIncidentUpdate,
  ServiceIncident,
  ServiceStatus,
  GetServiceStatusResponse,
  DebugLog,
  ListDebugLogsResponse,
  GetDebugLogRequest,
  GetDebugLogResponse,
  DeleteDebugLogRequest,
  DeleteDebugLogResponse,
  SearchDebugLogsRequest,
  SearchDebugLogsResponse,
} from './ipc.status.types';

// Re-export statusline types
export type {
  GetActiveStatusLineResponse,
  ListTemplatesResponse,
  SetTemplateRequest,
  SetTemplateResponse,
  SetCustomScriptRequest,
  SetCustomScriptResponse,
  PreviewStatusLineRequest,
  PreviewStatusLineResponse,
  DisableStatusLineResponse,
  ScanScriptRequest,
  ScanScriptResponse,
  ExportScriptRequest,
  ExportScriptResponse,
} from './ipc.statusline.types';
