import { useRef, useCallback } from 'react';
import './CommandContentEditor.css';

export interface CommandContentEditorProps {
  content: string;
  onChange: (content: string) => void;
  rawMode?: boolean;
  allowedTools?: string[];
}

export function CommandContentEditor({
  content,
  onChange,
  rawMode = false,
  allowedTools = [],
}: CommandContentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = useCallback((variable: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent =
      content.substring(0, start) + variable + content.substring(end);

    onChange(newContent);

    // Move cursor after inserted variable
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
      textarea.focus();
    }, 0);
  }, [content, onChange]);

  const insertBashTemplate = useCallback(() => {
    const template = '!`your-command here`';
    insertVariable(template);
  }, [insertVariable]);

  const insertFileReference = useCallback(() => {
    const template = '@path/to/file';
    insertVariable(template);
  }, [insertVariable]);

  const hasBashTool = allowedTools.some(tool => tool.startsWith('Bash('));

  return (
    <div className="content-editor">
      <div className="editor-toolbar">
        <div className="variable-helpers">
          <span className="toolbar-label">Insert Variable:</span>
          <button
            className="helper-btn"
            onClick={() => insertVariable('$ARGUMENTS')}
            title="All arguments as single string"
          >
            $ARGUMENTS
          </button>
          <button
            className="helper-btn"
            onClick={() => insertVariable('$1')}
            title="First argument"
          >
            $1
          </button>
          <button
            className="helper-btn"
            onClick={() => insertVariable('$2')}
            title="Second argument"
          >
            $2
          </button>
          <button
            className="helper-btn"
            onClick={() => insertVariable('$3')}
            title="Third argument"
          >
            $3
          </button>
        </div>

        <div className="advanced-helpers">
          <span className="toolbar-label">Insert:</span>
          <button
            className="helper-btn"
            onClick={insertBashTemplate}
            title="Insert bash execution template"
            disabled={!hasBashTool && !rawMode}
          >
            ! bash
          </button>
          <button
            className="helper-btn"
            onClick={insertFileReference}
            title="Insert file reference"
          >
            @ file
          </button>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className={`content-textarea ${rawMode ? 'raw-mode' : ''}`}
        placeholder={
          rawMode
            ? `---
description: Your command description
---

Your command content here.

Use $1, $2, etc. for arguments.
Use !` + '`command`' + ` for bash execution.
Use @file for file references.`
            : 'Write your command content here. Use the buttons above to insert variables.'
        }
        spellCheck="false"
      />

      {!rawMode && (
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

          {hasBashTool && (
            <div className="bash-info">
              ✅ Bash execution is enabled (Bash tool configured)
            </div>
          )}
          {!hasBashTool && content.includes('!`') && (
            <div className="bash-warning">
              ⚠️ Your content has bash execution (!`) but Bash tool is not configured
            </div>
          )}
        </div>
      )}
    </div>
  );
}
