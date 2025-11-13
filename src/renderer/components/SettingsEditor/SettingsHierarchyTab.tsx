import React, { useState } from 'react';
import { useLevelSettings } from '../../hooks/useSettings';
import type { ConfigLevel } from '@/shared/types';
import { EnhancedPermissionsEditor } from './editors/PermissionsEditor/EnhancedPermissionsEditor';
import { EnvironmentEditor } from './editors/EnvironmentEditor';
import { CoreConfigEditor } from './editors/CoreConfigEditor';

interface SettingsHierarchyTabProps {
  level: ConfigLevel;
}

type EditorSection =
  | 'core'
  | 'permissions'
  | 'environment'
  | 'sandbox'
  | 'hooks'
  | 'plugins'
  | 'raw';

export const SettingsHierarchyTab: React.FC<SettingsHierarchyTabProps> = ({ level }) => {
  const { settings, loading, error, hasChanges, updateSettings, save, discard, validate } =
    useLevelSettings(level);
  const [activeSection, setActiveSection] = useState<EditorSection>('core');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local state for raw JSON editor
  const [rawJsonText, setRawJsonText] = useState('');
  const [rawJsonError, setRawJsonError] = useState<string | null>(null);

  const isReadOnly = level === 'managed';

  // Update raw JSON text when settings change or section changes
  React.useEffect(() => {
    if (activeSection === 'raw') {
      setRawJsonText(JSON.stringify(settings, null, 2));
      setRawJsonError(null);
    }
  }, [settings, activeSection]);

  const handleDiscard = () => {
    discard();
    // Reset raw JSON text when discarding changes
    if (activeSection === 'raw') {
      setRawJsonText(JSON.stringify(settings, null, 2));
      setRawJsonError(null);
    }
  };

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
        <div className="loading-state">
          <p>Loading {level} settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-hierarchy-tab">
        <div className="error-state">
          <p className="error-message">Error: {error}</p>
        </div>
      </div>
    );
  }

  // Show helpful message if managed settings don't exist
  if (level === 'managed' && !Object.keys(settings).length) {
    return (
      <div className="settings-hierarchy-tab">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <h3>No Managed Settings</h3>
          <p>
            Your organization hasn&apos;t configured any managed policies. Managed settings are
            typically set by IT departments in enterprise environments to enforce security and
            compliance rules.
          </p>
          <p className="empty-hint">
            If you&apos;re part of an organization and expect to see managed settings here, contact
            your IT administrator.
          </p>
        </div>
      </div>
    );
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'core':
        return (
          <CoreConfigEditor
            settings={settings}
            updateSettings={updateSettings}
            readOnly={isReadOnly}
          />
        );
      case 'permissions':
        return (
          <EnhancedPermissionsEditor
            permissions={settings.permissions || {}}
            updatePermissions={permissions => updateSettings({ permissions })}
            readOnly={isReadOnly}
          />
        );
      case 'environment':
        return (
          <EnvironmentEditor
            env={settings.env || {}}
            updateEnv={env => updateSettings({ env })}
            readOnly={isReadOnly}
          />
        );
      case 'raw':
        return (
          <div className="raw-editor">
            <div className="raw-editor-controls">
              <p className="raw-editor-help">
                Edit the JSON below. Changes are applied automatically when the JSON is valid.
              </p>
              {rawJsonError && (
                <div className="raw-editor-error">
                  <span className="error-icon">⚠️</span>
                  <span>{rawJsonError}</span>
                </div>
              )}
              {!rawJsonError && rawJsonText !== JSON.stringify(settings, null, 2) && (
                <div className="raw-editor-warning">
                  <span className="warning-icon">✓</span>
                  <span>Valid JSON - will be applied on save</span>
                </div>
              )}
            </div>
            <textarea
              value={rawJsonText}
              onChange={e => {
                const newValue = e.target.value;
                setRawJsonText(newValue);

                try {
                  const parsed = JSON.parse(newValue);
                  setRawJsonError(null);
                  updateSettings(parsed);
                } catch (err) {
                  setRawJsonError(err instanceof Error ? err.message : 'Invalid JSON');
                }
              }}
              readOnly={isReadOnly}
              className="raw-json-editor"
              rows={25}
              spellCheck={false}
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
                <button onClick={handleDiscard} className="btn-secondary">
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
