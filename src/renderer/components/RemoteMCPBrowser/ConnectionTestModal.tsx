/**
 * Connection Test Modal Component
 *
 * Shows detailed connection test progress and results.
 *
 * @see ADR-010: Remote MCP Servers Discovery & Connection Verification
 */

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Clock,
  Wifi,
  Lock,
} from 'lucide-react';
import type { RemoteMCPServer, ConnectionTestResult, ConnectionTestStep } from '@/shared/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';

export interface ConnectionTestModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Handler to close the modal */
  onOpenChange: (open: boolean) => void;
  /** The server being tested */
  server: RemoteMCPServer;
  /** Test function */
  onTest: (url: string, transport: 'http' | 'sse') => Promise<ConnectionTestResult>;
  /** Handler when user wants to proceed with adding */
  onContinueToSetup?: () => void;
}

/**
 * Get icon for step status
 */
function getStepIcon(status: ConnectionTestStep['status']) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'pending':
    default:
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
  }
}

/**
 * Get step icon based on step name
 */
function getStepTypeIcon(stepName: string) {
  if (stepName.toLowerCase().includes('dns')) {
    return <Wifi className="h-4 w-4 text-neutral-400" />;
  }
  if (stepName.toLowerCase().includes('tls') || stepName.toLowerCase().includes('ssl')) {
    return <Lock className="h-4 w-4 text-neutral-400" />;
  }
  if (stepName.toLowerCase().includes('http')) {
    return <Clock className="h-4 w-4 text-neutral-400" />;
  }
  if (stepName.toLowerCase().includes('mcp')) {
    return <ShieldCheck className="h-4 w-4 text-neutral-400" />;
  }
  return null;
}

/**
 * Connection Test Modal Component
 */
export const ConnectionTestModal: React.FC<ConnectionTestModalProps> = ({
  open,
  onOpenChange,
  server,
  onTest,
  onContinueToSetup,
}) => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionTestResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Start test when modal opens
  useEffect(() => {
    if (open && !result && !testing) {
      runTest();
    }
  }, [open]);

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    setCurrentStep(0);

    try {
      // Simulate step progress
      const steps = ['DNS Resolution', 'TLS/SSL Verification', 'HTTP Reachability', 'MCP Protocol Detection'];
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i + 1);
        await new Promise(resolve => setTimeout(resolve, 300)); // Visual feedback
      }

      const testResult = await onTest(server.endpoint, server.transport);
      setResult(testResult);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        errorCode: 'NETWORK_ERROR',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    runTest();
  };

  const handleContinue = () => {
    if (onContinueToSetup) {
      onContinueToSetup();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connection Test</DialogTitle>
          <DialogDescription>
            Testing connection to {server.name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Server Info */}
          <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{server.name}</span>
              {server.verified && (
                <span title="Verified">
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500 truncate">{server.endpoint}</p>
          </div>

          {/* Test Steps */}
          <div className="space-y-3">
            {testing && !result && (
              <>
                {['DNS Resolution', 'TLS/SSL Verification', 'HTTP Reachability', 'MCP Protocol Detection'].map(
                  (stepName, index) => (
                    <div
                      key={stepName}
                      className={`flex items-center gap-3 p-2 rounded ${
                        index < currentStep
                          ? 'bg-green-50'
                          : index === currentStep - 1
                            ? 'bg-blue-50'
                            : 'bg-neutral-50'
                      }`}
                    >
                      {index < currentStep - 1 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : index === currentStep - 1 ? (
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-neutral-300" />
                      )}
                      <span className="text-sm">{stepName}</span>
                    </div>
                  )
                )}
              </>
            )}

            {/* Results */}
            {result && (
              <>
                {result.steps?.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-2 rounded ${
                      step.status === 'success'
                        ? 'bg-green-50'
                        : step.status === 'warning'
                          ? 'bg-yellow-50'
                          : step.status === 'error'
                            ? 'bg-red-50'
                            : 'bg-neutral-50'
                    }`}
                  >
                    {getStepIcon(step.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getStepTypeIcon(step.name)}
                        <span className="text-sm font-medium">{step.name}</span>
                      </div>
                      {step.details && (
                        <p className="text-xs text-neutral-500 mt-0.5">{step.details}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Overall Result */}
                <div className="mt-4">
                  {result.success ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-800">
                        <span className="font-medium">Server is reachable and appears to be a valid MCP server</span>
                        {result.latencyMs && (
                          <span className="text-xs ml-2">({result.latencyMs}ms)</span>
                        )}
                        {server.authType !== 'open' && (
                          <p className="mt-1 text-sm">
                            Authentication Required: {server.authType.toUpperCase()}
                          </p>
                        )}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <span className="font-medium">Connection failed</span>
                        {result.error && <p className="mt-1 text-sm">{result.error}</p>}
                        {result.suggestions && result.suggestions.length > 0 && (
                          <ul className="mt-2 text-xs space-y-1">
                            {result.suggestions.map((suggestion, i) => (
                              <li key={i}>• {suggestion}</li>
                            ))}
                          </ul>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {result && !result.success && (
            <Button variant="outline" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
          {result?.success && onContinueToSetup && (
            <Button onClick={handleContinue}>
              Continue to Setup
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
