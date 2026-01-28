/**
 * HookEditModal - Create and edit hooks
 *
 * Unified modal for creating new hooks and editing existing ones.
 * Supports all hook events and both command and prompt hook types.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  EditModal,
  EditModalFooter,
  UnsavedChangesAlert,
} from '@/renderer/components/common/EditModal';
import { ScopeSelector } from '@/renderer/components/common/ScopeSelector';
import { Label } from '@/renderer/components/ui/label';
import { Input } from '@/renderer/components/ui/input';
import { Textarea } from '@/renderer/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/renderer/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/components/ui/select';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import { Badge } from '@/renderer/components/ui/badge';
import { AlertCircle, Terminal, MessageSquare, ExternalLink } from 'lucide-react';
import { useCreateHook, useUpdateHook } from '@/renderer/hooks/useHooks';
import type { HookEvent, HookType, HookWithMetadata } from '@/shared/types/hook.types';
import type { HookDefinition } from '@/shared/types/ipc.hooks.types';
import type { ProjectInfo } from '@/shared/types';

/** All available hook events */
const HOOK_EVENTS: Array<{
  value: HookEvent;
  label: string;
  description: string;
  requiresMatcher: boolean;
  supportsPrompt: boolean;
}> = [
  {
    value: 'PreToolUse',
    label: 'Pre-Tool Use',
    description: 'Before Claude uses a tool (can block or modify)',
    requiresMatcher: true,
    supportsPrompt: true,
  },
  {
    value: 'PostToolUse',
    label: 'Post-Tool Use',
    description: 'After a tool completes successfully',
    requiresMatcher: true,
    supportsPrompt: false,
  },
  {
    value: 'UserPromptSubmit',
    label: 'User Prompt Submit',
    description: 'When user submits a prompt',
    requiresMatcher: false,
    supportsPrompt: true,
  },
  {
    value: 'Notification',
    label: 'Notification',
    description: 'When Claude sends notifications',
    requiresMatcher: false,
    supportsPrompt: false,
  },
  {
    value: 'Stop',
    label: 'Stop',
    description: 'When Claude finishes responding',
    requiresMatcher: false,
    supportsPrompt: true,
  },
  {
    value: 'SubagentStop',
    label: 'Subagent Stop',
    description: 'When a subagent task completes',
    requiresMatcher: false,
    supportsPrompt: true,
  },
  {
    value: 'SessionStart',
    label: 'Session Start',
    description: 'When a session starts or resumes',
    requiresMatcher: false,
    supportsPrompt: false,
  },
  {
    value: 'SessionEnd',
    label: 'Session End',
    description: 'When a session terminates',
    requiresMatcher: false,
    supportsPrompt: false,
  },
];

interface HookEditModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Hook to edit (null for create mode) */
  hook?: HookWithMetadata | null | undefined;
  /** Callback on successful save */
  onSuccess?: () => void;
}

