/**
 * Security Warning Dialog Component
 *
 * Displays security warnings and risk assessment before adding a server.
 *
 * @see ADR-010: Remote MCP Servers Discovery & Connection Verification
 */

import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import type { RemoteMCPServer, SecurityContext, SecurityWarning } from '@/shared/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';

export interface SecurityWarningDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Handler to close the dialog */
  onOpenChange: (open: boolean) => void;
  /** The server to add */
  server: RemoteMCPServer;
  /** Security context */
  securityContext: SecurityContext;
  /** Security warnings */
  warnings: SecurityWarning[];
  /** Handler when user confirms */
  onConfirm: () => void;
}

/**
 * Get icon for warning severity
 */
function getWarningIcon(severity: SecurityWarning['severity']) {
  switch (severity) {
    case 'critical':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'info':
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
}

/**
 * Get background color for warning severity
 */
function getWarningBg(severity: SecurityWarning['severity']) {
  switch (severity) {
    case 'critical':
      return 'bg-red-50 border-red-200';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200';
    case 'info':
    default:
      return 'bg-blue-50 border-blue-200';
  }
}

/**
 * Get risk level badge variant
 */
function getRiskBadgeVariant(
  riskLevel: SecurityContext['riskLevel']
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (riskLevel) {
    case 'low':
      return 'secondary';
    case 'medium':
      return 'default';
    case 'high':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Get risk level icon
 */
function getRiskIcon(riskLevel: SecurityContext['riskLevel']) {
  switch (riskLevel) {
    case 'low':
      return <ShieldCheck className="h-4 w-4 text-green-500" />;
    case 'medium':
      return <ShieldAlert className="h-4 w-4 text-yellow-500" />;
    case 'high':
      return <ShieldAlert className="h-4 w-4 text-red-500" />;
    default:
      return <ShieldAlert className="h-4 w-4 text-neutral-400" />;
  }
}

/**
 * Security Warning Dialog Component
 */
export const SecurityWarningDialog: React.FC<SecurityWarningDialogProps> = ({
  open,
  onOpenChange,
  server,
  securityContext,
  warnings,
  onConfirm,
}) => {
  const hasCriticalWarnings = warnings.some(w => w.severity === 'critical');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-yellow-500" />
            Security Assessment
          </DialogTitle>
          <DialogDescription>
            Review the security information before adding {server.name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Risk Level Overview */}
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-2">
              {getRiskIcon(securityContext.riskLevel)}
              <span className="font-medium">Risk Level</span>
            </div>
            <Badge variant={getRiskBadgeVariant(securityContext.riskLevel)}>
              {securityContext.riskLevel.toUpperCase()}
            </Badge>
          </div>

          {/* Trust Indicators */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-neutral-700">Trust Indicators</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                {securityContext.isVerifiedProvider ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span>Verified Provider</span>
              </div>
              <div className="flex items-center gap-2">
                {securityContext.isOfficialServer ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-neutral-400" />
                )}
                <span>Official Source</span>
              </div>
              <div className="flex items-center gap-2">
                {securityContext.hasValidTLS ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span>Valid TLS</span>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          {securityContext.riskFactors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-neutral-700">Risk Factors</h4>
              <ul className="text-sm space-y-1 text-neutral-600">
                {securityContext.riskFactors.map((factor, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requested Permissions */}
          {securityContext.requestedScopes && securityContext.requestedScopes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-neutral-700">Requested Permissions</h4>
              <div className="flex flex-wrap gap-1">
                {securityContext.requestedScopes.map((scope, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {scope}
                  </Badge>
                ))}
              </div>
              {securityContext.dataAccessDescription && (
                <p className="text-xs text-neutral-500">{securityContext.dataAccessDescription}</p>
              )}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <Alert key={index} className={getWarningBg(warning.severity)}>
                  {getWarningIcon(warning.severity)}
                  <AlertTitle className="text-sm">{warning.title}</AlertTitle>
                  <AlertDescription className="text-xs">
                    {warning.description}
                    {warning.recommendation && (
                      <p className="mt-1 font-medium">{warning.recommendation}</p>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Documentation Link */}
          {server.documentationUrl && (
            <div className="pt-2 border-t">
              <a
                href={server.documentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="h-3 w-3" />
                View Server Documentation
              </a>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant={hasCriticalWarnings ? 'destructive' : 'default'}
          >
            {hasCriticalWarnings ? 'I Understand, Continue' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
