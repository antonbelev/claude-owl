import { useState, useCallback } from 'react';
import { CommandFrontmatter } from '../../../shared/types/command.types';
import {
  parseCommandMarkdown,
  validateCommandMarkdown,
} from '../../../shared/utils/command-markdown.utils';
import './RawMarkdownEditor.css';

export interface RawMarkdownEditorProps {
  markdown: string;
  onSave: (frontmatter: CommandFrontmatter, content: string) => void;
  onCancel: () => void;
}

export function RawMarkdownEditor({ markdown, onSave, onCancel }: RawMarkdownEditorProps) {
  const [editedMarkdown, setEditedMarkdown] = useState(markdown);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSave = useCallback(() => {
    // Validate markdown
    const validation = validateCommandMarkdown(editedMarkdown);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Parse markdown
    const parseResult = parseCommandMarkdown(editedMarkdown);
    if (!parseResult.isValid) {
      setValidationErrors([parseResult.error || 'Failed to parse markdown']);
      return;
    }

    onSave(parseResult.frontmatter, parseResult.content);
  }, [editedMarkdown, onSave]);

  // Validation on change
  const validation = validateCommandMarkdown(editedMarkdown);

  return (
    <div className="raw-editor-overlay" onClick={onCancel}>
      <div className="raw-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <h2>Edit Raw Markdown</h2>
          <button onClick={onCancel} className="modal-close">
            ×
          </button>
        </div>

        <div className="editor-warning">
          ⚠️ Editing raw markdown. Changes won&apos;t sync back to visual form. After saving,
          you&apos;ll return to the review page.
        </div>

        <div className="editor-body">
          <textarea
            value={editedMarkdown}
            onChange={(e) => {
              setEditedMarkdown(e.target.value);
              setValidationErrors([]);
            }}
            className={`raw-textarea ${validation.valid ? '' : 'invalid'}`}
            spellCheck="false"
          />
        </div>

        <div className="editor-validation">
          {validation.valid && (
            <div className="validation-success">
              ✅ Valid markdown
              <br />
              ✅ Frontmatter is valid YAML
              <br />
              ✅ Ready to save
            </div>
          )}

          {!validation.valid && validationErrors.length > 0 && (
            <div className="validation-errors">
              <div className="error-title">❌ Validation Errors:</div>
              <ul>
                {validationErrors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {!validation.valid && validation.errors.length > 0 && validationErrors.length === 0 && (
            <div className="validation-errors">
              <div className="error-title">⚠️ Issues:</div>
              <ul>
                {validation.errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="editor-footer">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            disabled={!validation.valid}
          >
            Save Edits
          </button>
        </div>
      </div>
    </div>
  );
}
