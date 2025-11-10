import React, { useEffect, useCallback } from 'react';
import type { PermissionRule } from '@/shared/types';
import { usePermissionRules } from '../../../../hooks/usePermissionRules';

interface RuleTemplatesModalProps {
  onApply: (rules: PermissionRule[]) => void;
  onCancel: () => void;
}

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'security':
      return '#ef4444'; // red
    case 'development':
      return '#3b82f6'; // blue
    case 'deployment':
      return '#8b5cf6'; // purple
    default:
      return '#6b7280'; // gray
  }
};

export const RuleTemplatesModal: React.FC<RuleTemplatesModalProps> = ({ onApply, onCancel }) => {
  const { templates, loadingTemplates, error, loadTemplates, applyTemplate } = usePermissionRules();

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

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleApplyTemplate = async (templateId: string) => {
    const rules = await applyTemplate(templateId);
    if (rules) {
      onApply(rules);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Rule Templates</h2>
          <button onClick={onCancel} className="btn-close">
            ×
          </button>
        </div>

        <div className="modal-body">
          {loadingTemplates && (
            <div className="loading-state">
              <p>Loading templates...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p className="error-message">Error: {error}</p>
            </div>
          )}

          {!loadingTemplates && !error && (
            <div className="templates-grid">
              {templates.map((template) => (
                <div key={template.id} className="template-card">
                  <div className="template-header">
                    <span className="template-icon">{template.icon}</span>
                    <div className="template-title">
                      <h3>{template.name}</h3>
                      <span
                        className="template-category"
                        style={{ backgroundColor: getCategoryColor(template.category) }}
                      >
                        {template.category}
                      </span>
                    </div>
                  </div>

                  <p className="template-description">{template.description}</p>

                  <div className="template-rules-preview">
                    <p className="preview-label">Includes {template.rules.length} rules:</p>
                    <ul className="preview-list">
                      {template.rules.slice(0, 3).map((rule, idx) => (
                        <li key={idx}>
                          <span className={`rule-level-badge level-${rule.level}`}>
                            {rule.level === 'allow' && '✅'}
                            {rule.level === 'ask' && '⚠️'}
                            {rule.level === 'deny' && '🚫'}
                          </span>
                          <code>
                            {rule.tool}
                            {rule.pattern && `(${rule.pattern})`}
                          </code>
                        </li>
                      ))}
                      {template.rules.length > 3 && (
                        <li className="preview-more">...and {template.rules.length - 3} more</li>
                      )}
                    </ul>
                  </div>

                  <button onClick={() => handleApplyTemplate(template.id)} className="btn-primary btn-block">
                    Apply Template
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onCancel} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
