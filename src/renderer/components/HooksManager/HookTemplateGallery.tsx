/**
 * HookTemplateGallery - Browse and copy hook templates
 *
 * Displays security-reviewed templates with copy-to-clipboard functionality
 */

import { useState } from 'react';
import type { HookTemplate } from '@/shared/types/hook.types';
import { useHookTemplates } from '@/renderer/hooks/useHooks';
import './HooksManager.css';

const CATEGORY_ICONS: Record<string, string> = {
  security: '🛡️',
  automation: '⚡',
  logging: '📝',
  notification: '🔔',
};

const CATEGORY_COLORS: Record<string, string> = {
  security: 'category-security',
  automation: 'category-automation',
  logging: 'category-logging',
  notification: 'category-notification',
};

export function HookTemplateGallery() {
  const { data: templates, isLoading, isError } = useHookTemplates();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleCopyTemplate = async (template: HookTemplate) => {
    const jsonConfig = JSON.stringify(template.configuration, null, 2);

    // Copy JSON configuration to clipboard
    await navigator.clipboard.writeText(jsonConfig);

    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyScript = async (template: HookTemplate) => {
    if (!template.scriptContent) return;

    await navigator.clipboard.writeText(template.scriptContent);

    setCopiedId(`${template.id}-script`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: '100px' }} />
        ))}
      </div>
    );
  }

  if (isError || !templates) {
    return (
      <div className="error-card">
        <p className="error-message">
          Failed to load templates
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="template-header">
        <div>
          <h2 className="template-title">Hook Templates</h2>
          <p className="template-subtitle">
            Pre-built, security-reviewed hooks for common use cases
          </p>
        </div>
        <span className="badge badge-outline">
          {templates.length} templates
        </span>
      </div>

      <div className="template-grid">
        {templates.map((template) => {
          const categoryIcon = CATEGORY_ICONS[template.category] || '📦';
          const categoryColor = CATEGORY_COLORS[template.category] || 'badge-secondary';
          const isExpanded = expandedIds.has(template.id);

          return (
            <div key={template.id} className="card">
              <div className="card-header">
                <div className="template-card-header">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <h3 className="card-title">{template.name}</h3>
                      <span className={`badge ${template.securityLevel === 'green' ? 'badge-green' : 'badge-yellow'}`}>
                        {template.securityLevel === 'green' ? '✓ Safe' : '⚠ Review'}
                      </span>
                    </div>
                    <p className="card-description">{template.description}</p>
                  </div>
                  <div className={`template-icon-wrapper ${categoryColor}`}>
                    <span className="template-icon">{categoryIcon}</span>
                  </div>
                </div>

                <div className="hook-event-badges">
                  <span className="badge badge-outline">
                    {template.event}
                  </span>
                  <span className="badge badge-outline" style={{ textTransform: 'capitalize' }}>
                    {template.category}
                  </span>
                </div>
              </div>

              <div className="card-content">
                {/* Configuration Preview */}
                <div>
                  <button
                    className="collapsible-trigger"
                    style={{ marginBottom: '0.5rem' }}
                    onClick={() => toggleExpand(template.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span className="card-description" style={{ fontWeight: 500 }}>Configuration</span>
                      <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                        ➤
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="code-block">
                      <pre>{JSON.stringify(template.configuration, null, 2)}</pre>
                    </div>
                  )}
                </div>

                {/* Script Path */}
                {template.scriptPath && (
                  <div className="card-description">
                    <span style={{ fontWeight: 500 }}>Script path:</span>{' '}
                    <code className="code-block" style={{ display: 'inline', padding: '0.125rem 0.25rem' }}>{template.scriptPath}</code>
                  </div>
                )}

                {/* Actions */}
                <div className="template-actions">
                  <button
                    className="button button-primary"
                    style={{ flex: 1, gap: '0.5rem' }}
                    onClick={() => handleCopyTemplate(template)}
                  >
                    {copiedId === template.id ? (
                      <>
                        <span>✓</span>
                        Copied!
                      </>
                    ) : (
                      <>
                        <span>📋</span>
                        Copy Configuration
                      </>
                    )}
                  </button>

                  {template.scriptContent && (
                    <button
                      className="button button-outline"
                      style={{ gap: '0.5rem' }}
                      onClick={() => handleCopyScript(template)}
                    >
                      {copiedId === `${template.id}-script` ? (
                        <>
                          <span>✓</span>
                          Copied!
                        </>
                      ) : (
                        <>
                          <span>📋</span>
                          Copy Script
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Usage Note */}
                <p className="template-usage-note">
                  💡 Copy the configuration and paste it into your settings.json file
                  {template.scriptContent && ' (and save the script to the specified path)'}.
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
