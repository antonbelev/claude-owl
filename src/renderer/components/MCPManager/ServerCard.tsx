/**
 * Server Card Component
 * Displays an MCP server in a card format
 */

import React from 'react';
import { Zap, Globe, Radio, Eye, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { MCPServer } from '@/shared/types/mcp.types';

export interface ServerCardProps {
  server: MCPServer;
  onRemove: () => void;
  onViewDetails: () => void;
}

export const ServerCard: React.FC<ServerCardProps> = ({ server, onRemove, onViewDetails }) => {
  const getScopeBadgeVariant = (scope?: string) => {
    switch (scope) {
      case 'user':
        return 'default' as const;
      case 'project':
        return 'secondary' as const;
      case 'local':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  const getTransportIcon = (transport: string) => {
    switch (transport) {
      case 'stdio':
        return <Zap className="h-4 w-4" />;
      case 'http':
        return <Globe className="h-4 w-4" />;
      case 'sse':
        return <Radio className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getTransportIcon(server.transport)}
            <CardTitle className="text-lg">{server.name}</CardTitle>
          </div>
          {server.scope && (
            <Badge variant={getScopeBadgeVariant(server.scope)} className="capitalize">
              {server.scope}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Project Path (for project-scoped servers) */}
        {server.scope === 'project' && server.projectPath && (
          <div className="flex items-start justify-between text-sm">
            <span className="text-neutral-600 font-medium">Project:</span>
            <span className="text-neutral-900 text-right truncate ml-2" title={server.projectPath}>
              {server.projectPath.split('/').pop() || server.projectPath}
            </span>
          </div>
        )}

        <div className="flex items-start justify-between text-sm">
          <span className="text-neutral-600 font-medium">Transport:</span>
          <span className="text-neutral-900 capitalize">{server.transport}</span>
        </div>

        {server.command && (
          <div className="flex items-start justify-between text-sm">
            <span className="text-neutral-600 font-medium">Command:</span>
            <span
              className="text-neutral-900 font-mono text-xs truncate ml-2"
              title={server.command}
            >
              {server.command}
            </span>
          </div>
        )}

        {server.url && (
          <div className="flex items-start justify-between text-sm">
            <span className="text-neutral-600 font-medium">URL:</span>
            <span className="text-neutral-900 font-mono text-xs truncate ml-2" title={server.url}>
              {server.url}
            </span>
          </div>
        )}

        {server.env && Object.keys(server.env).length > 0 && (
          <div className="flex items-start justify-between text-sm">
            <span className="text-neutral-600 font-medium">Env Vars:</span>
            <span className="text-neutral-900">{Object.keys(server.env).length} configured</span>
          </div>
        )}

        {server.headers && Object.keys(server.headers).length > 0 && (
          <div className="flex items-start justify-between text-sm">
            <span className="text-neutral-600 font-medium">Headers:</span>
            <span className="text-neutral-900">
              {Object.keys(server.headers).length} configured
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onViewDetails} className="flex-1">
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
        <Button variant="destructive" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
