/**
 * Authentication Configuration Modal
 *
 * Modal component that handles authentication setup for remote MCP servers.
 * Routes to OAuth guide or API key form based on server's auth type.
 * Now includes auth discovery to detect actual server capabilities.
 *
 * @see ADR-010: Remote MCP Servers Discovery & Connection Verification
 */

import React, { useState, useCallback } from 'react';
import { Lock, Key, Unlock, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import type {
  RemoteMCPServer,
  SecurityContext,
  MCPAuthCredentials,
  DiscoverAuthResponse,
} from '@/shared/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { OAuthServerGuide } from './OAuthServerGuide';
import { ApiKeyConfigForm } from './ApiKeyConfigForm';
import { AuthDiscoveryPanel } from './AuthDiscoveryPanel';
import type { ProjectInfo } from '@/shared/types';

export interface AuthConfigModalProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Handler to close the dialog */
  onOpenChange: (open: boolean) => void;
  /** The server to configure */
  server: RemoteMCPServer;
  /** Security context for the server (optional) */
  securityContext?: SecurityContext | undefined;
  /** Selected scope */
  scope: 'user' | 'project';
  /** Selected project (if scope is 'project') */
  selectedProject?: ProjectInfo | null | undefined;
  /** Handler when configuration is complete */
  onComplete: (success: boolean, message?: string) => void;
}

/**
 * Get auth type display info
 */
function getAuthTypeInfo(authType: RemoteMCPServer['authType']) {
  switch (authType) {
    case 'oauth':
      return {
        icon: <Lock className="h-5 w-5 text-blue-500" />,
        label: 'OAuth Authentication',
        description:
          'This server uses OAuth for secure authentication. You will be redirected to the provider to grant access.',
      };
    case 'api-key':
      return {
        icon: <Key className="h-5 w-5 text-purple-500" />,
        label: 'API Key Authentication',
        description:
          'This server requires an API key. You can get one from the provider dashboard.',
      };
    case 'header':
      return {
        icon: <Key className="h-5 w-5 text-gray-500" />,
        label: 'Header Authentication',
        description: 'This server requires custom headers for authentication.',
      };
    case 'open':
      return {
        icon: <Unlock className="h-5 w-5 text-green-500" />,
        label: 'Open Access',
        description: 'This server does not require authentication.',
      };
    default:
      return {
        icon: <Lock className="h-5 w-5 text-neutral-400" />,
        label: 'Authentication Required',
        description: 'This server requires authentication.',
      };
  }
}

/**
 * Authentication Configuration Modal
 */
