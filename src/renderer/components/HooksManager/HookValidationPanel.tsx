/**
 * HookValidationPanel - Display validation results for a hook
 *
 * Shows security score and issues with severity indicators
 */

import { CheckCircle2, AlertTriangle, XCircle, Info, Lightbulb } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import type { HookValidationResult, SecurityScore } from '@/shared/types/hook.types';

interface HookValidationPanelProps {
  validation: HookValidationResult;
  className?: string;
}

const SCORE_CONFIG: Record<
  SecurityScore,
  {
    label: string;
    icon: React.ReactNode;
    variant: 'default' | 'destructive' | 'outline' | 'secondary';
    description: string;
  }
> = {
  green: {
    label: 'Safe',
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: 'default',
    description: 'No security issues detected',
  },
  yellow: {
    label: 'Caution',
    icon: <AlertTriangle className="h-3 w-3" />,
    variant: 'outline',
    description: 'Review recommended - potential risks detected',
  },
  red: {
    label: 'Danger',
    icon: <XCircle className="h-3 w-3" />,
    variant: 'destructive',
    description: 'Critical security issues - do not use',
  },
};

export function HookValidationPanel({ validation, className }: HookValidationPanelProps) {
  const scoreConfig = SCORE_CONFIG[validation.score];

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityVariant = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return 'destructive' as const;
      case 'warning':
        return 'default' as const;
      case 'info':
        return 'default' as const;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <span className="text-sm text-neutral-600">Security Validation</span>
        <Badge variant={scoreConfig.variant} className="flex items-center gap-1">
          {scoreConfig.icon}
          {scoreConfig.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-neutral-600">{scoreConfig.description}</p>

        {validation.issues.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-neutral-900">
              Issues ({validation.issues.length})
            </h4>
            <div className="space-y-2">
              {validation.issues.map((issue, index) => (
                <Alert key={index} variant={getSeverityVariant(issue.severity)}>
                  {getSeverityIcon(issue.severity)}
                  <AlertDescription className="space-y-1">
                    <p className="text-sm font-medium">{issue.message}</p>
                    {issue.suggestion && (
                      <p className="text-xs flex items-start gap-1">
                        <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {issue.suggestion}
                      </p>
                    )}
                    {issue.code && <p className="text-xs text-neutral-500">Code: {issue.code}</p>}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {validation.issues.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-900 font-medium">All security checks passed</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
