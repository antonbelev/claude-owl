/**
 * Remote Server Card Component
 *
 * Displays a single remote MCP server with status, auth info, and actions.
 *
 * @see ADR-010: Remote MCP Servers Discovery & Connection Verification
 */

import React from 'react';
import {
  Globe,
  ShieldCheck,
  Zap,
  Lock,
  Key,
  Unlock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import type { RemoteMCPServer, ConnectionTestResult } from '@/shared/types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export interface RemoteServerCardProps {
  /** The remote server to display */
  server: RemoteMCPServer;
  /** Whether a connection test is in progress */
  isTesting?: boolean;
  /** Result of connection test */
  testResult?: ConnectionTestResult | null;
  /** Handler for test connection button */
  onTestConnection?: () => void;
  /** Handler for add/install button */
  onAdd?: () => void;
  /** Handler for clicking on the card (view details) */
  onClick?: () => void;
}

/**
 * Get icon for auth type
 */
function getAuthIcon(authType: RemoteMCPServer['authType']) {
  switch (authType) {
    case 'oauth':
      return <Lock className="h-3 w-3" />;
    case 'api-key':
      return <Key className="h-3 w-3" />;
    case 'header':
      return <Key className="h-3 w-3" />;
    case 'open':
      return <Unlock className="h-3 w-3" />;
    default:
      return null;
  }
}

/**
 * Get badge variant for auth type
 */
function getAuthBadgeVariant(
  authType: RemoteMCPServer['authType']
): 'default' | 'secondary' | 'outline' {
  switch (authType) {
    case 'oauth':
      return 'default';
    case 'api-key':
      return 'secondary';
    case 'open':
      return 'outline';
    default:
      return 'secondary';
  }
}

/**
 * Get status indicator
 */
function getStatusIndicator(
  healthStatus?: RemoteMCPServer['healthStatus'],
  isTesting?: boolean,
  testResult?: ConnectionTestResult | null
) {
  if (isTesting) {
    return (
      <span className="flex items-center gap-1 text-blue-600 text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
        Testing...
      </span>
    );
  }

  if (testResult) {
    if (testResult.success) {
      return (
        <span className="flex items-center gap-1 text-green-600 text-xs">
          <CheckCircle2 className="h-3 w-3" />
          Healthy ({testResult.latencyMs}ms)
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 text-red-600 text-xs">
          <AlertCircle className="h-3 w-3" />
          {testResult.error || 'Failed'}
        </span>
      );
    }
  }

  switch (healthStatus) {
    case 'healthy':
      return (
        <span className="flex items-center gap-1 text-green-600 text-xs">
          <CheckCircle2 className="h-3 w-3" />
          Healthy
        </span>
      );
    case 'degraded':
      return (
        <span className="flex items-center gap-1 text-yellow-600 text-xs">
          <Clock className="h-3 w-3" />
          Degraded
        </span>
      );
    case 'offline':
      return (
        <span className="flex items-center gap-1 text-red-600 text-xs">
          <AlertCircle className="h-3 w-3" />
          Offline
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1 text-neutral-400 text-xs">
          <Clock className="h-3 w-3" />
          Unknown
        </span>
      );
  }
}

/**
 * Remote Server Card Component
 */
export const RemoteServerCard: React.FC<RemoteServerCardProps> = ({
  server,
  isTesting = false,
  testResult,
  onTestConnection,
  onAdd,
  onClick,
}) => {
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleTestClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTestConnection) {
      onTestConnection();
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAdd) {
      onAdd();
    }
  };

  return (
    <Card
      className={`transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Logo or Icon */}
            <div className="h-10 w-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
              {server.logoUrl ? (
                <img
                  src={server.logoUrl}
                  alt={server.name}
                  className="h-6 w-6 object-contain"
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('fallback-icon');
                  }}
                />
              ) : (
                <Globe className="h-5 w-5 text-neutral-500" />
              )}
            </div>

            {/* Name and Provider */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-medium text-neutral-900 truncate">{server.name}</h3>
                {server.verified && (
                  <span title="Verified provider">
                    <ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 truncate">{server.provider}</p>
            </div>
          </div>

          {/* Auth Badge */}
          <Badge variant={getAuthBadgeVariant(server.authType)} className="flex-shrink-0">
            {getAuthIcon(server.authType)}
            <span className="ml-1 capitalize">{server.authType}</span>
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{server.description}</p>

        {/* Endpoint */}
        <p className="text-xs text-neutral-400 truncate mb-3" title={server.endpoint}>
          {new URL(server.endpoint).hostname}
        </p>

        {/* Status and Transport */}
        <div className="flex items-center justify-between mb-3">
          {getStatusIndicator(server.healthStatus, isTesting, testResult)}

          <Badge variant="outline" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            {server.transport.toUpperCase()}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleTestClick}
            disabled={isTesting}
          >
            {isTesting ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          <Button size="sm" className="flex-1" onClick={handleAddClick}>
            Add
          </Button>
        </div>

        {/* Documentation Link */}
        {server.documentationUrl && (
          <a
            href={server.documentationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            View Documentation
          </a>
        )}
      </CardContent>
    </Card>
  );
};
