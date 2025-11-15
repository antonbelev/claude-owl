import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Key,
  Pause,
  Loader2,
  Package,
  Trash2,
  TestTube,
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import type { MCPServer } from '@/shared/types';

interface ServerCardProps {
  server: MCPServer;
  isTesting?: boolean;
  onTest: () => void;
  onDelete: () => void;
  onClick?: () => void;
}

export const ServerCard: React.FC<ServerCardProps> = ({
  server,
  isTesting = false,
  onTest,
  onDelete,
  onClick,
}) => {
  /**
   * Get status badge display
   */
  const getStatusDisplay = () => {
    switch (server.status) {
      case 'connected':
        return {
          icon: <CheckCircle2 className="h-3 w-3" />,
          label: 'Connected',
          variant: 'default' as const,
        };
      case 'error':
        return {
          icon: <XCircle className="h-3 w-3" />,
          label: 'Error',
          variant: 'destructive' as const,
        };
      case 'auth-required':
        return {
          icon: <Key className="h-3 w-3" />,
          label: 'Auth Required',
          variant: 'outline' as const,
        };
      case 'disabled':
        return {
          icon: <Pause className="h-3 w-3" />,
          label: 'Disabled',
          variant: 'secondary' as const,
        };
      case 'testing':
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          label: 'Testing...',
          variant: 'outline' as const,
        };
      default:
        return { icon: null, label: 'Unknown', variant: 'outline' as const };
    }
  };

  const status = getStatusDisplay();

  return (
    <Card
      className={onClick ? 'cursor-pointer hover:border-blue-500 transition-colors' : ''}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-semibold text-neutral-900">{server.name}</h3>
            <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
              {status.icon}
              {status.label}
            </Badge>
          </div>

          {/* Actions Menu */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                onTest();
              }}
              disabled={isTesting}
              title="Test connection"
            >
              <TestTube className="h-4 w-4 mr-1" />
              {isTesting ? 'Testing...' : 'Test'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete server"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Transport & Details */}
        <div className="space-y-2">
          <div className="flex items-start justify-between text-sm">
            <span className="text-neutral-600 font-medium">Transport:</span>
            <span className="text-neutral-900 capitalize">{server.transport}</span>
          </div>

          {server.command && (
            <div className="flex items-start justify-between text-sm">
              <span className="text-neutral-600 font-medium">Command:</span>
              <span className="text-neutral-900 font-mono text-xs truncate ml-2">
                {server.command}
              </span>
            </div>
          )}

          {server.url && (
            <div className="flex items-start justify-between text-sm">
              <span className="text-neutral-600 font-medium">URL:</span>
              <span className="text-neutral-900 font-mono text-xs truncate ml-2">{server.url}</span>
            </div>
          )}
        </div>

        {/* Tools Count */}
        {server.tools && server.tools.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Package className="h-4 w-4" />
            <span>{server.tools.length} tools available</span>
          </div>
        )}

        {/* Error Message */}
        {server.status === 'error' && server.lastError && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{server.lastError}</AlertDescription>
          </Alert>
        )}

        {/* Latency */}
        {server.latency !== undefined && (
          <div className="text-xs text-neutral-500">Latency: {server.latency}ms</div>
        )}
      </CardContent>
    </Card>
  );
};
