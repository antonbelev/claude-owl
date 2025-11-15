import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/renderer/components/ui/card';
import { Button } from '@/renderer/components/ui/button';
import { Badge } from '@/renderer/components/ui/badge';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wrench,
  HelpCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { useServiceStatus } from '../../hooks/useServiceStatus';
import type { ServiceStatusLevel, ServiceIncident } from '@/shared/types';
import { cn } from '@/renderer/lib/utils';

const STATUS_PAGE_URL = 'https://status.claude.com';

// Status indicators with Tailwind classes and Lucide icons
const STATUS_INDICATORS: Record<
  ServiceStatusLevel,
  {
    colorClass: string;
    badgeVariant: 'success' | 'warning' | 'destructive' | 'default' | 'secondary';
    icon: React.ElementType;
    label: string;
  }
> = {
  operational: {
    colorClass: 'text-success',
    badgeVariant: 'success',
    icon: CheckCircle2,
    label: 'Operational',
  },
  degraded: {
    colorClass: 'text-warning',
    badgeVariant: 'warning',
    icon: AlertTriangle,
    label: 'Degraded Performance',
  },
  outage: {
    colorClass: 'text-destructive',
    badgeVariant: 'destructive',
    icon: XCircle,
    label: 'Service Outage',
  },
  maintenance: {
    colorClass: 'text-blue-500',
    badgeVariant: 'default',
    icon: Wrench,
    label: 'Maintenance',
  },
  unknown: {
    colorClass: 'text-neutral-400',
    badgeVariant: 'secondary',
    icon: HelpCircle,
    label: 'Unknown',
  },
};

export const ServiceStatusCard: React.FC = () => {
  const { loading, status, error, refetch } = useServiceStatus();
  const [showAllIncidents, setShowAllIncidents] = useState(false);

  const openStatusPage = () => {
    if (window.electronAPI) {
      window.electronAPI.openExternal(STATUS_PAGE_URL);
    }
  };

  const formatTimestamp = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 3) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const cleanHtmlMessage = (message: string): string => {
    // Remove HTML tags and decode entities
    return message
      .replace(/<[^>]*>/g, ' ') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
  };

  const renderIncident = (incident: ServiceIncident) => {
    const indicator = STATUS_INDICATORS[incident.resolved ? 'operational' : 'degraded'];
    const Icon = indicator.icon;

    return (
      <div
        key={incident.id}
        className={cn(
          'p-3 mt-3 bg-neutral-50 rounded-md border-l-3',
          incident.resolved ? 'border-l-success' : 'border-l-warning'
        )}
      >
        <div className="flex items-start gap-2">
          <Icon className={cn('h-4 w-4 flex-shrink-0 mt-0.5', indicator.colorClass)} />
          <div className="flex-1 min-w-0">
            {/* Incident Title */}
            <div className="font-semibold text-neutral-800 text-sm mb-2 leading-snug">
              {incident.title}
            </div>

            {/* Updates Timeline */}
            {incident.updates.length > 0 && (
              <div className="mb-2 space-y-1.5">
                {incident.updates.map((update, index) => (
                  <div
                    key={index}
                    className={cn(
                      'text-xs',
                      index < incident.updates.length - 1 &&
                        'pb-1.5 mb-1.5 border-b border-neutral-200'
                    )}
                  >
                    <div className="text-neutral-600 font-medium mb-0.5">{update.status}</div>
                    <div className="text-neutral-500 leading-snug break-words">
                      {cleanHtmlMessage(update.message)}
                    </div>
                    <div className="text-neutral-400 mt-0.5 text-[0.7rem]">
                      {formatTimestamp(update.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Status and Time Footer */}
            <div className="text-xs text-neutral-400 mt-1.5">
              <span>Reported {formatTimestamp(incident.publishedAt)}</span>
              {incident.resolved && (
                <span className="ml-2 text-success font-medium inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Resolved
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !status) {
    return (
      <Card data-testid="service-status-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Claude Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-600">Checking service status...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && !status) {
    return (
      <Card data-testid="service-status-card" className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Claude Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={refetch} variant="outline" size="sm" data-testid="retry-button">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card data-testid="service-status-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-neutral-400" />
            Claude Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-600">Unable to load status information</p>
        </CardContent>
        <CardFooter>
          <Button onClick={refetch} variant="outline" size="sm" data-testid="retry-button">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const indicator = STATUS_INDICATORS[status.level];
  const Icon = indicator.icon;
  const displayedIncidents = showAllIncidents
    ? status.recentIncidents
    : status.recentIncidents.slice(0, 2);

  return (
    <Card
      data-testid="service-status-card"
      className={cn(
        status.level === 'operational' && 'border-success',
        status.level === 'degraded' && 'border-warning',
        status.level === 'outage' && 'border-destructive'
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Icon className={cn('h-5 w-5', indicator.colorClass)} />
            Claude Service Status
          </span>
          <Badge variant={indicator.badgeVariant}>{indicator.label}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Message */}
        <div className="text-sm text-neutral-600">{status.message}</div>

        {/* Recent Incidents */}
        {status.recentIncidents.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-neutral-800 mb-2">
              Recent Activity (Last 3 Days)
            </div>
            <div className="space-y-0">{displayedIncidents.map(renderIncident)}</div>

            {status.recentIncidents.length > 2 && (
              <Button
                onClick={() => setShowAllIncidents(!showAllIncidents)}
                variant="outline"
                size="sm"
                className="mt-2 w-full"
              >
                {showAllIncidents ? 'Show Less' : `Show ${status.recentIncidents.length - 2} More`}
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-3">
        {/* Action Buttons */}
        <div className="flex gap-2 w-full">
          <Button onClick={openStatusPage} variant="default" size="sm" className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full Status
          </Button>
          <Button
            onClick={refetch}
            data-testid="refresh-button"
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Last Checked */}
        <div className="text-xs text-neutral-400 text-center w-full">
          Last checked: {formatTimestamp(status.lastChecked)}
        </div>
      </CardFooter>
    </Card>
  );
};
