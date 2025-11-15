import { AlertCircle, AlertTriangle, OctagonAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/renderer/components/ui/alert';
import { Badge } from '@/renderer/components/ui/badge';

export interface SecurityWarning {
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
}

export interface CommandSecurityWarningsProps {
  warnings: SecurityWarning[];
}

const SEVERITY_CONFIG = {
  critical: {
    icon: OctagonAlert,
    label: 'CRITICAL',
    badgeClass: 'bg-red-500/10 text-red-700 border-red-200',
    iconClass: 'text-red-600',
  },
  high: {
    icon: AlertTriangle,
    label: 'HIGH',
    badgeClass: 'bg-orange-500/10 text-orange-700 border-orange-200',
    iconClass: 'text-orange-600',
  },
  medium: {
    icon: AlertTriangle,
    label: 'MEDIUM',
    badgeClass: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
    iconClass: 'text-yellow-600',
  },
  low: {
    icon: AlertCircle,
    label: 'LOW',
    badgeClass: 'bg-blue-500/10 text-blue-700 border-blue-200',
    iconClass: 'text-blue-600',
  },
};

export function CommandSecurityWarnings({ warnings }: CommandSecurityWarningsProps) {
  if (warnings.length === 0) return null;

  const criticalCount = warnings.filter(w => w.severity === 'critical').length;
  const highCount = warnings.filter(w => w.severity === 'high').length;
  const mediumCount = warnings.filter(w => w.severity === 'medium').length;
  const lowCount = warnings.filter(w => w.severity === 'low').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-base flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Security Warnings
        </h4>
        <div className="flex gap-2">
          {criticalCount > 0 && (
            <Badge className={SEVERITY_CONFIG.critical.badgeClass}>{criticalCount} Critical</Badge>
          )}
          {highCount > 0 && (
            <Badge className={SEVERITY_CONFIG.high.badgeClass}>{highCount} High</Badge>
          )}
          {mediumCount > 0 && (
            <Badge className={SEVERITY_CONFIG.medium.badgeClass}>{mediumCount} Medium</Badge>
          )}
          {lowCount > 0 && <Badge className={SEVERITY_CONFIG.low.badgeClass}>{lowCount} Low</Badge>}
        </div>
      </div>

      <div className="space-y-3">
        {warnings.map((warning, idx) => {
          const config = SEVERITY_CONFIG[warning.severity];
          const Icon = config.icon;

          return (
            <div key={idx} className="flex gap-3 p-4 rounded-lg border border-neutral-200 bg-white">
              <Icon className={`h-5 w-5 ${config.iconClass} flex-shrink-0 mt-0.5`} />
              <div className="flex-1">
                <div className="font-semibold text-sm mb-1">{config.label}</div>
                <div className="text-sm text-neutral-700">{warning.message}</div>
              </div>
            </div>
          );
        })}
      </div>

      {criticalCount > 0 && (
        <Alert variant="destructive">
          <OctagonAlert className="h-4 w-4" />
          <AlertTitle>Critical issues found</AlertTitle>
          <AlertDescription>Please review and fix before saving.</AlertDescription>
        </Alert>
      )}

      {highCount > 0 && criticalCount === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>High severity issues found</AlertTitle>
          <AlertDescription>You can save, but review is recommended.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
