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
import { CheckCircle2, XCircle, AlertCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { useClaudeInstallation } from '../../hooks/useClaudeInstallation';

export const ClaudeStatusCard: React.FC = () => {
  const { loading, installed, version, path, error, refetch } = useClaudeInstallation();

  if (loading) {
    return (
      <Card data-testid="claude-status-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Claude Code Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-600">Checking installation...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-testid="claude-status-card" className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Claude Code Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
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

  if (!installed) {
    return (
      <Card data-testid="claude-status-card" className="border-warning">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Claude Code Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Claude Code is not installed</AlertDescription>
          </Alert>
          <p className="text-sm text-neutral-600">
            Please install Claude Code CLI to use this application.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() =>
              window.electronAPI.openExternal('https://code.claude.com/docs/en/quickstart')
            }
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Installation Guide
          </Button>
        </CardContent>
        <CardFooter>
          <Button onClick={refetch} variant="default" size="sm" data-testid="retry-button">
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card data-testid="claude-status-card" className="border-success">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Claude Code Status
          </span>
          <Badge variant="success">Installed</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {version && (
          <div className="flex items-start gap-2" data-testid="version-info">
            <span className="text-sm font-medium text-neutral-700 min-w-[70px]">Version:</span>
            <span className="text-sm text-neutral-900 font-mono">{version}</span>
          </div>
        )}
        {path && (
          <div className="flex items-start gap-2" data-testid="path-info">
            <span className="text-sm font-medium text-neutral-700 min-w-[70px]">Location:</span>
            <span className="text-xs text-neutral-600 font-mono break-all">{path}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={refetch} variant="outline" size="sm" data-testid="refresh-button">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </CardFooter>
    </Card>
  );
};
