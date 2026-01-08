/**
 * OAuth Server Guide Component
 *
 * Provides step-by-step guidance for OAuth authentication with remote MCP servers.
 * Two-step process: 1) Add server, 2) Authenticate via /mcp
 *
 * @see ADR-010: Remote MCP Servers Discovery & Connection Verification
 */

import React, { useState, useCallback } from 'react';
import {
  Terminal,
  AlertTriangle,
  Info,
  Copy,
  Check,
  ChevronRight,
  Shield,
} from 'lucide-react';
import type { RemoteMCPServer } from '@/shared/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export interface OAuthServerGuideProps {
  /** The server to authenticate */
  server: RemoteMCPServer;
  /** Handler to add server (step 1) */
  onAddServer: () => void;
  /** Handler to open /mcp for authentication (step 2) */
  onAuthenticate: () => void;
  /** Whether step 1 is in progress */
  isAddingServer?: boolean;
  /** Whether step 1 is complete (server added) */
  serverAdded?: boolean;
  /** Whether step 2 is in progress */
  isAuthenticating?: boolean;
}

/**
 * OAuth Server Guide Component
 */
export const OAuthServerGuide: React.FC<OAuthServerGuideProps> = ({
  server,
  onAddServer,
  onAuthenticate,
  isAddingServer = false,
  serverAdded = false,
  isAuthenticating = false,
}) => {
  const providerName = server.authConfig?.oauthProvider || server.provider;
  const [copiedAdd, setCopiedAdd] = useState(false);
  const [copiedAuth, setCopiedAuth] = useState(false);

  // Generate the manual commands
  const addCommand = `claude mcp add ${server.id} --transport ${server.transport} ${server.endpoint}`;
  const authCommand = 'claude /mcp';

  const handleCopyCommand = useCallback(async (command: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy command:', err);
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-sm font-medium">Two-Step Setup Required</AlertTitle>
        <AlertDescription className="text-xs">
          {server.name} uses OAuth 2.0. First we&apos;ll add the server, then you&apos;ll
          authenticate with {providerName}.
        </AlertDescription>
      </Alert>

      {/* Step 1: Add Server */}
      <div
        className={`p-4 rounded-lg border-2 transition-colors ${
          serverAdded
            ? 'bg-green-50 border-green-200'
            : 'bg-white border-blue-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
              serverAdded
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            {serverAdded ? <Check className="h-4 w-4" /> : '1'}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">
              {serverAdded ? 'Server Added' : 'Add Server to Claude Code'}
            </p>
            <p className="text-xs text-neutral-500 mb-3">
              {serverAdded
                ? `${server.name} has been added to your configuration.`
                : `This will register ${server.name} in your Claude Code settings.`}
            </p>

            {!serverAdded && (
              <>
                <Button
                  onClick={onAddServer}
                  disabled={isAddingServer}
                  size="sm"
                  className="mb-2"
                >
                  <Terminal className="h-3.5 w-3.5 mr-1.5" />
                  {isAddingServer ? 'Adding...' : 'Add Server'}
                </Button>

                {/* Manual command */}
                <div className="flex items-center gap-2 p-2 bg-neutral-100 rounded-md">
                  <code className="flex-1 text-xs text-neutral-600 overflow-x-auto whitespace-nowrap">
                    {addCommand}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={() => handleCopyCommand(addCommand, setCopiedAdd)}
                  >
                    {copiedAdd ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Arrow between steps */}
      <div className="flex justify-center">
        <ChevronRight className="h-5 w-5 text-neutral-300 rotate-90" />
      </div>

      {/* Step 2: Authenticate */}
      <div
        className={`p-4 rounded-lg border-2 transition-colors ${
          !serverAdded
            ? 'bg-neutral-50 border-neutral-200 opacity-60'
            : 'bg-white border-blue-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
              !serverAdded
                ? 'bg-neutral-300 text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            2
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Authenticate with {providerName}</p>
            <p className="text-xs text-neutral-500 mb-3">
              {serverAdded
                ? `Open Claude Code's MCP manager, select "${server.name}", and choose "Authenticate".`
                : 'Complete step 1 first, then authenticate.'}
            </p>

            {serverAdded && (
              <>
                <Button
                  onClick={onAuthenticate}
                  disabled={isAuthenticating}
                  size="sm"
                  className="mb-2"
                >
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  {isAuthenticating ? 'Opening...' : 'Open Claude Code to Authenticate'}
                </Button>

                {/* Manual command */}
                <div className="flex items-center gap-2 p-2 bg-neutral-100 rounded-md">
                  <code className="flex-1 text-xs text-neutral-600">
                    {authCommand}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={() => handleCopyCommand(authCommand, setCopiedAuth)}
                  >
                    {copiedAuth ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                <p className="text-xs text-neutral-400 mt-2">
                  In the MCP manager, find &quot;{server.name}&quot; and select &quot;Authenticate&quot;
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Required Scopes */}
      {server.authConfig?.requiredScopes && server.authConfig.requiredScopes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-neutral-700">Permissions to be granted:</h4>
          <div className="flex flex-wrap gap-1">
            {server.authConfig.requiredScopes.map((scope, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {scope}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Security Note */}
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-xs">
          Only authorize if you trust {providerName} and understand what permissions you&apos;re
          granting. Your credentials are stored securely by Claude Code in your system keychain.
        </AlertDescription>
      </Alert>
    </div>
  );
};
