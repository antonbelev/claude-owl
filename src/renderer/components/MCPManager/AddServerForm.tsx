/**
 * Add Server Form Component
 * Form to add a new MCP server
 */

import React, { useState } from 'react';
import type { MCPTransport, MCPScope, AddMCPServerRequest } from '@/shared/types/mcp.types';
import './MCPManager.css';

export interface AddServerFormProps {
  onSubmit: (request: AddMCPServerRequest) => Promise<void>;
  onCancel: () => void;
}

export const AddServerForm: React.FC<AddServerFormProps> = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [transport, setTransport] = useState<MCPTransport>('stdio');
  const [scope, setScope] = useState<MCPScope>('user');
  const [command, setCommand] = useState('');
  const [args, setArgs] = useState('');
  const [url, setUrl] = useState('');
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([]);
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate form
      if (!name.trim()) {
        throw new Error('Server name is required');
      }

      if (transport === 'stdio' && !command.trim()) {
        throw new Error('Command is required for stdio transport');
      }

      if ((transport === 'http' || transport === 'sse') && !url.trim()) {
        throw new Error('URL is required for HTTP/SSE transport');
      }

      // Build request
      const request: AddMCPServerRequest = {
        name: name.trim(),
        transport,
        scope,
      };

      // Add stdio-specific fields
      if (transport === 'stdio') {
        request.command = command.trim();
        if (args.trim()) {
          request.args = args.split(/\s+/).filter(arg => arg.length > 0);
        }
      }

      // Add HTTP/SSE-specific fields
      if (transport === 'http' || transport === 'sse') {
        request.url = url.trim();
      }

      // Add environment variables (P1)
      const envObj = envVars.reduce(
        (acc, { key, value }) => {
          if (key.trim()) {
            acc[key.trim()] = value;
          }
          return acc;
        },
        {} as Record<string, string>
      );
      if (Object.keys(envObj).length > 0) {
        request.env = envObj;
      }

      // Add headers (P1, only for HTTP/SSE)
      if (transport === 'http' || transport === 'sse') {
        const headersObj = headers.reduce(
          (acc, { key, value }) => {
            if (key.trim()) {
              acc[key.trim()] = value;
            }
            return acc;
          },
          {} as Record<string, string>
        );
        if (Object.keys(headersObj).length > 0) {
          request.headers = headersObj;
        }
      }

      await onSubmit(request);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...envVars];
    if (updated[index]) {
      updated[index][field] = value;
    }
    setEnvVars(updated);
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...headers];
    if (updated[index]) {
      updated[index][field] = value;
    }
    setHeaders(updated);
  };

  return (
    <form className="add-server-form" onSubmit={handleSubmit}>
      <h2>Add MCP Server</h2>

      {error && <div className="error-message">{error}</div>}

      {/* Server Name */}
      <div className="form-group">
        <label htmlFor="name">
          Server Name <span className="required">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g., sequential-thinking"
          required
        />
        <small>Lowercase with hyphens, no special characters</small>
      </div>

      {/* Transport Type (P0) */}
      <div className="form-group">
        <label>
          Transport Type <span className="required">*</span>
        </label>
        <div className="transport-selector">
          <button
            type="button"
            className={`transport-option ${transport === 'stdio' ? 'active' : ''}`}
            onClick={() => setTransport('stdio')}
          >
            <span className="transport-name">Stdio</span>
            <span className="transport-desc">Standard input/output</span>
          </button>
          <button
            type="button"
            className={`transport-option ${transport === 'http' ? 'active' : ''}`}
            onClick={() => setTransport('http')}
          >
            <span className="transport-name">HTTP</span>
            <span className="transport-desc">HTTP-based</span>
          </button>
          <button
            type="button"
            className={`transport-option ${transport === 'sse' ? 'active' : ''}`}
            onClick={() => setTransport('sse')}
          >
            <span className="transport-name">SSE</span>
            <span className="transport-desc">Server-Sent Events</span>
          </button>
        </div>
      </div>

      {/* Scope (P0) */}
      <div className="form-group">
        <label htmlFor="scope">
          Scope <span className="required">*</span>
        </label>
        <select id="scope" value={scope} onChange={e => setScope(e.target.value as MCPScope)}>
          <option value="user">User (Global config)</option>
          <option value="project">Project (Project config)</option>
          <option value="local">Local (Local overrides)</option>
        </select>
        <small>
          Where to save the server configuration. User = global, Project = project-level, Local =
          local overrides.
        </small>
      </div>

      {/* Stdio-specific fields */}
      {transport === 'stdio' && (
        <>
          <div className="form-group">
            <label htmlFor="command">
              Command <span className="required">*</span>
            </label>
            <input
              type="text"
              id="command"
              value={command}
              onChange={e => setCommand(e.target.value)}
              placeholder="e.g., npx"
              required={transport === 'stdio'}
            />
            <small>Executable command to run</small>
          </div>

          <div className="form-group">
            <label htmlFor="args">Arguments</label>
            <input
              type="text"
              id="args"
              value={args}
              onChange={e => setArgs(e.target.value)}
              placeholder="e.g., -y @modelcontextprotocol/server-sequential-thinking"
            />
            <small>Space-separated command arguments</small>
          </div>
        </>
      )}

      {/* HTTP/SSE-specific fields */}
      {(transport === 'http' || transport === 'sse') && (
        <div className="form-group">
          <label htmlFor="url">
            URL <span className="required">*</span>
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/mcp"
            required={transport === 'http' || transport === 'sse'}
          />
          <small>Server endpoint URL</small>
        </div>
      )}

      {/* Environment Variables (P1) */}
      <div className="form-group">
        <label>Environment Variables (Optional)</label>
        {envVars.map((envVar, index) => (
          <div key={index} className="key-value-row">
            <input
              type="text"
              placeholder="KEY"
              value={envVar.key}
              onChange={e => updateEnvVar(index, 'key', e.target.value)}
            />
            <input
              type="text"
              placeholder="value"
              value={envVar.value}
              onChange={e => updateEnvVar(index, 'value', e.target.value)}
            />
            <button type="button" className="btn btn-danger-sm" onClick={() => removeEnvVar(index)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-secondary" onClick={addEnvVar}>
          + Add Environment Variable
        </button>
        <small>Environment variables to pass to the server (e.g., API keys)</small>
      </div>

      {/* HTTP Headers (P1, only for HTTP/SSE) */}
      {(transport === 'http' || transport === 'sse') && (
        <div className="form-group">
          <label>HTTP Headers (Optional)</label>
          {headers.map((header, index) => (
            <div key={index} className="key-value-row">
              <input
                type="text"
                placeholder="Header-Name"
                value={header.key}
                onChange={e => updateHeader(index, 'key', e.target.value)}
              />
              <input
                type="text"
                placeholder="value"
                value={header.value}
                onChange={e => updateHeader(index, 'value', e.target.value)}
              />
              <button
                type="button"
                className="btn btn-danger-sm"
                onClick={() => removeHeader(index)}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={addHeader}>
            + Add Header
          </button>
          <small>Custom HTTP headers (e.g., Authorization: Bearer TOKEN)</small>
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Server'}
        </button>
      </div>
    </form>
  );
};
