import React from 'react';
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
  Download,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useVersionCheck } from '../../hooks/useVersionCheck';

export const VersionUpdateCard: React.FC = () => {
  const { loading, versionInfo, error, refetch } = useVersionCheck();

  if (loading) {
    return (
      <Card data-testid="version-update-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Version Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-600">Checking for updates...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-testid="version-update-card" className="border-neutral-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-neutral-500" />
            Version Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-neutral-600">
              Unable to check for updates. {error}
            </AlertDescription>
          </Alert>
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

  if (!versionInfo) {
    return null;
  }

  // Show update available card if outdated
  if (versionInfo.isOutdated) {
    return (
      <Card data-testid="version-update-card" className="border-warning bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Download className="h-5 w-5 text-warning" />
              Update Available
            </span>
            <Badge variant="warning">v{versionInfo.latestVersion}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert variant="warning">
            <Download className="h-4 w-4" />
            <AlertDescription>A new version of Claude Owl is available!</AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-700 min-w-[90px]">Current:</span>
              <span className="text-sm text-neutral-900 font-mono">
                v{versionInfo.currentVersion}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-700 min-w-[90px]">Latest:</span>
              <span className="text-sm text-success font-mono font-semibold">
                v{versionInfo.latestVersion}
              </span>
            </div>
            {versionInfo.publishedAt && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-700 min-w-[90px]">Released:</span>
                <span className="text-sm text-neutral-600">
                  {new Date(versionInfo.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>

          {versionInfo.releaseNotes && (
            <div className="mt-3">
              <p className="text-xs font-medium text-neutral-700 mb-1">Release Notes:</p>
              <div className="text-xs text-neutral-600 bg-neutral-50 p-2 rounded border border-neutral-200 max-h-32 overflow-y-auto">
                {versionInfo.releaseNotes
                  .split('\n')
                  .slice(0, 5)
                  .map((line, idx) => (
                    <p key={idx} className="mb-1">
                      {line}
                    </p>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            onClick={() =>
              versionInfo.releaseUrl && window.electronAPI.openExternal(versionInfo.releaseUrl)
            }
            variant="default"
            size="sm"
            className="flex-1"
            data-testid="download-button"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Download Update
          </Button>
          <Button onClick={refetch} variant="outline" size="sm" data-testid="refresh-button">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show up-to-date card (only visible if not outdated)
  return (
    <Card data-testid="version-update-card" className="border-success">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Version Status
          </span>
          <Badge variant="success">Up to date</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-700 min-w-[90px]">Version:</span>
          <span className="text-sm text-neutral-900 font-mono">v{versionInfo.currentVersion}</span>
        </div>
        <p className="text-sm text-neutral-600">
          You are running the latest version of Claude Owl.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={refetch} variant="outline" size="sm" data-testid="refresh-button">
          <RefreshCw className="h-4 w-4 mr-2" />
          Check for Updates
        </Button>
      </CardFooter>
    </Card>
  );
};
