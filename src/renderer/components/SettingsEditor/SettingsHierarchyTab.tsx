import React, { useState } from 'react';
import { Lock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useLevelSettings } from '../../hooks/useSettings';
import type { ConfigLevel } from '@/shared/types';
import { EnhancedPermissionsEditor } from './editors/PermissionsEditor/EnhancedPermissionsEditor';
import { EnvironmentEditor } from './editors/EnvironmentEditor';
import { CoreConfigEditor } from './editors/CoreConfigEditor';
import { Button } from '@/renderer/components/ui/button';
import { Badge } from '@/renderer/components/ui/badge';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import { EmptyState } from '../common/EmptyState';

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
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center p-16 gap-4">
          <p className="text-neutral-600">Loading {level} settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show helpful message if managed settings don't exist
  if (level === 'managed' && !Object.keys(settings).length) {
    return (
      <div className="max-w-6xl mx-auto">
        <EmptyState
          icon={Lock}
          title="No Managed Settings"
          description="Your organization hasn't configured any managed policies. Managed settings are typically set by IT departments in enterprise environments to enforce security and compliance rules. If you're part of an organization and expect to see managed settings here, contact your IT administrator."
        />
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
          <div className="w-full">
            <div className="mb-4">
              <p className="text-sm text-neutral-600 mb-3">
                Edit the JSON below. Changes are applied automatically when the JSON is valid.
              </p>
              {rawJsonError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{rawJsonError}</AlertDescription>
                </Alert>
              )}
              {!rawJsonError && rawJsonText !== JSON.stringify(settings, null, 2) && (
                <Alert variant="default" className="border-success bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertDescription>Valid JSON - will be applied on save</AlertDescription>
                </Alert>
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
              className="w-full p-4 bg-neutral-900 text-neutral-100 border border-neutral-600 rounded-lg font-mono text-sm leading-relaxed resize-y focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              rows={25}
              spellCheck={false}
            />
          </div>
        );
      default:
        return (
          <div className="text-center p-16 text-neutral-400">
            <p>This section is coming soon!</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-neutral-900">
            {level.charAt(0).toUpperCase() + level.slice(1)} Settings
          </h2>
          {isReadOnly && <Badge variant="warning">Read Only</Badge>}
        </div>
        {!isReadOnly && (
          <div className="flex gap-3 items-center">
            {hasChanges && (
              <>
                <Button onClick={handleDiscard} variant="outline" size="sm">
                  Discard Changes
                </Button>
                <Button onClick={handleSave} variant="default" size="sm">
                  Save Settings
                </Button>
              </>
            )}
            {saveSuccess && (
              <span className="text-success text-sm font-medium inline-flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Saved successfully
              </span>
            )}
            {saveError && <span className="text-destructive text-sm">{saveError}</span>}
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-8 flex-wrap">
        <Button
          variant={activeSection === 'core' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('core')}
        >
          Core Config
        </Button>
        <Button
          variant={activeSection === 'permissions' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('permissions')}
        >
          Permissions
        </Button>
        <Button
          variant={activeSection === 'environment' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('environment')}
        >
          Environment
        </Button>
        <Button
          variant={activeSection === 'sandbox' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('sandbox')}
        >
          Sandbox
        </Button>
        <Button
          variant={activeSection === 'hooks' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('hooks')}
        >
          Hooks
        </Button>
        <Button
          variant={activeSection === 'plugins' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('plugins')}
        >
          Plugins
        </Button>
        <Button
          variant={activeSection === 'raw' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('raw')}
        >
          Raw JSON
        </Button>
      </div>

      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8">
        {renderSectionContent()}
      </div>
    </div>
  );
};
