import React, { useState } from 'react';
import { useLevelSettings } from '../../hooks/useSettings';
import type { ConfigLevel } from '@/shared/types';
import { PermissionsEditor } from './editors/PermissionsEditor';
import { EnvironmentEditor } from './editors/EnvironmentEditor';
import { CoreConfigEditor } from './editors/CoreConfigEditor';

interface SettingsHierarchyTabProps {
  level: ConfigLevel;
}

type EditorSection = 'core' | 'permissions' | 'environment' | 'sandbox' | 'hooks' | 'plugins' | 'raw';

export const SettingsHierarchyTab: React.FC<SettingsHierarchyTabProps> = ({ level }) => {
  const { settings, loading, error, hasChanges, updateSettings, save, discard, validate } = useLevelSettings(level);
  const [activeSection, setActiveSection] = useState<EditorSection>('core');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isReadOnly = level === 'managed';

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);

    // Validate before saving
    const validationResult = await validate();
    if (validationResult && !validationResult.valid) {
      setSaveError(`Validation errors: ${validationResult.errors.map(e => e.message).join(', ')}`);
      return;
    }

    const success = await save();
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError('Failed to save settings');
    }
  };

  if (loading) {
    return (
      <div className="settings-hierarchy-tab">
        <p>Loading {level} settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-hierarchy-tab">
        <p className="error-message">Error: {error}</p>
      </div>
    );
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'core':
        return <CoreConfigEditor settings={settings} updateSettings={updateSettings} readOnly={isReadOnly} />;
      case 'permissions':
        return (
          <PermissionsEditor
            permissions={settings.permissions || {}}
            updatePermissions={(permissions) => updateSettings({ permissions })}
            readOnly={isReadOnly}
          />
        );
      case 'environment':
        return (
          <EnvironmentEditor
            env={settings.env || {}}
            updateEnv={(env) => updateSettings({ env })}
            readOnly={isReadOnly}
          />
        );
      case 'raw':
        return (
          <div className="raw-editor">
            <textarea
              value={JSON.stringify(settings, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateSettings(parsed);
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              readOnly={isReadOnly}
              className="raw-json-editor"
              rows={25}
            />
          </div>
        );
      default:
        return (
          <div className="coming-soon">
            <p>This section is coming soon!</p>
          </div>
        );
    }
  };

  return (
    <div className="settings-hierarchy-tab">
      <div className="tab-header">
        <div className="tab-info">
          <h2>{level.charAt(0).toUpperCase() + level.slice(1)} Settings</h2>
          {isReadOnly && <span className="readonly-badge">Read Only</span>}
        </div>
        {!isReadOnly && (
          <div className="tab-actions">
            {hasChanges && (
              <>
                <button onClick={discard} className="btn-secondary">
                  Discard Changes
                </button>
                <button onClick={handleSave} className="btn-primary">
                  Save Settings
                </button>
              </>
            )}
            {saveSuccess && <span className="save-success">✓ Saved successfully</span>}
            {saveError && <span className="save-error">{saveError}</span>}
          </div>
        )}
      </div>

      <div className="section-nav">
        <button
          className={`section-btn ${activeSection === 'core' ? 'active' : ''}`}
          onClick={() => setActiveSection('core')}
        >
          Core Config
        </button>
        <button
          className={`section-btn ${activeSection === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveSection('permissions')}
        >
          Permissions
        </button>
        <button
          className={`section-btn ${activeSection === 'environment' ? 'active' : ''}`}
          onClick={() => setActiveSection('environment')}
        >
          Environment
        </button>
        <button
          className={`section-btn ${activeSection === 'sandbox' ? 'active' : ''}`}
          onClick={() => setActiveSection('sandbox')}
        >
          Sandbox
        </button>
        <button
          className={`section-btn ${activeSection === 'hooks' ? 'active' : ''}`}
          onClick={() => setActiveSection('hooks')}
        >
          Hooks
        </button>
        <button
          className={`section-btn ${activeSection === 'plugins' ? 'active' : ''}`}
          onClick={() => setActiveSection('plugins')}
        >
          Plugins
        </button>
        <button
          className={`section-btn ${activeSection === 'raw' ? 'active' : ''}`}
          onClick={() => setActiveSection('raw')}
        >
          Raw JSON
        </button>
      </div>

      <div className="section-content">{renderSectionContent()}</div>
    </div>
  );
};
