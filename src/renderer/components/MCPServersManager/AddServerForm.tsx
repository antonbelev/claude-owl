import React, { useState } from 'react';
import type { AddMCPServerRequest } from '@/shared/types';

interface AddServerFormProps {
  onSubmit: (config: AddMCPServerRequest) => Promise<void>;
  onCancel: () => void;
}

export const AddServerForm: React.FC<AddServerFormProps> = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [transport, setTransport] = useState<'stdio' | 'http' | 'sse'>('stdio');
  const [command, setCommand] = useState('npx');
  const [args, setArgs] = useState('');
  const [url, setUrl] = useState('');
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [envKey, setEnvKey] = useState('');
  const [envValue, setEnvValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Server name is required';
    } else if (!/^[a-z0-9-]+$/.test(name)) {
      errors.name = 'Server name must be lowercase alphanumeric with hyphens only';
    }

    if (transport === 'stdio' && !command.trim()) {
      errors.command = 'Command is required for stdio servers';
    }

    if (transport === 'http' && !url.trim()) {
      errors.url = 'URL is required for HTTP servers';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Add environment variable
   */
  const handleAddEnvVar = () => {
    if (!envKey.trim() || !envValue.trim()) {
      setError('Please enter both key and value');
      return;
    }

    setEnvVars({
      ...envVars,
      [envKey]: envValue,
    });

    setEnvKey('');
    setEnvValue('');
    setError(null);
  };

  /**
   * Remove environment variable
   */
  const handleRemoveEnvVar = (key: string) => {
    const newVars = { ...envVars };
    delete newVars[key];
    setEnvVars(newVars);
  };

  /**
   * Parse arguments string to array
   */
  const parseArgs = (argsString: string): string[] => {
    return argsString
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const config: AddMCPServerRequest = {
        name: name.trim(),
        transport,
      };

      // Add transport-specific fields
      if (transport === 'stdio') {
        config.command = command.trim();
        config.args = parseArgs(args);
      } else if (transport === 'http') {
        config.url = url.trim();
      }

      // Add environment variables if any
      if (Object.keys(envVars).length > 0) {
        config.env = envVars;
      }

      await onSubmit(config);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add server';
      console.error('Form submission error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="add-server-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>Add MCP Server</h2>
        <button type="button" className="btn-close" onClick={onCancel} title="Close">
          ✕
        </button>
      </div>

      {/* Errors */}
      {error && <div className="form-error alert-error">{error}</div>}

      {/* Server Name */}
      <div className="form-group">
        <label className="form-label">
          Server Name <span className="required">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g., sequential-thinking"
          className={`form-input ${validationErrors.name ? 'input-error' : ''}`}
        />
        {validationErrors.name && <p className="field-error">{validationErrors.name}</p>}
      </div>

      {/* Transport Type */}
      <div className="form-group">
        <label className="form-label">
          Transport Type <span className="required">*</span>
        </label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              value="stdio"
              checked={transport === 'stdio'}
              onChange={e => setTransport(e.target.value as typeof transport)}
            />
            Stdio (local process)
          </label>
          <label className="radio-label">
            <input
              type="radio"
              value="http"
              checked={transport === 'http'}
              onChange={e => setTransport(e.target.value as typeof transport)}
            />
            HTTP (remote server)
          </label>
          <label className="radio-label">
            <input
              type="radio"
              value="sse"
              checked={transport === 'sse'}
              onChange={e => setTransport(e.target.value as typeof transport)}
            />
            SSE (deprecated)
          </label>
        </div>
      </div>

      {/* Stdio Config */}
      {transport === 'stdio' && (
        <>
          <div className="form-group">
            <label className="form-label">
              Command <span className="required">*</span>
            </label>
            <input
              type="text"
              value={command}
              onChange={e => setCommand(e.target.value)}
              placeholder="e.g., npx, node, python"
              className={`form-input ${validationErrors.command ? 'input-error' : ''}`}
            />
            <p className="form-hint">Common commands: npx, node, python, python3</p>
            {validationErrors.command && <p className="field-error">{validationErrors.command}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Arguments</label>
            <textarea
              value={args}
              onChange={e => setArgs(e.target.value)}
              placeholder="One argument per line, e.g.:-y&#10;@modelcontextprotocol/server-sequential-thinking"
              className="form-textarea"
              rows={4}
            />
            <p className="form-hint">Each line is treated as one argument</p>
          </div>
        </>
      )}

      {/* HTTP Config */}
      {transport === 'http' && (
        <div className="form-group">
          <label className="form-label">
            Server URL <span className="required">*</span>
          </label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://mcp.example.com/mcp"
            className={`form-input ${validationErrors.url ? 'input-error' : ''}`}
          />
          {validationErrors.url && <p className="field-error">{validationErrors.url}</p>}
        </div>
      )}

      {/* Environment Variables */}
      <div className="form-group">
        <label className="form-label">Environment Variables</label>

        {/* Existing variables */}
        {Object.entries(envVars).length > 0 && (
          <div className="env-vars-list">
            {Object.entries(envVars).map(([key]) => (
              <div key={key} className="env-var-item">
                <div className="env-var-display">
                  <span className="env-key">{key}</span>
                  <span className="env-value">••••••••••••••••</span>
                </div>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => handleRemoveEnvVar(key)}
                  title="Remove variable"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new variable */}
        <div className="add-env-var">
          <input
            type="text"
            value={envKey}
            onChange={e => setEnvKey(e.target.value)}
            placeholder="Variable name (e.g., API_KEY)"
            className="form-input"
          />
          <input
            type="password"
            value={envValue}
            onChange={e => setEnvValue(e.target.value)}
            placeholder="Variable value"
            className="form-input"
          />
          <button type="button" className="btn-secondary" onClick={handleAddEnvVar}>
            Add
          </button>
        </div>
      </div>

      {/* Note: Servers are always stored in user-level config */}
      <div
        className="form-group"
        style={{ backgroundColor: '#f0f0f0', padding: '1rem', borderRadius: '6px' }}
      >
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
          ℹ️ MCP servers are managed globally at the user level (~/.claude/mcp-servers.json) and
          available to all your projects.
        </p>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#6c757d' }}>
          For project-specific MCP servers, edit your project&apos;s .mcp.json directly.
        </p>
      </div>

      {/* Buttons */}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Adding...' : 'Add Server'}
        </button>
      </div>
    </form>
  );
};
