/**
 * Server Detail View Component
 * Shows detailed information about an MCP server
 */

import React from 'react';
import { X, Copy, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { MCPServer } from '@/shared/types/mcp.types';

export interface ServerDetailViewProps {
  server: MCPServer;
  onClose: () => void;
  onRemove: () => void;
}

export const ServerDetailView: React.FC<ServerDetailViewProps> = ({
  server,
  onClose,
  onRemove,
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Show toast notification
  };

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-2xl">{server.name}</CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-neutral-900">Basic Information</h3>
          <div className="space-y-2">
            <div className="flex items-start justify-between text-sm">
              <span className="text-neutral-600 font-medium">Name:</span>
              <span className="text-neutral-900">{server.name}</span>
            </div>
            <div className="flex items-start justify-between text-sm">
              <span className="text-neutral-600 font-medium">Transport:</span>
              <span className="text-neutral-900 capitalize">{server.transport}</span>
            </div>
            {server.scope && (
              <div className="flex items-start justify-between text-sm">
                <span className="text-neutral-600 font-medium">Scope:</span>
                <Badge variant="outline" className="capitalize">
                  {server.scope}
                </Badge>
              </div>
            )}
            {server.scope === 'project' && server.projectPath && (
              <div className="flex items-start justify-between text-sm">
                <span className="text-neutral-600 font-medium">Project Path:</span>
                <span className="text-neutral-900 font-mono text-xs" title="Full path">
                  {server.projectPath}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Command Configuration */}
        {server.command && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-900">Command Configuration</h3>
            <div className="space-y-2">
              <div className="flex items-start justify-between text-sm">
                <span className="text-neutral-600 font-medium">Command:</span>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-900 font-mono text-xs">{server.command}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(server.command || '')}
                    title="Copy to clipboard"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {server.args && server.args.length > 0 && (
                <div className="flex items-start justify-between text-sm">
                  <span className="text-neutral-600 font-medium">Arguments:</span>
                  <ul className="space-y-1 text-right">
                    {server.args.map((arg, i) => (
                      <li key={i} className="text-neutral-900 font-mono text-xs">
                        {arg}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* URL Configuration */}
        {server.url && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-900">URL Configuration</h3>
            <div className="flex items-start justify-between text-sm">
              <span className="text-neutral-600 font-medium">URL:</span>
              <div className="flex items-center gap-2">
                <span className="text-neutral-900 font-mono text-xs">{server.url}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(server.url || '')}
                  title="Copy to clipboard"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Environment Variables */}
        {server.env && Object.keys(server.env).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-900">Environment Variables</h3>
            <div className="space-y-2">
              {Object.entries(server.env).map(([key, value]) => (
                <div key={key} className="flex items-start justify-between text-sm">
                  <span className="text-neutral-600 font-medium font-mono text-xs">{key}:</span>
                  <span className="text-neutral-900 font-mono text-xs blur-sm hover:blur-none transition-all">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HTTP Headers */}
        {server.headers && Object.keys(server.headers).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-900">HTTP Headers</h3>
            <div className="space-y-2">
              {Object.entries(server.headers).map(([key, value]) => (
                <div key={key} className="flex items-start justify-between text-sm">
                  <span className="text-neutral-600 font-medium font-mono text-xs">{key}:</span>
                  <span className="text-neutral-900 font-mono text-xs blur-sm hover:blur-none transition-all">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button variant="destructive" onClick={onRemove}>
          <Trash2 className="h-4 w-4 mr-2" />
          Remove Server
        </Button>
      </CardFooter>
    </Card>
  );
};
