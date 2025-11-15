import React, { useState } from 'react';
import { Input } from '@/renderer/components/ui/input';
import { Button } from '@/renderer/components/ui/button';
import { Label } from '@/renderer/components/ui/label';
import { Eye, EyeOff, X, Plus } from 'lucide-react';

interface EnvironmentEditorProps {
  env: Record<string, string>;
  updateEnv: (env: Record<string, string>) => void;
  readOnly?: boolean;
}

export const EnvironmentEditor: React.FC<EnvironmentEditorProps> = ({
  env,
  updateEnv,
  readOnly = false,
}) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  const addVariable = () => {
    if (!newKey.trim()) return;

    updateEnv({
      ...env,
      [newKey.trim()]: newValue,
    });

    setNewKey('');
    setNewValue('');
  };

  const updateVariable = (key: string, value: string) => {
    updateEnv({
      ...env,
      [key]: value,
    });
  };

  const removeVariable = (key: string) => {
    const newEnv = { ...env };
    delete newEnv[key];
    updateEnv(newEnv);
  };

  const toggleShowValue = (key: string) => {
    setShowValues(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const entries = Object.entries(env);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-neutral-700">
          Environment variables are available to Claude and can be used to configure models, API
          keys, and other settings. Common variables include{' '}
          <code className="bg-white px-1 py-0.5 rounded text-sm">ANTHROPIC_API_KEY</code>,{' '}
          <code className="bg-white px-1 py-0.5 rounded text-sm">ANTHROPIC_MODEL</code>, etc.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Environment Variables ({entries.length})</h3>

        {entries.length === 0 ? (
          <p className="text-neutral-500 italic text-sm">No environment variables configured</p>
        ) : (
          <div className="space-y-2">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-md p-3"
              >
                <div className="min-w-0 flex-shrink-0 w-48">
                  <code className="text-sm font-semibold text-neutral-900">{key}</code>
                </div>
                <div className="flex-1 min-w-0">
                  {readOnly ? (
                    <code className="text-sm text-neutral-700">
                      {showValues[key] ? value : '•'.repeat(Math.min(value.length, 20))}
                    </code>
                  ) : (
                    <Input
                      type={showValues[key] ? 'text' : 'password'}
                      value={value}
                      onChange={e => updateVariable(key, e.target.value)}
                      className="h-8 text-sm font-mono"
                    />
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    onClick={() => toggleShowValue(key)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title={showValues[key] ? 'Hide value' : 'Show value'}
                  >
                    {showValues[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  {!readOnly && (
                    <Button
                      onClick={() => removeVariable(key)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      title="Remove variable"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Add New Variable</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="envKey">Variable Name</Label>
                <Input
                  id="envKey"
                  type="text"
                  value={newKey}
                  onChange={e => setNewKey(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      document.getElementById('envValue')?.focus();
                    }
                  }}
                  placeholder="VARIABLE_NAME"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="envValue">Value</Label>
                <Input
                  id="envValue"
                  type="text"
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      addVariable();
                    }
                  }}
                  placeholder="variable value"
                />
              </div>
            </div>
            <Button onClick={addVariable} disabled={!newKey.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Variable
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Common Environment Variables</h3>
        <div className="space-y-3">
          <details className="bg-neutral-50 border border-neutral-200 rounded-md p-4">
            <summary className="cursor-pointer font-semibold text-neutral-900">
              Authentication
            </summary>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <code className="bg-white px-1 py-0.5 rounded">ANTHROPIC_API_KEY</code> - Your
                Anthropic API key
              </li>
              <li>
                <code className="bg-white px-1 py-0.5 rounded">ANTHROPIC_AUTH_TOKEN</code> -
                Authentication token
              </li>
              <li>
                <code className="bg-white px-1 py-0.5 rounded">AWS_BEARER_TOKEN_BEDROCK</code> - AWS
                Bedrock bearer token
              </li>
            </ul>
          </details>

          <details className="bg-neutral-50 border border-neutral-200 rounded-md p-4">
            <summary className="cursor-pointer font-semibold text-neutral-900">
              Model Configuration
            </summary>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <code className="bg-white px-1 py-0.5 rounded">ANTHROPIC_MODEL</code> - Override
                default model
              </li>
              <li>
                <code className="bg-white px-1 py-0.5 rounded">ANTHROPIC_DEFAULT_HAIKU_MODEL</code>{' '}
                - Default Haiku model
              </li>
              <li>
                <code className="bg-white px-1 py-0.5 rounded">ANTHROPIC_DEFAULT_OPUS_MODEL</code> -
                Default Opus model
              </li>
              <li>
                <code className="bg-white px-1 py-0.5 rounded">ANTHROPIC_DEFAULT_SONNET_MODEL</code>{' '}
                - Default Sonnet model
              </li>
              <li>
                <code className="bg-white px-1 py-0.5 rounded">MAX_THINKING_TOKENS</code> - Enable
                extended thinking
              </li>
            </ul>
          </details>

          <details className="bg-neutral-50 border border-neutral-200 rounded-md p-4">
            <summary className="cursor-pointer font-semibold text-neutral-900">
              Bash Execution
            </summary>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <code className="bg-white px-1 py-0.5 rounded">BASH_DEFAULT_TIMEOUT_MS</code> -
                Default timeout for bash commands
              </li>
              <li>
                <code className="bg-white px-1 py-0.5 rounded">BASH_MAX_OUTPUT_LENGTH</code> -
                Maximum output length
              </li>
              <li>
                <code className="bg-white px-1 py-0.5 rounded">BASH_MAX_TIMEOUT_MS</code> - Maximum
                allowed timeout
              </li>
            </ul>
          </details>

          <details className="bg-neutral-50 border border-neutral-200 rounded-md p-4">
            <summary className="cursor-pointer font-semibold text-neutral-900">
              Feature Toggles
            </summary>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <code className="bg-white px-1 py-0.5 rounded">DISABLE_TELEMETRY</code> - Disable
                telemetry
              </li>
              <li>
                <code className="bg-white px-1 py-0.5 rounded">DISABLE_ERROR_REPORTING</code> -
                Disable error reporting
              </li>
              <li>
                <code className="bg-white px-1 py-0.5 rounded">DISABLE_AUTOUPDATER</code> - Disable
                automatic updates
              </li>
              <li>
                <code className="bg-white px-1 py-0.5 rounded">DISABLE_COST_WARNINGS</code> -
                Disable cost warnings
              </li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
};
