import { useState, useCallback, useEffect, useMemo } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { CommandFrontmatter, CommandWithMetadata } from '../../../shared/types/command.types';
import { CommandConfigForm } from './CommandConfigForm';
import { CommandReviewStep } from './CommandReviewStep';
import { UnsavedChangesAlert } from '@/renderer/components/common/EditModal';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import { Badge } from '@/renderer/components/ui/badge';
import { Button } from '@/renderer/components/ui/button';
import type { ProjectInfo } from '@/shared/types';

export interface CommandEditorProps {
  command: CommandWithMetadata | undefined;
  onSave: (command: {
    name: string;
    location: 'user' | 'project';
    projectPath?: string;
    namespace?: string | undefined;
    frontmatter: CommandFrontmatter;
    content: string;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

type EditorStep = 'config' | 'review';

/**
 * Helper function to build CommandFrontmatter with proper undefined handling
 */
function buildFrontmatterForReview(options: {
  description: string;
  argumentHint: string;
  model: 'sonnet' | 'opus' | 'haiku' | 'default';
  allowedTools: string[];
  disableModelInvocation: boolean;
}): CommandFrontmatter {
  const result: CommandFrontmatter = {
    description: options.description,
  };

  if (options.argumentHint) {
    result['argument-hint'] = options.argumentHint;
  }

  if (options.model !== 'default') {
    result.model = options.model as 'sonnet' | 'opus' | 'haiku';
  }

  if (options.allowedTools.length > 0) {
    result['allowed-tools'] = options.allowedTools;
  }

  if (options.disableModelInvocation) {
    result['disable-model-invocation'] = true;
  }

  return result;
}

export function CommandEditor({ command, onSave, onCancel, isLoading }: CommandEditorProps) {
  const isEditMode = !!command;
  const [currentStep, setCurrentStep] = useState<EditorStep>('config');

  // Form state
  const [name, setName] = useState(command?.name || '');
  const [description, setDescription] = useState(command?.frontmatter.description || '');
  const [argumentHint, setArgumentHint] = useState(command?.frontmatter['argument-hint'] || '');
  const [model, setModel] = useState<'sonnet' | 'opus' | 'haiku' | 'default'>(
    (command?.frontmatter.model || 'default') as any
  );
  const [allowedTools, setAllowedTools] = useState(command?.frontmatter['allowed-tools'] || []);
  const [disableModelInvocation, setDisableModelInvocation] = useState(
    command?.frontmatter['disable-model-invocation'] || false
  );
  const [location, setLocation] = useState<'user' | 'project' | 'plugin' | 'mcp'>(
    command?.location || 'user'
  );
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);
  const [namespace, setNamespace] = useState(command?.namespace || '');
  const [content, setContent] = useState(command?.content || '');
  const [errors, setErrors] = useState<string[]>([]);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

  // Track initial values for change detection
  const initialValues = useMemo(
    () => ({
      name: command?.name || '',
      description: command?.frontmatter.description || '',
      argumentHint: command?.frontmatter['argument-hint'] || '',
      model: command?.frontmatter.model || 'default',
      allowedTools: command?.frontmatter['allowed-tools'] || [],
      disableModelInvocation: command?.frontmatter['disable-model-invocation'] || false,
      namespace: command?.namespace || '',
      content: command?.content || '',
    }),
    [command]
  );

  // Calculate if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (isEditMode) {
      return (
        name !== initialValues.name ||
        description !== initialValues.description ||
        argumentHint !== initialValues.argumentHint ||
        model !== initialValues.model ||
        JSON.stringify(allowedTools) !== JSON.stringify(initialValues.allowedTools) ||
        disableModelInvocation !== initialValues.disableModelInvocation ||
        namespace !== initialValues.namespace ||
        content !== initialValues.content
      );
    }
    // In create mode, any filled field counts as changes
    return !!(name.trim() || description.trim() || content.trim());
  }, [
    isEditMode,
    name,
    description,
    argumentHint,
    model,
    allowedTools,
    disableModelInvocation,
    namespace,
    content,
    initialValues,
  ]);

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (hasChanges && !isLoading) {
      setShowUnsavedAlert(true);
    } else {
      onCancel();
    }
  }, [hasChanges, isLoading, onCancel]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: string[] = [];

    if (!name.trim()) {
      newErrors.push('Command name is required');
    } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
      newErrors.push('Command name must be lowercase with hyphens (e.g., my-command)');
    }

    if (!description.trim()) {
      newErrors.push('Description is required');
    }

    if (content.trim().length === 0) {
      newErrors.push('Command content cannot be empty');
    }

    // Validate project selection when location is 'project'
    if (location === 'project' && !selectedProject) {
      newErrors.push('Please select a project');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return false;
    }

    return true;
  }, [name, description, content, location, selectedProject]);

  const handleNextStep = useCallback(() => {
    if (!validateForm()) {
      return;
    }

    setErrors([]);
    setCurrentStep('review');
  }, [validateForm]);

  // Handle keyboard shortcuts (Escape to close, Cmd/Ctrl+S to save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape' && !isLoading) {
        e.preventDefault();
        handleClose();
      }

      // Cmd/Ctrl + S to save (in config step, triggers next; in review step, triggers confirm)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (!isLoading) {
          if (currentStep === 'config') {
            handleNextStep();
          }
          // In review step, the save is handled by CommandReviewStep's own confirm button
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, handleClose, currentStep, handleNextStep]);

  const handleBackToConfig = useCallback(() => {
    setCurrentStep('config');
  }, []);

  const handleConfirmReview = useCallback(
    async (finalFrontmatter: CommandFrontmatter, finalContent: string) => {
      // Only allow user and project locations for creation/editing
      if (location !== 'user' && location !== 'project') {
        setErrors([
          'Plugin and MCP commands cannot be edited. Copy to user or project location first.',
        ]);
        return;
      }

      try {
        await onSave({
          name,
          location: location as 'user' | 'project',
          ...(location === 'project' && selectedProject?.path
            ? { projectPath: selectedProject.path }
            : {}),
          namespace: namespace || undefined,
          frontmatter: finalFrontmatter,
          content: finalContent,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save command';
        setErrors([errorMessage]);
      }
    },
    [name, location, selectedProject, namespace, onSave]
  );

  const displayTitle = isEditMode ? `Edit Command: /${name}` : 'Create New Command';
  const currentStepNumber = currentStep === 'config' ? 1 : 2;
  const totalSteps = 2;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={handleClose}
      >
        <div
          className="flex flex-col bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] m-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <h2 className="text-xl font-semibold">{displayTitle}</h2>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                Step {currentStepNumber}/{totalSteps}
              </Badge>
              <Button variant="ghost" size="icon" onClick={handleClose} disabled={isLoading}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {errors.length > 0 && currentStep === 'config' && (
            <Alert variant="destructive" className="m-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === 'config' && (
              <>
                <CommandConfigForm
                  name={name}
                  description={description}
                  argumentHint={argumentHint}
                  model={model}
                  allowedTools={allowedTools}
                  disableModelInvocation={disableModelInvocation}
                  location={location}
                  selectedProject={selectedProject}
                  namespace={namespace}
                  content={content}
                  errors={errors}
                  onNameChange={setName}
                  onDescriptionChange={setDescription}
                  onArgumentHintChange={setArgumentHint}
                  onModelChange={val => setModel(val as any)}
                  onToolsChange={setAllowedTools}
                  onDisableModelInvocationChange={setDisableModelInvocation}
                  onLocationChange={loc => setLocation(loc as 'user' | 'project')}
                  onProjectChange={setSelectedProject}
                  onNamespaceChange={setNamespace}
                  onContentChange={setContent}
                />

                <Alert className="mt-6">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Next: You&apos;ll review the generated markdown and have the option to edit it
                    manually.
                  </AlertDescription>
                </Alert>
              </>
            )}

            {currentStep === 'review' && (
              <CommandReviewStep
                name={name}
                location={location}
                namespace={namespace}
                frontmatter={buildFrontmatterForReview({
                  description,
                  argumentHint,
                  model,
                  allowedTools,
                  disableModelInvocation,
                })}
                content={content}
                onBack={handleBackToConfig}
                onConfirm={handleConfirmReview}
                isLoading={isLoading}
              />
            )}
          </div>

          {currentStep === 'config' && (
            <div className="flex justify-between gap-4 p-6 border-t border-neutral-200">
              <Button onClick={handleClose} variant="outline" disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleNextStep} disabled={isLoading}>
                Next: Review
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Unsaved changes confirmation */}
      <UnsavedChangesAlert
        isOpen={showUnsavedAlert}
        onDiscard={() => {
          setShowUnsavedAlert(false);
          onCancel();
        }}
        onKeepEditing={() => setShowUnsavedAlert(false)}
      />
    </>
  );
}
