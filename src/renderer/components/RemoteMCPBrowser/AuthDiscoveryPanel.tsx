/**
 * Auth Discovery Panel Component
 *
 * Probes the MCP server to discover its authentication requirements
 * and displays appropriate guidance based on what's supported.
 *
 * @see ADR-010: Remote MCP Servers Discovery & Connection Verification
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Shield,
  Key,
  RefreshCw,
} from 'lucide-react';
import type { DiscoverAuthResponse, DiscoveredAuthType } from '@/shared/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export interface AuthDiscoveryPanelProps {
  /** MCP server endpoint URL */
  endpoint: string;
  /** Callback when discovery completes with recommended auth type */
  onDiscoveryComplete?: (result: DiscoverAuthResponse) => void;
  /** Whether to auto-run discovery on mount */
  autoDiscover?: boolean;
}

/**
 * Get display info for discovered auth type
 */
function getAuthTypeDisplay(authType: DiscoveredAuthType): {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
} {
  switch (authType) {
    case 'oauth-dcr':
      return {
        label: 'OAuth (Auto-register)',
        description:
          'This server supports OAuth with automatic client registration. Claude Code can handle authentication automatically.',
        icon: <Shield className="h-4 w-4" />,
        color: 'text-green-500',
      };
    case 'oauth-static':
      return {
        label: 'OAuth (Manual setup)',
        description:
          "This server requires OAuth but doesn't support automatic registration. You may need to use a Personal Access Token instead.",
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'text-yellow-500',
      };
    case 'api-key':
      return {
        label: 'API Key / Token',
        description: 'This server accepts API key or token authentication.',
        icon: <Key className="h-4 w-4" />,
        color: 'text-purple-500',
      };
    case 'open':
      return {
        label: 'Open Access',
        description: 'This server does not require authentication.',
        icon: <CheckCircle2 className="h-4 w-4" />,
        color: 'text-green-500',
      };
    default:
      return {
        label: 'Unknown',
        description: 'Could not determine authentication requirements.',
        icon: <Info className="h-4 w-4" />,
        color: 'text-neutral-500',
      };
  }
}

/**
 * Auth Discovery Panel Component
 */
export const AuthDiscoveryPanel: React.FC<AuthDiscoveryPanelProps> = ({
  endpoint,
  onDiscoveryComplete,
  autoDiscover = true,
}) => {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [result, setResult] = useState<DiscoverAuthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiscovery = useCallback(async () => {
    setIsDiscovering(true);
    setError(null);

    try {
      const response = await window.electronAPI.discoverMCPAuth({ endpoint });
      const discoveryResult = response as DiscoverAuthResponse;

      setResult(discoveryResult);

      if (discoveryResult.error) {
        setError(discoveryResult.error);
      }

      onDiscoveryComplete?.(discoveryResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Discovery failed';
      setError(errorMessage);
    } finally {
      setIsDiscovering(false);
    }
  }, [endpoint, onDiscoveryComplete]);

  useEffect(() => {
    if (autoDiscover) {
      runDiscovery();
    }
  }, [autoDiscover, runDiscovery]);

  // Loading state
  if (isDiscovering) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
        <AlertTitle className="text-sm font-medium">Checking Server Authentication</AlertTitle>
        <AlertDescription className="text-xs">
          Probing {endpoint} to discover authentication requirements...
        </AlertDescription>
      </Alert>
    );
  }

  // Error state (but allow retry)
  if (error && !result) {
    return (
      <Alert className="bg-red-50 border-red-200">
        <XCircle className="h-4 w-4 text-red-500" />
        <AlertTitle className="text-sm font-medium">Discovery Failed</AlertTitle>
        <AlertDescription className="text-xs">
          {error}
          <Button variant="link" size="sm" className="h-auto p-0 ml-2" onClick={runDiscovery}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Result display
  if (result) {
    const authDisplay = getAuthTypeDisplay(result.authType);

    return (
      <div className="space-y-3">
        {/* Auth Type Result */}
        <Alert
          className={
            result.authType === 'oauth-static'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-blue-50 border-blue-200'
          }
        >
          <div className={authDisplay.color}>{authDisplay.icon}</div>
          <AlertTitle className="text-sm font-medium flex items-center gap-2">
            Detected: {authDisplay.label}
            {result.supportsDCR && (
              <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                DCR Supported
              </Badge>
            )}
          </AlertTitle>
          <AlertDescription className="text-xs">{authDisplay.description}</AlertDescription>
        </Alert>

        {/* OAuth without DCR warning */}
        {result.authType === 'oauth-static' && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-sm font-medium">OAuth Limitation</AlertTitle>
            <AlertDescription className="text-xs">
              This server&apos;s OAuth provider doesn&apos;t support Dynamic Client Registration,
              which Claude Code requires for automatic OAuth. You should use a Personal Access Token
              or API key instead.
            </AlertDescription>
          </Alert>
        )}

        {/* Scopes */}
        {result.scopes && result.scopes.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-600">Available Scopes:</p>
            <div className="flex flex-wrap gap-1">
              {result.scopes.slice(0, 8).map((scope, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {scope}
                </Badge>
              ))}
              {result.scopes.length > 8 && (
                <Badge variant="outline" className="text-xs text-neutral-400">
                  +{result.scopes.length - 8} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Server Name from Metadata */}
        {result.protectedResource?.resource_name && (
          <p className="text-xs text-neutral-500">
            Server: {result.protectedResource.resource_name}
          </p>
        )}

        {/* Refresh Button */}
        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={runDiscovery}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Re-check
        </Button>
      </div>
    );
  }

  // No result yet and not auto-discovering
  return (
    <Button variant="outline" size="sm" onClick={runDiscovery}>
      <Shield className="h-4 w-4 mr-2" />
      Check Authentication Requirements
    </Button>
  );
};
