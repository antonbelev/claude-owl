/**
 * Add Server Form Component
 * Form to add a new MCP server
 */

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import type { MCPTransport, MCPScope, AddMCPServerRequest } from '@/shared/types/mcp.types';

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
    <form className="max-w-2xl space-y-6" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-neutral-900">Add MCP Server</h2>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Server Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Server Name <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g., sequential-thinking"
          required
        />
        <p className="text-sm text-neutral-600">Lowercase with hyphens, no special characters</p>
      </div>

      {/* Transport Type (P0) */}
      <div className="space-y-2">
        <Label>
          Transport Type <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            className={`p-4 border rounded-lg transition-colors ${
              transport === 'stdio'
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-neutral-300 hover:border-neutral-400'
            }`}
            onClick={() => setTransport('stdio')}
          >
            <div className="font-medium">Stdio</div>
            <div className="text-xs text-neutral-600">Standard input/output</div>
          </button>
          <button
            type="button"
            className={`p-4 border rounded-lg transition-colors ${
              transport === 'http'
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-neutral-300 hover:border-neutral-400'
            }`}
            onClick={() => setTransport('http')}
          >
            <div className="font-medium">HTTP</div>
            <div className="text-xs text-neutral-600">HTTP-based</div>
          </button>
          <button
            type="button"
            className={`p-4 border rounded-lg transition-colors ${
              transport === 'sse'
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-neutral-300 hover:border-neutral-400'
            }`}
            onClick={() => setTransport('sse')}
          >
            <div className="font-medium">SSE</div>
            <div className="text-xs text-neutral-600">Server-Sent Events</div>
          </button>
        </div>
      </div>

      {/* Scope (P0) */}
      <div className="space-y-2">
        <Label htmlFor="scope">
          Scope <span className="text-red-500">*</span>
        </Label>
        <select
          id="scope"
          value={scope}
          onChange={e => setScope(e.target.value as MCPScope)}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="user">User (Global config)</option>
          <option value="project">Project (Project config)</option>
          <option value="local">Local (Local overrides)</option>
        </select>
        <p className="text-sm text-neutral-600">
          Where to save the server configuration. User = global, Project = project-level, Local =
          local overrides.
        </p>
      </div>

      {/* Stdio-specific fields */}
      {transport === 'stdio' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="command">
              Command <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="command"
              value={command}
              onChange={e => setCommand(e.target.value)}
              placeholder="e.g., npx"
              required={transport === 'stdio'}
            />
            <p className="text-sm text-neutral-600">Executable command to run</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="args">Arguments</Label>
            <Input
              type="text"
              id="args"
              value={args}
              onChange={e => setArgs(e.target.value)}
              placeholder="e.g., -y @modelcontextprotocol/server-sequential-thinking"
            />
            <p className="text-sm text-neutral-600">Space-separated command arguments</p>
          </div>
        </>
      )}

      {/* HTTP/SSE-specific fields */}
      {(transport === 'http' || transport === 'sse') && (
        <div className="space-y-2">
          <Label htmlFor="url">
            URL <span className="text-red-500">*</span>
          </Label>
          <Input
            type="url"
            id="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/mcp"
            required={transport === 'http' || transport === 'sse'}
          />
          <p className="text-sm text-neutral-600">Server endpoint URL</p>
        </div>
      )}

      {/* Environment Variables (P1) */}
      <div className="space-y-2">
        <Label>Environment Variables (Optional)</Label>
        <div className="space-y-2">
          {envVars.map((envVar, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="text"
                placeholder="KEY"
                value={envVar.key}
                onChange={e => updateEnvVar(index, 'key', e.target.value)}
                className="flex-1"
              />
              <Input
                type="text"
                placeholder="value"
                value={envVar.value}
                onChange={e => updateEnvVar(index, 'value', e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeEnvVar(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addEnvVar} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Environment Variable
          </Button>
        </div>
        <p className="text-sm text-neutral-600">
          Environment variables to pass to the server (e.g., API keys)
        </p>
      </div>

      {/* HTTP Headers (P1, only for HTTP/SSE) */}
      {(transport === 'http' || transport === 'sse') && (
        <div className="space-y-2">
          <Label>HTTP Headers (Optional)</Label>
          <div className="space-y-2">
            {headers.map((header, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Header-Name"
                  value={header.key}
                  onChange={e => updateHeader(index, 'key', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="text"
                  placeholder="value"
                  value={header.value}
                  onChange={e => updateHeader(index, 'value', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeHeader(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addHeader} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Header
            </Button>
          </div>
          <p className="text-sm text-neutral-600">
            Custom HTTP headers (e.g., Authorization: Bearer TOKEN)
          </p>
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Adding...' : 'Add Server'}
        </Button>
      </div>
    </form>
  );
};
