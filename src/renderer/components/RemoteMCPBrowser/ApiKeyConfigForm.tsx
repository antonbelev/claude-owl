/**
 * API Key Configuration Form Component
 *
 * Form for configuring API key authentication for remote MCP servers.
 * Handles secure input and environment variable naming.
 *
 * @see ADR-010: Remote MCP Servers Discovery & Connection Verification
 */

import React, { useState, useMemo } from 'react';
import { Key, Eye, EyeOff, ExternalLink, AlertTriangle, Shield, Info } from 'lucide-react';
import type { RemoteMCPServer, MCPAuthCredentials } from '@/shared/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export interface ApiKeyConfigFormProps {
  /** The server to configure */
  server: RemoteMCPServer;
  /** Handler when form is submitted */
  onSubmit: (credentials: MCPAuthCredentials) => void;
  /** Whether the form is being submitted */
  isSubmitting?: boolean;
}

/**
 * Generate a suggested environment variable name from server info
 */
function generateEnvVarName(server: RemoteMCPServer): string {
  // Use suggested name from config if available
  if (server.authConfig?.apiKeyEnvVar) {
    return server.authConfig.apiKeyEnvVar;
  }

  // Generate from server name/id
  const baseName = server.id || server.name;
  return `${baseName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_API_KEY`;
}

/**
 * API Key Configuration Form Component
 */
export const ApiKeyConfigForm: React.FC<ApiKeyConfigFormProps> = ({
  server,
  onSubmit,
  isSubmitting = false,
}) => {
  const suggestedEnvVarName = useMemo(() => generateEnvVarName(server), [server]);

  const [apiKey, setApiKey] = useState('');
  const [envVarName, setEnvVarName] = useState(suggestedEnvVarName);
  const [showKey, setShowKey] = useState(false);
  const [errors, setErrors] = useState<{ apiKey?: string; envVarName?: string }>({});

  // Validate form
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!apiKey.trim()) {
      newErrors.apiKey = 'API key is required';
    }

    if (!envVarName.trim()) {
      newErrors.envVarName = 'Environment variable name is required';
    } else if (!/^[A-Z][A-Z0-9_]*$/.test(envVarName)) {
      newErrors.envVarName =
        'Must start with a letter and contain only uppercase letters, numbers, and underscores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const credentials: MCPAuthCredentials = {
      type: 'api-key',
      envVarName: envVarName.trim(),
      apiKeyValue: apiKey.trim(),
    };

    onSubmit(credentials);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Info Banner */}
      <Alert className="bg-purple-50 border-purple-200">
        <Key className="h-4 w-4 text-purple-500" />
        <AlertTitle className="text-sm font-medium">API Key Authentication</AlertTitle>
        <AlertDescription className="text-xs">
          Your API key will be stored securely in Claude Code&apos;s configuration and referenced
          via an environment variable.
        </AlertDescription>
      </Alert>

      {/* Get API Key Link */}
      {server.authConfig?.apiKeyUrl && (
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto text-blue-600"
          onClick={() => window.electronAPI.openExternal(server.authConfig!.apiKeyUrl!)}
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Get an API key from {server.provider}
        </Button>
      )}

      {/* API Key Instructions */}
      {server.authConfig?.apiKeyInstructions && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-xs">
            {server.authConfig.apiKeyInstructions}
          </AlertDescription>
        </Alert>
      )}

      {/* API Key Input */}
      <div className="space-y-2">
        <Label htmlFor="apiKey" className="flex items-center gap-1">
          <Key className="h-3.5 w-3.5" />
          API Key
        </Label>
        <div className="relative">
          <Input
            id="apiKey"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            className={errors.apiKey ? 'border-red-500' : ''}
            disabled={isSubmitting}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {errors.apiKey && <p className="text-xs text-red-500">{errors.apiKey}</p>}
      </div>

      {/* Environment Variable Name */}
      <div className="space-y-2">
        <Label htmlFor="envVarName" className="flex items-center gap-1">
          Environment Variable Name
          <span className="text-xs text-neutral-400 font-normal">(how it&apos;s stored)</span>
        </Label>
        <Input
          id="envVarName"
          type="text"
          value={envVarName}
          onChange={e => setEnvVarName(e.target.value.toUpperCase())}
          placeholder="e.g., GITHUB_API_KEY"
          className={errors.envVarName ? 'border-red-500' : ''}
          disabled={isSubmitting}
        />
        {errors.envVarName && <p className="text-xs text-red-500">{errors.envVarName}</p>}
        <p className="text-xs text-neutral-500">
          The key will be stored as{' '}
          <code className="bg-neutral-100 px-1 rounded">${envVarName}</code> in your settings.
        </p>
      </div>

      {/* Header Configuration (if applicable) */}
      {server.authConfig?.apiKeyHeader && (
        <div className="p-3 bg-neutral-50 rounded-lg">
          <p className="text-xs text-neutral-600">
            <span className="font-medium">Header:</span>{' '}
            <code className="bg-white px-1 rounded">{server.authConfig.apiKeyHeader}</code>
          </p>
        </div>
      )}

      {/* Security Warning */}
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-xs">
          <span className="font-medium">Security Notice:</span> Your API key will be stored in
          Claude Code&apos;s configuration file. Never share this file or commit it to version
          control.
        </AlertDescription>
      </Alert>

      {/* Security Indicator */}
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Shield className="h-4 w-4 text-green-500" />
        <span>API key is encrypted in transit and stored locally</span>
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Configuring...' : 'Save API Key & Add Server'}
      </Button>
    </form>
  );
};