export function HookEditModal({ isOpen, onClose, hook, onSuccess }: HookEditModalProps) {
  const isEditMode = !!hook;
  const createHook = useCreateHook();
  const updateHook = useUpdateHook();

  // Form state
  const [event, setEvent] = useState<HookEvent>('PreToolUse');
  const [matcher, setMatcher] = useState('');
  const [hookType, setHookType] = useState<HookType>('command');
  const [command, setCommand] = useState('');
  const [prompt, setPrompt] = useState('');
  const [timeout, setTimeout] = useState<number | ''>(60);
  const [scope, setScope] = useState<'user' | 'project'>('user');
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Get event configuration
  const eventConfig = HOOK_EVENTS.find(e => e.value === event);
  const requiresMatcher = eventConfig?.requiresMatcher ?? false;
  const supportsPrompt = eventConfig?.supportsPrompt ?? true;

  // Reset form when modal opens/hook changes
  useEffect(() => {
    if (isOpen) {
      if (hook) {
        // Edit mode - populate from existing hook
        setEvent(hook.event);
        setMatcher(hook.configuration.matcher || '');
        setHookType(hook.hook.type);
        setCommand(hook.hook.command || '');
        setPrompt(hook.hook.prompt || '');
        setTimeout(hook.hook.timeout || 60);
        setScope(hook.location === 'local' ? 'project' : hook.location);
      } else {
        // Create mode - reset to defaults
        setEvent('PreToolUse');
        setMatcher('');
        setHookType('command');
        setCommand('');
        setPrompt('');
        setTimeout(60);
        setScope('user');
        setSelectedProject(null);
      }
      setError(null);
      setHasChanges(false);
    }
  }, [isOpen, hook]);

  // Track changes
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && hook) {
      const originalType = hook.hook.type;
      const originalCommand = hook.hook.command || '';
      const originalPrompt = hook.hook.prompt || '';
      const originalTimeout = hook.hook.timeout || 60;
      const originalMatcher = hook.configuration.matcher || '';

      const changed =
        hookType !== originalType ||
        command !== originalCommand ||
        prompt !== originalPrompt ||
        timeout !== originalTimeout ||
        matcher !== originalMatcher;

      setHasChanges(changed);
    } else {
      // In create mode, always consider changes if any field is filled
      const changed = command.trim() !== '' || prompt.trim() !== '';
      setHasChanges(changed);
    }
  }, [isOpen, isEditMode, hook, hookType, command, prompt, timeout, matcher]);

  // Auto-reset hook type if switching to event that doesn't support prompts
  useEffect(() => {
    if (!supportsPrompt && hookType === 'prompt') {
      setHookType('command');
    }
  }, [supportsPrompt, hookType]);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      setShowUnsavedAlert(true);
    } else {
      onClose();
    }
  }, [hasChanges, onClose]);

  const handleSave = async () => {
    setError(null);

    // Validation
    if (!event) {
      setError('Please select an event type');
      return;
    }

    if (requiresMatcher && !matcher.trim()) {
      setError('Matcher pattern is required for this event type');
      return;
    }

    if (hookType === 'command' && !command.trim()) {
      setError('Command is required for command hooks');
      return;
    }

    if (hookType === 'prompt' && !prompt.trim()) {
      setError('Prompt is required for prompt hooks');
      return;
    }

    if (scope === 'project' && !selectedProject) {
      setError('Please select a project');
      return;
    }

    const timeoutValue = typeof timeout === 'number' ? timeout : undefined;

    const hookDefinition: HookDefinition = {
      event,
      matcher: matcher.trim() || undefined,
      type: hookType,
      command: hookType === 'command' ? command.trim() : undefined,
      prompt: hookType === 'prompt' ? prompt.trim() : undefined,
      timeout: timeoutValue,
    };

    try {
      if (isEditMode && hook) {
        // Update existing hook
        const hookId = `${hook.event}:${hook.configIndex}:${hook.hookIndex}`;
        const updateScope = hook.location === 'local' ? 'project' : hook.location;
        const updateArgs: {
          hookId: string;
          updates: Partial<HookDefinition>;
          scope: 'user' | 'project';
          projectPath?: string;
        } = {
          hookId,
          updates: hookDefinition,
          scope: updateScope,
        };
        if (hook.location === 'project' && selectedProject?.path) {
          updateArgs.projectPath = selectedProject.path;
        }
        await updateHook.mutateAsync(updateArgs);
      } else {
        // Create new hook
        const createArgs: {
          hook: HookDefinition;
          scope: 'user' | 'project';
          projectPath?: string;
        } = {
          hook: hookDefinition,
          scope,
        };
        if (scope === 'project' && selectedProject?.path) {
          createArgs.projectPath = selectedProject.path;
        }
        await createHook.mutateAsync(createArgs);
      }

      setHasChanges(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save hook');
    }
  };

  const isLoading = createHook.isPending || updateHook.isPending;

  // Build modal props - conditionally include badge only in edit mode
  const modalProps = {
    isOpen,
    onClose: handleClose,
    title: isEditMode ? `Edit Hook` : 'Create Hook',
    subtitle: isEditMode
      ? `${hook?.event} hook`
      : 'Add a new hook to customize Claude Code behavior',
    isLoading,
    hasUnsavedChanges: hasChanges,
    maxWidth: 'max-w-2xl',
    onSave: handleSave,
    isSaveDisabled: !hasChanges && isEditMode,
    ...(isEditMode && hook ? { badge: { text: hook.location, variant: 'outline' as const } } : {}),
  };

  return (
    <>
      <EditModal
        {...modalProps}
        footer={
          <EditModalFooter
            onCancel={handleClose}
            onSave={handleSave}
            isLoading={isLoading}
            isSaveDisabled={!hasChanges && isEditMode}
            saveLabel={isEditMode ? 'Save Changes' : 'Create Hook'}
          />
        }
      >
        <div className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="event-type">Event Type</Label>
            <Select
              value={event}
              onValueChange={v => setEvent(v as HookEvent)}
              disabled={isEditMode}
            >
              <SelectTrigger id="event-type" data-testid="hook-event-select">
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {HOOK_EVENTS.map(e => (
                  <SelectItem key={e.value} value={e.value}>
                    <div className="flex flex-col">
                      <span>{e.label}</span>
                      <span className="text-xs text-muted-foreground">{e.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {eventConfig && (
              <p className="text-xs text-muted-foreground">{eventConfig.description}</p>
            )}
          </div>

          {/* Matcher Pattern */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="matcher">
                Matcher Pattern
                {requiresMatcher && <span className="text-destructive ml-1">*</span>}
              </Label>
              {!requiresMatcher && (
                <Badge variant="secondary" className="text-xs">
                  Optional
                </Badge>
              )}
            </div>
            <Input
              id="matcher"
              value={matcher}
              onChange={e => setMatcher(e.target.value)}
              placeholder="e.g., Bash(*), Edit(src/**/*.ts)"
              disabled={isLoading}
              data-testid="hook-matcher-input"
            />
            <p className="text-xs text-muted-foreground">
              Tool pattern to match. Use glob syntax: Bash(*), Edit(src/**), Read(package.json)
            </p>
          </div>

          {/* Hook Type */}
          <div className="space-y-2">
            <Label>Hook Type</Label>
            <RadioGroup
              value={hookType}
              onValueChange={v => setHookType(v as HookType)}
              className="flex gap-4"
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="command" id="type-command" />
                <Label htmlFor="type-command" className="flex items-center gap-2 cursor-pointer">
                  <Terminal className="h-4 w-4" />
                  Command
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="prompt" id="type-prompt" disabled={!supportsPrompt} />
                <Label
                  htmlFor="type-prompt"
                  className={`flex items-center gap-2 cursor-pointer ${!supportsPrompt ? 'opacity-50' : ''}`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Prompt
                  {!supportsPrompt && (
                    <Badge variant="secondary" className="text-xs">
                      Not supported
                    </Badge>
                  )}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Command Input */}
          {hookType === 'command' && (
            <div className="space-y-2">
              <Label htmlFor="command">
                Shell Command <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="command"
                value={command}
                onChange={e => setCommand(e.target.value)}
                placeholder="e.g., /path/to/script.sh"
                rows={3}
                className="font-mono text-sm"
                disabled={isLoading}
                data-testid="hook-command-input"
              />
              <p className="text-xs text-muted-foreground">
                Shell command to execute. Context is passed via stdin as JSON.
              </p>
            </div>
          )}

          {/* Prompt Input */}
          {hookType === 'prompt' && (
            <div className="space-y-2">
              <Label htmlFor="prompt">
                AI Prompt <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Review this tool call for security issues..."
                rows={4}
                disabled={isLoading}
                data-testid="hook-prompt-input"
              />
              <p className="text-xs text-muted-foreground">
                Prompt sent to Claude to evaluate. Use to add approval logic.
              </p>
            </div>
          )}

          {/* Timeout */}
          <div className="space-y-2">
            <Label htmlFor="timeout">Timeout (seconds)</Label>
            <Input
              id="timeout"
              type="number"
              value={timeout}
              onChange={e => setTimeout(e.target.value ? parseInt(e.target.value, 10) : '')}
              min={1}
              max={600}
              placeholder="60"
              disabled={isLoading}
              className="w-32"
              data-testid="hook-timeout-input"
            />
            <p className="text-xs text-muted-foreground">
              Maximum time the hook can run (1-600 seconds, default: 60)
            </p>
          </div>

          {/* Scope Selector (only for create mode) */}
          {!isEditMode && (
            <ScopeSelector
              scope={scope}
              selectedProject={selectedProject}
              onScopeChange={setScope}
              onProjectChange={setSelectedProject}
              compact={true}
            />
          )}

          {/* Documentation Link */}
          <div className="pt-2 border-t">
            <button
              type="button"
              onClick={() =>
                window.electronAPI.openExternal('https://code.claude.com/docs/en/hooks')
              }
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              View Hooks Documentation
            </button>
          </div>
        </div>
      </EditModal>

      {/* Unsaved Changes Alert */}
      <UnsavedChangesAlert
        isOpen={showUnsavedAlert}
        onDiscard={() => {
          setShowUnsavedAlert(false);
          setHasChanges(false);
          onClose();
        }}
        onKeepEditing={() => setShowUnsavedAlert(false)}
      />
    </>
  );
}
