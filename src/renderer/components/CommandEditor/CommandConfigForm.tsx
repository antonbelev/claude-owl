import { useState } from 'react';
import { CommandToolSelector } from './CommandToolSelector';
import './CommandConfigForm.css';

export interface CommandConfigFormProps {
  name: string;
  description: string;
  argumentHint: string;
  model: 'sonnet' | 'opus' | 'haiku' | 'default';
  allowedTools: string[];
  disableModelInvocation: boolean;
  location: 'user' | 'project' | 'plugin' | 'mcp';
  namespace: string;
  content: string;
  errors: string[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onArgumentHintChange: (hint: string) => void;
  onModelChange: (model: string) => void;
  onToolsChange: (tools: string[]) => void;
  onDisableModelInvocationChange: (disabled: boolean) => void;
  onLocationChange: (location: 'user' | 'project') => void;
  onNamespaceChange: (namespace: string) => void;
  onContentChange: (content: string) => void;
}

export function CommandConfigForm({
  name,
  description,
  argumentHint,
  model,
  allowedTools,
  disableModelInvocation,
  location,
  namespace,
  content,
  errors,
  onNameChange,
  onDescriptionChange,
  onArgumentHintChange,
  onModelChange,
  onToolsChange,
  onDisableModelInvocationChange,
  onLocationChange,
  onNamespaceChange,
  onContentChange,
}: CommandConfigFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="command-config-form">
      {errors.length > 0 && (
        <div className="error-panel">
          <div className="error-header">⚠️ Errors</div>
          <ul>
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Basic Section */}
      <div className="form-section">
        <h3>Basic Information</h3>

        <div className="form-group">
          <label htmlFor="command-name">
            Command Name <span className="required">*</span>
          </label>
          <div className="input-with-prefix">
            <span className="prefix">/</span>
            <input
              id="command-name"
              type="text"
              value={name}
              onChange={e => onNameChange(e.target.value)}
              placeholder="my-command"
              className="form-input"
            />
          </div>
          <div className="field-hint">
            Use lowercase letters, numbers, and hyphens (e.g., <code>review-pr</code>)
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">
            Description <span className="required">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={e => onDescriptionChange(e.target.value)}
            placeholder="Brief description of what this command does"
            className="form-textarea"
            rows={3}
          />
          <div className="field-hint">
            This is shown in Claude Code when users type <code>/{name || 'command'}</code>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="argument-hint">Argument Hint</label>
          <input
            id="argument-hint"
            type="text"
            value={argumentHint}
            onChange={e => onArgumentHintChange(e.target.value)}
            placeholder="[branch-name] [message]"
            className="form-input"
          />
          <div className="field-hint">Optional hint showing what arguments the command expects</div>
        </div>
      </div>

      {/* Location & Namespace Section */}
      <div className="form-section">
        <h3>Storage & Organization</h3>

        <div className="form-group">
          <label>Location</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="location"
                value="user"
                checked={location === 'user'}
                onChange={() => onLocationChange('user')}
              />
              <span className="radio-text">
                User Commands (<code>~/.claude/commands/</code>)
              </span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="location"
                value="project"
                checked={location === 'project'}
                onChange={() => onLocationChange('project')}
              />
              <span className="radio-text">
                Project Commands (<code>.claude/commands/</code>)
              </span>
            </label>
          </div>
          <div className="field-hint">
            User commands are personal. Project commands are shared with your team.
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="namespace">Namespace (optional)</label>
          <input
            id="namespace"
            type="text"
            value={namespace}
            onChange={e => onNamespaceChange(e.target.value)}
            placeholder="workflows, tools, git"
            className="form-input"
          />
          <div className="field-hint">
            Organize commands in subdirectories (e.g., <code>workflows/feature-dev</code> →{' '}
            <code>/workflows:feature-dev</code>)
          </div>
        </div>
      </div>

      {/* Tools Section */}
      <div className="form-section">
        <h3>Allowed Tools</h3>
        <CommandToolSelector selectedTools={allowedTools} onChange={onToolsChange} />
        <div className="field-hint">
          Select which Claude Code tools this command is allowed to use. The more specific, the
          safer.
        </div>
      </div>

      {/* Command Content */}
      <div className="form-section">
        <h3>Command Content</h3>

        <div className="editor-help">
          <h4>Syntax Guide</h4>
          <ul>
            <li>
              <code>$ARGUMENTS</code> - All arguments as one string
            </li>
            <li>
              <code>$1, $2, $3, ...</code> - Individual arguments
            </li>
            <li>
              <code>!`git status`</code> - Execute bash command
            </li>
            <li>
              <code>@src/main.ts</code> - Include file contents
            </li>
          </ul>
        </div>

        <div className="editor-toolbar">
          <div className="variable-helpers">
            <span className="toolbar-label">Insert Variable:</span>
            <button
              className="helper-btn"
              onClick={() => {
                const textarea = document.getElementById('command-content') as HTMLTextAreaElement;
                if (textarea) {
                  const start = textarea.selectionStart;
                  const newContent =
                    content.substring(0, start) + '$ARGUMENTS' + content.substring(start);
                  onContentChange(newContent);
                  setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + '$ARGUMENTS'.length;
                    textarea.focus();
                  }, 0);
                }
              }}
              title="All arguments as single string"
            >
              $ARGUMENTS
            </button>
            <button
              className="helper-btn"
              onClick={() => {
                const textarea = document.getElementById('command-content') as HTMLTextAreaElement;
                if (textarea) {
                  const start = textarea.selectionStart;
                  const newContent = content.substring(0, start) + '$1' + content.substring(start);
                  onContentChange(newContent);
                  setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + '$1'.length;
                    textarea.focus();
                  }, 0);
                }
              }}
              title="First argument"
            >
              $1
            </button>
            <button
              className="helper-btn"
              onClick={() => {
                const textarea = document.getElementById('command-content') as HTMLTextAreaElement;
                if (textarea) {
                  const start = textarea.selectionStart;
                  const newContent = content.substring(0, start) + '$2' + content.substring(start);
                  onContentChange(newContent);
                  setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + '$2'.length;
                    textarea.focus();
                  }, 0);
                }
              }}
              title="Second argument"
            >
              $2
            </button>
            <button
              className="helper-btn"
              onClick={() => {
                const textarea = document.getElementById('command-content') as HTMLTextAreaElement;
                if (textarea) {
                  const start = textarea.selectionStart;
                  const newContent = content.substring(0, start) + '$3' + content.substring(start);
                  onContentChange(newContent);
                  setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + '$3'.length;
                    textarea.focus();
                  }, 0);
                }
              }}
              title="Third argument"
            >
              $3
            </button>
          </div>
        </div>

        <textarea
          id="command-content"
          value={content}
          onChange={e => onContentChange(e.target.value)}
          className="content-textarea"
          placeholder={
            'Write your command content here. Use the buttons above to insert variables.\n\nYou can use:\n- $ARGUMENTS for all arguments\n- $1, $2, $3 for individual arguments\n- !`command` for bash execution\n- @path/to/file for file references'
          }
          spellCheck="false"
        />
      </div>

      {/* Advanced Section */}
      <div className="form-section">
        <button
          type="button"
          className="toggle-advanced-btn"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? '▼' : '▶'} Advanced Options
        </button>

        {showAdvanced && (
          <>
            <div className="form-group">
              <label htmlFor="model">Model</label>
              <select
                id="model"
                value={model}
                onChange={e => onModelChange(e.target.value)}
                className="form-select"
              >
                <option value="default">Default (Current Model)</option>
                <option value="opus">Opus (Most capable)</option>
                <option value="sonnet">Sonnet (Balanced)</option>
                <option value="haiku">Haiku (Fastest)</option>
              </select>
              <div className="field-hint">
                Specify which Claude model should run this command. Defaults to user&apos;s current
                model.
              </div>
            </div>

            <div className="form-group checkbox">
              <label htmlFor="disable-model-invocation">
                <input
                  id="disable-model-invocation"
                  type="checkbox"
                  checked={disableModelInvocation}
                  onChange={e => onDisableModelInvocationChange(e.target.checked)}
                />
                <span>Disable Model Invocation</span>
              </label>
              <div className="field-hint">
                If checked, Claude cannot invoke this command programmatically. Users must type it
                manually.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
