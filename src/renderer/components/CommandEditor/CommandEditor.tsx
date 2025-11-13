import { useState, useCallback } from 'react';
import { CommandFrontmatter, CommandWithMetadata } from '../../../shared/types/command.types';
import { CommandConfigForm } from './CommandConfigForm';
import { CommandReviewStep } from './CommandReviewStep';
import './CommandEditor.css';

export interface CommandEditorProps {
  command: CommandWithMetadata | undefined;
  onSave: (command: {
    name: string;
    location: 'user' | 'project';
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
  const [namespace, setNamespace] = useState(command?.namespace || '');
  const [content, setContent] = useState(command?.content || '');
  const [errors, setErrors] = useState<string[]>([]);

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

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return false;
    }

    return true;
  }, [name, description, content]);

  const handleNextStep = useCallback(() => {
    if (!validateForm()) {
      return;
    }

    setErrors([]);
    setCurrentStep('review');
  }, [validateForm]);

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
          namespace: namespace || undefined,
          frontmatter: finalFrontmatter,
          content: finalContent,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save command';
        setErrors([errorMessage]);
      }
    },
    [name, location, namespace, onSave]
  );

  const displayTitle = isEditMode ? `Edit Command: /${name}` : 'Create New Command';
  const currentStepNumber = currentStep === 'config' ? 1 : 2;
  const totalSteps = 2;

  return (
    <div className="command-editor">
      <div className="command-editor-header">
        <h2>{displayTitle}</h2>
        <div className="step-indicator">
          Step {currentStepNumber}/{totalSteps}
        </div>
      </div>

      {errors.length > 0 && currentStep === 'config' && (
        <div className="error-panel">
          <div className="error-header">⚠️ Errors</div>
          <ul>
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="command-editor-content">
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
              onNamespaceChange={setNamespace}
              onContentChange={setContent}
            />

            <div className="step-info">
              ℹ️ Next: You&apos;ll review the generated markdown and have the option to edit it
              manually.
            </div>
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
        <div className="command-editor-footer">
          <button onClick={onCancel} className="cancel-btn" disabled={isLoading}>
            Cancel
          </button>
          <button onClick={handleNextStep} className="save-btn" disabled={isLoading}>
            Next: Review
          </button>
        </div>
      )}
    </div>
  );
}
