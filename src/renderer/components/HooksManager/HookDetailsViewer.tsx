/**
 * HookDetailsViewer - Read-only display of hook configuration
 *
 * Shows hook details with syntax highlighting and validation
 */

import type { HookWithMetadata } from '@/shared/types/hook.types';
import { HookValidationPanel } from './HookValidationPanel';
import { useOpenSettingsFile } from '@/renderer/hooks/useHooks';
import './HooksManager.css';

interface HookDetailsViewerProps {
  hook: HookWithMetadata;
  className?: string;
}

export function HookDetailsViewer({ hook, className }: HookDetailsViewerProps) {
  const openSettingsFile = useOpenSettingsFile();

  const handleOpenSettings = () => {
    // Map 'local' to 'project' for opening settings file
    const location = hook.location === 'local' ? 'project' : hook.location;
    openSettingsFile.mutate({
      location: location as 'user' | 'project',
    });
  };

  return (
    <div className={className}>
      <div className="card">
        <div className="card-header">
          <div className="hook-event-card">
            <div className="hook-event-info">
              <h4 className="card-title">
                {hook.event} Hook #{hook.hookIndex + 1}
              </h4>
              <p className="card-description" style={{ marginTop: '0.25rem' }}>
                {hook.configuration.matcher ? (
                  <>
                    Matches tools: <code style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{hook.configuration.matcher}</code>
                  </>
                ) : (
                  'Applies to all tool invocations'
                )}
              </p>
            </div>
            <div className="hook-event-badges">
              <span className="badge badge-outline">
                {hook.location}
              </span>
              <span className={`badge ${hook.hook.type === 'command' ? 'badge-default' : 'badge-secondary'}`}>
                {hook.hook.type}
              </span>
            </div>
          </div>
        </div>

        <div className="card-content">
          {/* Hook Configuration */}
          <div>
            <h4 className="card-description" style={{ marginBottom: '0.5rem' }}>Configuration</h4>
            <div className="code-block">
              <pre>{JSON.stringify(hook.hook, null, 2)}</pre>
            </div>
          </div>

          {/* Command/Prompt Content */}
          {hook.hook.command && (
            <div style={{ marginTop: '1rem' }}>
              <h4 className="card-description" style={{ marginBottom: '0.5rem' }}>Bash Command</h4>
              <div className="code-block-dark">
                <code style={{ whiteSpace: 'pre-wrap' }}>
                  {hook.hook.command}
                </code>
              </div>
            </div>
          )}

          {hook.hook.prompt && (
            <div style={{ marginTop: '1rem' }}>
              <h4 className="card-description" style={{ marginBottom: '0.5rem' }}>LLM Prompt</h4>
              <div className="code-block" style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                {hook.hook.prompt}
              </div>
            </div>
          )}

          {/* Timeout */}
          {hook.hook.timeout && (
            <div style={{ marginTop: '1rem' }}>
              <h4 className="card-description" style={{ marginBottom: '0.5rem' }}>Timeout</h4>
              <p className="card-description">
                {hook.hook.timeout} seconds
              </p>
            </div>
          )}

          {/* Validation Results */}
          <div style={{ marginTop: '1rem' }}>
            <HookValidationPanel validation={hook.validation} />
          </div>

          {/* Actions */}
          <div className="template-actions" style={{ borderTop: '1px solid #e5e7eb', marginTop: '0.5rem' }}>
            <button
              className="button button-outline"
              onClick={handleOpenSettings}
              disabled={openSettingsFile.isPending}
            >
              📝 Edit in settings.json
            </button>

            <button
              className="button button-ghost"
              onClick={() => {
                window.electronAPI.openExternal('https://code.claude.com/docs/en/hooks');
              }}
            >
              🔗 View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
