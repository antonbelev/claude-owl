import React, { useState } from 'react';
import { X, Plus, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
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
        scope: 'user', // Default to user scope
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
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <h2 className="text-2xl font-bold text-neutral-900">Add MCP Server</h2>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} title="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Errors */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Server Name */}
      <div className="space-y-2">
        <Label>
          Server Name <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g., sequential-thinking"
          className={validationErrors.name ? 'border-red-500' : ''}
        />
        {validationErrors.name && <p className="text-sm text-red-500">{validationErrors.name}</p>}
      </div>

      {/* Transport Type */}
      <div className="space-y-2">
        <Label>
          Transport Type <span className="text-red-500">*</span>
        </Label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="stdio"
              checked={transport === 'stdio'}
              onChange={e => setTransport(e.target.value as typeof transport)}
              className="w-4 h-4"
            />
            <span className="text-sm">Stdio (local process)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="http"
              checked={transport === 'http'}
              onChange={e => setTransport(e.target.value as typeof transport)}
              className="w-4 h-4"
            />
            <span className="text-sm">HTTP (remote server)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="sse"
              checked={transport === 'sse'}
              onChange={e => setTransport(e.target.value as typeof transport)}
              className="w-4 h-4"
            />
            <span className="text-sm">SSE (deprecated)</span>
          </label>
        </div>
      </div>

      {/* Stdio Config */}
      {transport === 'stdio' && (
        <>
          <div className="space-y-2">
            <Label>
              Command <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              value={command}
              onChange={e => setCommand(e.target.value)}
              placeholder="e.g., npx, node, python"
              className={validationErrors.command ? 'border-red-500' : ''}
            />
            <p className="text-sm text-neutral-600">Common commands: npx, node, python, python3</p>
            {validationErrors.command && (
              <p className="text-sm text-red-500">{validationErrors.command}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Arguments</Label>
            <textarea
              value={args}
              onChange={e => setArgs(e.target.value)}
              placeholder="One argument per line, e.g.:&#10;-y&#10;@modelcontextprotocol/server-sequential-thinking"
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
            <p className="text-sm text-neutral-600">Each line is treated as one argument</p>
          </div>
        </>
      )}

      {/* HTTP Config */}
      {transport === 'http' && (
        <div className="space-y-2">
          <Label>
            Server URL <span className="text-red-500">*</span>
          </Label>
          <Input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://mcp.example.com/mcp"
            className={validationErrors.url ? 'border-red-500' : ''}
          />
          {validationErrors.url && <p className="text-sm text-red-500">{validationErrors.url}</p>}
        </div>
      )}

      {/* Environment Variables */}
      <div className="space-y-2">
        <Label>Environment Variables</Label>

        {/* Existing variables */}
        {Object.entries(envVars).length > 0 && (
          <div className="space-y-2 mb-2">
            {Object.entries(envVars).map(([key]) => (
              <div
                key={key}
                className="flex items-center gap-2 p-2 border border-neutral-200 rounded-md"
              >
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-mono text-sm text-neutral-900">{key}</span>
                  <span className="text-neutral-400">••••••••••••••••</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveEnvVar(key)}
                  title="Remove variable"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new variable */}
        <div className="flex gap-2">
          <Input
            type="text"
            value={envKey}
            onChange={e => setEnvKey(e.target.value)}
            placeholder="Variable name (e.g., API_KEY)"
            className="flex-1"
          />
          <Input
            type="password"
            value={envValue}
            onChange={e => setEnvValue(e.target.value)}
            placeholder="Variable value"
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={handleAddEnvVar}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Note: Servers are always stored in user-level config */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <p className="mb-2">
            MCP servers are managed globally at the user level (~/.claude.json) and available to all
            your projects. To manage project-specific servers, use the Claude CLI or select a
            project in a future update.
          </p>
          <p>For project-specific MCP servers, edit your project&apos;s .mcp.json directly.</p>
        </AlertDescription>
      </Alert>

      {/* Buttons */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Adding...' : 'Add Server'}
        </Button>
      </div>
    </form>
  );
};
