/**
 * Hook Event Information
 *
 * Metadata about each hook event type in Claude Code
 *
 * @see https://code.claude.com/docs/en/hooks
 */

import type { HookEvent, HookEventInfo } from '../../shared/types/hook.types';

/**
 * Complete information about all hook events
 */
export const HOOK_EVENTS_INFO: Record<HookEvent, HookEventInfo> = {
  PreToolUse: {
    event: 'PreToolUse',
    name: 'Pre-Tool Use',
    description: 'Executes before Claude uses a tool (can block or modify tool calls)',
    whenTriggers: 'After Claude creates tool parameters, before processing the tool',
    requiresMatcher: true,
    supportsPromptHooks: true,
    docsUrl: 'https://code.claude.com/docs/en/hooks#pretooluse',
    contextVariables: [
      'session_id',
      'transcript_path',
      'cwd',
      'permission_mode',
      'tool_name',
      'tool_input',
    ],
  },
  PostToolUse: {
    event: 'PostToolUse',
    name: 'Post-Tool Use',
    description: 'Executes after a tool completes successfully',
    whenTriggers: 'Immediately after successful tool completion',
    requiresMatcher: true,
    supportsPromptHooks: false,
    docsUrl: 'https://code.claude.com/docs/en/hooks#posttooluse',
    contextVariables: [
      'session_id',
      'transcript_path',
      'cwd',
      'tool_name',
      'tool_input',
      'tool_output',
    ],
  },
  UserPromptSubmit: {
    event: 'UserPromptSubmit',
    name: 'User Prompt Submit',
    description: 'Executes when user submits a prompt (before Claude processes it)',
    whenTriggers: 'When user submits a prompt, before Claude processes it',
    requiresMatcher: false,
    supportsPromptHooks: true,
    docsUrl: 'https://code.claude.com/docs/en/hooks#userpromptsubmit',
    contextVariables: ['session_id', 'transcript_path', 'cwd', 'user_prompt'],
  },
  Notification: {
    event: 'Notification',
    name: 'Notification',
    description: 'Executes when Claude Code sends notifications',
    whenTriggers: 'When Claude Code sends permission requests or idle notifications',
    requiresMatcher: false,
    supportsPromptHooks: false,
    docsUrl: 'https://code.claude.com/docs/en/hooks#notification',
    contextVariables: ['session_id', 'transcript_path', 'cwd', 'notification_type', 'message'],
  },
  Stop: {
    event: 'Stop',
    name: 'Stop',
    description: 'Executes when Claude Code finishes responding',
    whenTriggers: 'When the main agent finishes responding',
    requiresMatcher: false,
    supportsPromptHooks: true,
    docsUrl: 'https://code.claude.com/docs/en/hooks#stop',
    contextVariables: ['session_id', 'transcript_path', 'cwd', 'stop_reason'],
  },
  SubagentStop: {
    event: 'SubagentStop',
    name: 'Subagent Stop',
    description: 'Executes when a subagent task completes',
    whenTriggers: 'When Claude Code subagents complete tasks',
    requiresMatcher: false,
    supportsPromptHooks: true,
    docsUrl: 'https://code.claude.com/docs/en/hooks#subagentstop',
    contextVariables: ['session_id', 'transcript_path', 'cwd', 'subagent_name', 'stop_reason'],
  },
  SessionStart: {
    event: 'SessionStart',
    name: 'Session Start',
    description: 'Executes when a session starts or resumes',
    whenTriggers: 'At session initialization or resumption',
    requiresMatcher: false,
    supportsPromptHooks: false,
    docsUrl: 'https://code.claude.com/docs/en/hooks#sessionstart',
    contextVariables: ['session_id', 'transcript_path', 'cwd'],
  },
  SessionEnd: {
    event: 'SessionEnd',
    name: 'Session End',
    description: 'Executes when a session terminates',
    whenTriggers: 'When sessions terminate',
    requiresMatcher: false,
    supportsPromptHooks: false,
    docsUrl: 'https://code.claude.com/docs/en/hooks#sessionend',
    contextVariables: ['session_id', 'transcript_path', 'cwd', 'end_reason'],
  },
};

/**
 * Get all hook event types (ordered)
 */
export const HOOK_EVENT_TYPES: HookEvent[] = [
  'PreToolUse',
  'PostToolUse',
  'UserPromptSubmit',
  'Notification',
  'Stop',
  'SubagentStop',
  'SessionStart',
  'SessionEnd',
];

/**
 * Get event information by event type
 */
export function getHookEventInfo(event: HookEvent): HookEventInfo {
  return HOOK_EVENTS_INFO[event];
}

/**
 * Get all hook events information (in order)
 */
export function getAllHookEventsInfo(): HookEventInfo[] {
  return HOOK_EVENT_TYPES.map((event) => HOOK_EVENTS_INFO[event]);
}
