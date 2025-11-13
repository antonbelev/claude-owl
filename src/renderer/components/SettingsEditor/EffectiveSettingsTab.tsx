import React from 'react';
import type { EffectiveConfig } from '@/shared/types';

interface EffectiveSettingsTabProps {
  effectiveConfig: EffectiveConfig | null;
}

export const EffectiveSettingsTab: React.FC<EffectiveSettingsTabProps> = ({ effectiveConfig }) => {
  if (!effectiveConfig) {
    return (
      <div className="effective-settings-tab">
        <p>No settings available</p>
      </div>
    );
  }

  const { merged, sources } = effectiveConfig;

  return (
    <div className="effective-settings-tab">
      <div className="tab-description">
        <p>
          This shows the effective (merged) settings from all levels. Settings are merged in the
          following order: User → Project → Local → Managed (highest priority).
        </p>
      </div>

      <div className="settings-sources">
        <h3>Settings Sources</h3>
        <div className="sources-grid">
          {sources.map(source => (
            <div
              key={source.level}
              className={`source-card ${source.exists ? 'exists' : 'missing'}`}
            >
              <div className="source-header">
                <span className="source-level">{source.level}</span>
                <span className={`source-status ${source.exists ? 'exists' : 'missing'}`}>
                  {source.exists ? '✓ Exists' : '✗ Not found'}
                </span>
              </div>
              <div className="source-path">{source.path}</div>
              {source.exists && (
                <div className="source-keys">
                  {Object.keys(source.content).length} setting
                  {Object.keys(source.content).length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="settings-preview">
        <h3>Merged Settings</h3>
        <div className="json-viewer">
          <pre>{JSON.stringify(merged, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};