export const AuthConfigModal: React.FC<AuthConfigModalProps> = ({
  open,
  onOpenChange,
  server,
  securityContext,
  scope,
  selectedProject,
  onComplete,
}) => {
  const [step, setStep] = useState<'overview' | 'configure'>('overview');
  const [configuring, setConfiguring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // OAuth two-step state
  const [oauthServerAdded, setOauthServerAdded] = useState(false);
  const [isAddingOAuthServer, setIsAddingOAuthServer] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Auth discovery state - determines actual auth method to use
  const [discoveryResult, setDiscoveryResult] = useState<DiscoverAuthResponse | null>(null);
  const [useApiKeyFallback, setUseApiKeyFallback] = useState(false);

  // Determine effective auth type based on discovery
  // If discovery shows OAuth without DCR, fall back to API key
  const effectiveAuthType = useApiKeyFallback
    ? 'api-key'
    : discoveryResult?.authType === 'oauth-static'
      ? 'api-key' // Auto-fallback for OAuth without DCR
      : server.authType;

  const authInfo = getAuthTypeInfo(effectiveAuthType);

  // Handle discovery completion
  const handleDiscoveryComplete = useCallback((result: DiscoverAuthResponse) => {
    setDiscoveryResult(result);
    // Auto-switch to API key if OAuth without DCR is detected
    if (result.authType === 'oauth-static') {
      setUseApiKeyFallback(true);
    }
  }, []);

  // Step 1: Add OAuth server via CLI
  const handleAddOAuthServer = useCallback(async () => {
    setIsAddingOAuthServer(true);
    setError(null);

    try {
      // Use the regular addRemoteMCPServer to add the server config
      const response = await window.electronAPI.addRemoteMCPServer({
        server,
        scope,
        projectPath: scope === 'project' ? selectedProject?.path : undefined,
      });

      const result = response as { success: boolean; message?: string; error?: string };

      if (result.success) {
        setOauthServerAdded(true);
        setSuccessMessage('Server added! Now complete authentication in step 2.');
      } else {
        setError(result.error || 'Failed to add server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add server');
    } finally {
      setIsAddingOAuthServer(false);
    }
  }, [server, scope, selectedProject?.path]);

  // Step 2: Open /mcp for OAuth authentication
  const handleAuthenticate = useCallback(async () => {
    setIsAuthenticating(true);
    setError(null);

    try {
      const response = await window.electronAPI.launchMCPOAuthFlow({
        serverName: server.id,
        serverUrl: server.endpoint,
        transport: server.transport,
        projectPath: scope === 'project' ? selectedProject?.path : undefined,
      });

      const result = response as { success: boolean; message?: string; error?: string };

      if (result.success) {
        setSuccessMessage(
          result.message ||
            'Claude Code opened. Select the server and choose "Authenticate" to complete setup.'
        );
      } else {
        setError(result.error || 'Failed to open Claude Code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open Claude Code');
    } finally {
      setIsAuthenticating(false);
    }
  }, [server.id, server.endpoint, server.transport, scope, selectedProject?.path]);

  // Handle API key configuration
  const handleConfigureApiKey = useCallback(
    async (credentials: MCPAuthCredentials) => {
      setConfiguring(true);
      setError(null);

      try {
        const response = await window.electronAPI.configureMCPApiKey({
          server,
          credentials,
          scope,
          projectPath: scope === 'project' ? selectedProject?.path : undefined,
        });

        const result = response as { success: boolean; message?: string; error?: string };

        if (result.success) {
          onComplete(true, result.message || `Successfully configured ${server.name}`);
          onOpenChange(false);
        } else {
          setError(result.error || 'Failed to configure API key');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to configure API key');
      } finally {
        setConfiguring(false);
      }
    },
    [server, scope, selectedProject?.path, onComplete, onOpenChange]
  );

  // Handle adding server without auth (for open servers)
  const handleAddWithoutAuth = useCallback(async () => {
    setConfiguring(true);
    setError(null);

    try {
      const response = await window.electronAPI.addRemoteMCPServer({
        server,
        scope,
        projectPath: scope === 'project' ? selectedProject?.path : undefined,
      });

      const result = response as { success: boolean; message?: string; error?: string };

      if (result.success) {
        onComplete(true, result.message || `Successfully added ${server.name}`);
        onOpenChange(false);
      } else {
        setError(result.error || 'Failed to add server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add server');
    } finally {
      setConfiguring(false);
    }
  }, [server, scope, selectedProject?.path, onComplete, onOpenChange]);

  // Reset state when modal closes
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setStep('overview');
        setError(null);
        setSuccessMessage(null);
        setOauthServerAdded(false);
        setIsAddingOAuthServer(false);
        setIsAuthenticating(false);
        setDiscoveryResult(null);
        setUseApiKeyFallback(false);
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {authInfo.icon}
            {server.authType === 'open' ? `Add ${server.name}` : `Configure ${server.name}`}
          </DialogTitle>
          <DialogDescription>
            {server.authType === 'open'
              ? 'This server is ready to use without authentication.'
              : authInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {successMessage && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Overview Step */}
          {step === 'overview' && (
            <>
              {/* Server Info */}
              <div className="p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{server.name}</h4>
                  <Badge variant="outline">{server.provider}</Badge>
                </div>
                <p className="text-sm text-neutral-600">{server.description}</p>
                <p className="text-xs text-neutral-400 mt-2">{server.endpoint}</p>
              </div>

              {/* Auth Discovery Panel - Probes server for actual auth requirements */}
              {server.authType !== 'open' && (
                <AuthDiscoveryPanel
                  endpoint={server.endpoint}
                  onDiscoveryComplete={handleDiscoveryComplete}
                  autoDiscover={true}
                />
              )}

              {/* Scope Info */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-neutral-500">Scope:</span>
                <Badge variant="secondary">
                  {scope === 'user' ? 'User (all projects)' : `Project: ${selectedProject?.name}`}
                </Badge>
              </div>

              {/* Security Warning for non-verified servers */}
              {securityContext && !securityContext.isVerifiedProvider && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-sm">
                    This server is not from a verified provider. Review the documentation before
                    proceeding.
                  </AlertDescription>
                </Alert>
              )}

              {/* Documentation Link */}
              {server.documentationUrl && (
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-600"
                  onClick={() => window.electronAPI.openExternal(server.documentationUrl!)}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Documentation
                </Button>
              )}
            </>
          )}

          {/* OAuth Configuration - Two-step process (only if DCR is supported) */}
          {step === 'configure' && effectiveAuthType === 'oauth' && !useApiKeyFallback && (
            <OAuthServerGuide
              server={server}
              onAddServer={handleAddOAuthServer}
              onAuthenticate={handleAuthenticate}
              isAddingServer={isAddingOAuthServer}
              serverAdded={oauthServerAdded}
              isAuthenticating={isAuthenticating}
            />
          )}

          {/* API Key Configuration - Used for api-key, header, or OAuth fallback */}
          {step === 'configure' &&
            (effectiveAuthType === 'api-key' ||
              effectiveAuthType === 'header' ||
              useApiKeyFallback) && (
              <ApiKeyConfigForm
                server={server}
                onSubmit={handleConfigureApiKey}
                isSubmitting={configuring}
              />
            )}
        </div>

        <DialogFooter className="gap-2">
          {step === 'overview' && (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              {effectiveAuthType === 'open' ? (
                <Button onClick={handleAddWithoutAuth} disabled={configuring}>
                  {configuring ? 'Adding...' : 'Add Server'}
                </Button>
              ) : (
                <Button onClick={() => setStep('configure')}>Configure Authentication</Button>
              )}
            </>
          )}

          {step === 'configure' && effectiveAuthType === 'oauth' && !useApiKeyFallback && (
            <>
              <Button variant="outline" onClick={() => setStep('overview')}>
                Back
              </Button>
              {oauthServerAdded ? (
                <Button
                  onClick={() =>
                    onComplete(true, 'Server added. Complete authentication in Claude Code.')
                  }
                >
                  Done
                </Button>
              ) : (
                <Button onClick={handleAddOAuthServer} disabled={isAddingOAuthServer}>
                  {isAddingOAuthServer ? 'Adding...' : 'Add Server'}
                </Button>
              )}
            </>
          )}

          {step === 'configure' &&
            (effectiveAuthType === 'api-key' ||
              effectiveAuthType === 'header' ||
              useApiKeyFallback) && (
              <Button variant="outline" onClick={() => setStep('overview')}>
                Back
              </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
