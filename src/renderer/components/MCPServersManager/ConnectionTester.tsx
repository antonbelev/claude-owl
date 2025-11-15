import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Loader2, Clock, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import type { MCPConnectionTestResult } from '@/shared/types';

interface ConnectionTesterProps {
  serverName: string;
  onTest: (serverName: string) => Promise<MCPConnectionTestResult>;
  onClose: () => void;
}

export const ConnectionTester: React.FC<ConnectionTesterProps> = ({
  serverName,
  onTest,
  onClose,
}) => {
  const [testing, setTesting] = useState(true);
  const [result, setResult] = useState<MCPConnectionTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Run the test on mount
   */
  useEffect(() => {
    runTest();
  }, []);

  /**
   * Run connection test
   */
  const runTest = async () => {
    try {
      setTesting(true);
      setError(null);
      console.log('[ConnectionTester] Starting test for:', serverName);

      const testResult = await onTest(serverName);
      setResult(testResult);

      console.log('[ConnectionTester] Test completed:', testResult);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Test failed';
      console.error('[ConnectionTester] Test error:', message);
      setError(message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Testing: {serverName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {testing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
              <p className="text-neutral-600">Testing connection...</p>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <h3 className="font-semibold mb-2">Connection Failed</h3>
                  <p>{error}</p>
                </AlertDescription>
              </Alert>
              <Button onClick={runTest} className="w-full">
                Try Again
              </Button>
            </div>
          ) : result ? (
            <>
              {/* Success or Failure Banner */}
              <Alert variant={result.success ? 'default' : 'destructive'}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <h3 className="font-semibold">
                    {result.success ? 'Connection Successful' : 'Connection Failed'}
                  </h3>
                  {result.error && <p className="mt-1 text-sm">{result.error}</p>}
                </AlertDescription>
              </Alert>

              {/* Steps */}
              <div className="space-y-3">
                <h4 className="font-semibold text-neutral-900">Test Steps</h4>
                <ul className="space-y-2">
                  {result.steps.map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-3 border border-neutral-200 rounded-md"
                    >
                      <span className="mt-0.5">
                        {step.status === 'success' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {step.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                        {step.status === 'pending' && (
                          <div className="h-5 w-5 border-2 border-neutral-300 rounded-full" />
                        )}
                      </span>
                      <div className="flex-1 space-y-1">
                        <span className="font-medium text-neutral-900">{step.name}</span>
                        {step.message && <p className="text-sm text-neutral-600">{step.message}</p>}
                        {step.details && (
                          <details className="mt-2">
                            <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                              View details
                            </summary>
                            <pre className="mt-2 p-2 bg-neutral-50 border border-neutral-200 rounded text-xs overflow-auto">
                              {step.details}
                            </pre>
                          </details>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stats */}
              <div className="flex gap-4">
                {result.latency !== undefined && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-md">
                    <Clock className="h-4 w-4 text-neutral-600" />
                    <div>
                      <div className="text-xs text-neutral-600">Latency</div>
                      <div className="font-semibold text-neutral-900">{result.latency}ms</div>
                    </div>
                  </div>
                )}

                {result.tools && result.tools.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-md">
                    <Package className="h-4 w-4 text-neutral-600" />
                    <div>
                      <div className="text-xs text-neutral-600">Tools</div>
                      <div className="font-semibold text-neutral-900">
                        {result.tools.length} available
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tools List */}
              {result.tools && result.tools.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-neutral-900">Available Tools</h4>
                  <ul className="space-y-2">
                    {result.tools.map((tool: any) => (
                      <li key={tool.name} className="p-3 border border-neutral-200 rounded-md">
                        <div className="font-medium text-neutral-900">{tool.name}</div>
                        {tool.description && (
                          <div className="text-sm text-neutral-600 mt-1">{tool.description}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Logs */}
              {result.logs && result.logs.length > 0 && (
                <details className="border border-neutral-200 rounded-md p-3">
                  <summary className="font-medium text-neutral-900 cursor-pointer hover:text-neutral-700">
                    View server logs
                  </summary>
                  <pre className="mt-3 p-3 bg-neutral-50 rounded text-xs overflow-auto max-h-64">
                    {result.logs.join('\n')}
                  </pre>
                </details>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex gap-4 pt-4 border-t border-neutral-200">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          {result && !result.success && (
            <Button onClick={runTest} className="flex-1">
              Try Again
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
