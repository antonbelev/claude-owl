import React, { useState, useEffect, useCallback } from 'react';
import type { PermissionRule, ToolType, PermissionLevel } from '@/shared/types';
import { TOOL_PATTERN_HELP, TOOLS_WITHOUT_PATTERNS } from '@/shared/types/permissions.types';
import { usePermissionRules } from '../../../../hooks/usePermissionRules';

interface RuleEditorModalProps {
  rule?: PermissionRule; // If provided, we're editing; otherwise creating
  onSave: (rule: Omit<PermissionRule, 'id'>) => void;
  onCancel: () => void;
}

const TOOLS: ToolType[] = [
  'Bash',
  'Read',
  'Edit',
  'Write',
  'WebFetch',
  'WebSearch',
  'NotebookEdit',
  'SlashCommand',
];

export const RuleEditorModal: React.FC<RuleEditorModalProps> = ({ rule, onSave, onCancel }) => {
  const { validateRule, validatePattern } = usePermissionRules();

  const [tool, setTool] = useState<ToolType>(rule?.tool || 'Bash');
  const [pattern, setPattern] = useState(rule?.pattern || '');
  const [level, setLevel] = useState<PermissionLevel>(rule?.level || 'allow');
  const [description, setDescription] = useState(rule?.description || '');
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
    warnings?: string[];
    examples?: string[];
  } | null>(null);

  const requiresPattern = !TOOLS_WITHOUT_PATTERNS.includes(tool);
  const helpText = TOOL_PATTERN_HELP[tool];

  // Close modal on ESC key
  const handleEscKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [handleEscKey]);

  // Validate pattern when it changes
  useEffect(() => {
    const validate = async () => {
      if (pattern) {
        const result = await validatePattern(tool, pattern);
        setValidationResult(result);
      } else if (requiresPattern) {
        setValidationResult({
          valid: false,
          error: `${tool} typically requires a pattern`,
        });
      } else {
        setValidationResult({ valid: true });
      }
    };

    validate();
  }, [tool, pattern, requiresPattern, validatePattern]);

  const handleSave = async () => {
    // Build rule object conditionally
    const ruleToValidate: Omit<PermissionRule, 'id'> = {
      tool,
      level,
      createdFrom: rule?.createdFrom || 'custom',
    };

    if (pattern) {
      ruleToValidate.pattern = pattern;
    }

    if (description) {
      ruleToValidate.description = description;
    }

    // Final validation
    const finalValidation = await validateRule(ruleToValidate);

    if (finalValidation && !finalValidation.valid) {
      alert(`Validation failed: ${finalValidation.error}`);
      return;
    }

    onSave(ruleToValidate);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{rule ? 'Edit Permission Rule' : 'Create Permission Rule'}</h2>
          <button onClick={onCancel} className="btn-close">
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Permission Level */}
          <div className="form-group">
            <label>Permission Level</label>
            <div className="permission-level-selector">
              <label className={`level-option level-allow ${level === 'allow' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="level"
                  value="allow"
                  checked={level === 'allow'}
                  onChange={() => setLevel('allow')}
                />
                <span className="level-icon">✅</span>
                <span className="level-label">Allow</span>
              </label>
              <label className={`level-option level-ask ${level === 'ask' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="level"
                  value="ask"
                  checked={level === 'ask'}
                  onChange={() => setLevel('ask')}
                />
                <span className="level-icon">⚠️</span>
                <span className="level-label">Ask</span>
              </label>
              <label className={`level-option level-deny ${level === 'deny' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="level"
                  value="deny"
                  checked={level === 'deny'}
                  onChange={() => setLevel('deny')}
                />
                <span className="level-icon">🚫</span>
                <span className="level-label">Deny</span>
              </label>
            </div>
          </div>

          {/* Tool Type */}
          <div className="form-group">
            <label htmlFor="tool">Tool Type</label>
            <select id="tool" value={tool} onChange={e => setTool(e.target.value as ToolType)}>
              {TOOLS.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {helpText && <p className="form-help">ℹ️ {helpText}</p>}
          </div>

          {/* Pattern */}
          <div className="form-group">
            <label htmlFor="pattern">
              Pattern {requiresPattern && <span className="required">*</span>}
            </label>
            <input
              id="pattern"
              type="text"
              value={pattern}
              onChange={e => setPattern(e.target.value)}
              placeholder={
                tool === 'Bash'
                  ? 'e.g., npm run test'
                  : tool === 'Read' || tool === 'Edit' || tool === 'Write'
                    ? 'e.g., ./src/**/*.ts'
                    : tool === 'WebFetch'
                      ? 'e.g., domain:anthropic.com'
                      : 'Pattern...'
              }
            />

            {/* Validation Feedback */}
            {validationResult && (
              <div
                className={`validation-feedback ${validationResult.valid ? 'valid' : 'invalid'}`}
              >
                {validationResult.valid && <span className="validation-icon">✅</span>}
                {!validationResult.valid && validationResult.error && (
                  <span className="validation-error">❌ {validationResult.error}</span>
                )}
                {validationResult.warnings && validationResult.warnings.length > 0 && (
                  <div className="validation-warnings">
                    {validationResult.warnings.map((warning, idx) => (
                      <div key={idx} className="validation-warning">
                        ⚠️ {warning}
                      </div>
                    ))}
                  </div>
                )}
                {validationResult.examples && validationResult.examples.length > 0 && (
                  <div className="validation-examples">
                    <p>📋 Example matches:</p>
                    <ul>
                      {validationResult.examples.map((example, idx) => (
                        <li key={idx}>
                          <code>{example}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief note about this rule..."
            />
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            disabled={validationResult ? !validationResult.valid : false}
          >
            {rule ? 'Save Changes' : 'Create Rule'}
          </button>
        </div>
      </div>
    </div>
  );
};
