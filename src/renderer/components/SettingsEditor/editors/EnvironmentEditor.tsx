import React, { useState } from 'react';

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
    <div className="environment-editor">
      <div className="editor-intro">
        <p>
          Environment variables are available to Claude and can be used to configure models, API
          keys, and other settings. Common variables include <code>ANTHROPIC_API_KEY</code>,{' '}
          <code>ANTHROPIC_MODEL</code>, etc.
        </p>
      </div>

      <div className="editor-section">
        <h3>Environment Variables ({entries.length})</h3>

        {entries.length === 0 ? (
          <p className="empty-message">No environment variables configured</p>
        ) : (
          <div className="env-variables-list">
            {entries.map(([key, value]) => (
              <div key={key} className="env-variable-item">
                <div className="env-variable-key">
                  <code>{key}</code>
                </div>
                <div className="env-variable-value">
                  {readOnly ? (
                    <div className="readonly-value">
                      {showValues[key] ? (
                        <code>{value}</code>
                      ) : (
                        <code>{'•'.repeat(Math.min(value.length, 20))}</code>
                      )}
                    </div>
                  ) : (
                    <input
                      type={showValues[key] ? 'text' : 'password'}
                      value={value}
                      onChange={e => updateVariable(key, e.target.value)}
                      className="env-input"
                    />
                  )}
                </div>
                <div className="env-variable-actions">
                  <button
                    onClick={() => toggleShowValue(key)}
                    className="btn-icon"
                    title={showValues[key] ? 'Hide value' : 'Show value'}
                  >
                    {showValues[key] ? '👁️' : '👁️‍🗨️'}
                  </button>
                  {!readOnly && (
                    <button
                      onClick={() => removeVariable(key)}
                      className="btn-icon btn-remove"
                      title="Remove variable"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="editor-section">
          <h3>Add New Variable</h3>
          <div className="add-variable-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="envKey">Variable Name</label>
                <input
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
                  className="env-key-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="envValue">Value</label>
                <input
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
                  className="env-value-input"
                />
              </div>
            </div>
            <button onClick={addVariable} className="btn-add" disabled={!newKey.trim()}>
              Add Variable
            </button>
          </div>
        </div>
      )}

      <div className="editor-section">
        <h3>Common Environment Variables</h3>
        <div className="common-vars-help">
          <details>
            <summary>Authentication</summary>
            <ul>
              <li>
                <code>ANTHROPIC_API_KEY</code> - Your Anthropic API key
              </li>
              <li>
                <code>ANTHROPIC_AUTH_TOKEN</code> - Authentication token
              </li>
              <li>
                <code>AWS_BEARER_TOKEN_BEDROCK</code> - AWS Bedrock bearer token
              </li>
            </ul>
          </details>

          <details>
            <summary>Model Configuration</summary>
            <ul>
              <li>
                <code>ANTHROPIC_MODEL</code> - Override default model
              </li>
              <li>
                <code>ANTHROPIC_DEFAULT_HAIKU_MODEL</code> - Default Haiku model
              </li>
              <li>
                <code>ANTHROPIC_DEFAULT_OPUS_MODEL</code> - Default Opus model
              </li>
              <li>
                <code>ANTHROPIC_DEFAULT_SONNET_MODEL</code> - Default Sonnet model
              </li>
              <li>
                <code>MAX_THINKING_TOKENS</code> - Enable extended thinking
              </li>
            </ul>
          </details>

          <details>
            <summary>Bash Execution</summary>
            <ul>
              <li>
                <code>BASH_DEFAULT_TIMEOUT_MS</code> - Default timeout for bash commands
              </li>
              <li>
                <code>BASH_MAX_OUTPUT_LENGTH</code> - Maximum output length
              </li>
              <li>
                <code>BASH_MAX_TIMEOUT_MS</code> - Maximum allowed timeout
              </li>
            </ul>
          </details>

          <details>
            <summary>Feature Toggles</summary>
            <ul>
              <li>
                <code>DISABLE_TELEMETRY</code> - Disable telemetry
              </li>
              <li>
                <code>DISABLE_ERROR_REPORTING</code> - Disable error reporting
              </li>
              <li>
                <code>DISABLE_AUTOUPDATER</code> - Disable automatic updates
              </li>
              <li>
                <code>DISABLE_COST_WARNINGS</code> - Disable cost warnings
              </li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
};
