import React, { useState, useEffect } from 'react';
import type { MCPConnectionTestResult } from '@/shared/types';
import './ConnectionTester.css';

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
    <div className="connection-tester-overlay" onClick={onClose}>
      <div className="connection-tester-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="tester-header">
          <h2>Testing: {serverName}</h2>
          <button className="btn-close" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="tester-content">
          {testing ? (
            <div className="tester-loading">
              <div className="spinner"></div>
              <p>Testing connection...</p>
            </div>
          ) : error ? (
            <div className="tester-error">
              <h3>❌ Connection Failed</h3>
              <p className="error-message">{error}</p>
              <button className="btn-retry" onClick={runTest}>
                Try Again
              </button>
            </div>
          ) : result ? (
            <>
              {/* Success or Failure Banner */}
              <div
                className={`tester-result ${result.success ? 'result-success' : 'result-error'}`}
              >
                <h3>{result.success ? '✓ Connection Successful' : '✕ Connection Failed'}</h3>
                {result.error && <p className="error-detail">{result.error}</p>}
              </div>

              {/* Steps */}
              <div className="tester-steps">
                <h4>Test Steps</h4>
                <ul className="steps-list">
                  {result.steps.map((step, idx) => (
                    <li key={idx} className={`step step-${step.status}`}>
                      <span className="step-icon">
                        {step.status === 'success' && '✓'}
                        {step.status === 'error' && '✕'}
                        {step.status === 'pending' && '○'}
                      </span>
                      <div className="step-info">
                        <span className="step-name">{step.name}</span>
                        {step.message && <span className="step-message">{step.message}</span>}
                        {step.details && (
                          <details className="step-details">
                            <summary>View details</summary>
                            <pre>{step.details}</pre>
                          </details>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stats */}
              <div className="tester-stats">
                {result.latency !== undefined && (
                  <div className="stat-item">
                    <span className="stat-label">Latency:</span>
                    <span className="stat-value">{result.latency}ms</span>
                  </div>
                )}

                {result.tools && result.tools.length > 0 && (
                  <div className="stat-item">
                    <span className="stat-label">Tools:</span>
                    <span className="stat-value">{result.tools.length} available</span>
                  </div>
                )}
              </div>

              {/* Tools List */}
              {result.tools && result.tools.length > 0 && (
                <div className="tester-tools">
                  <h4>Available Tools</h4>
                  <ul className="tools-list">
                    {result.tools.map(tool => (
                      <li key={tool.name} className="tool-item">
                        <div className="tool-name">{tool.name}</div>
                        {tool.description && (
                          <div className="tool-description">{tool.description}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Logs */}
              {result.logs && result.logs.length > 0 && (
                <details className="tester-logs">
                  <summary>View server logs</summary>
                  <pre className="logs-content">{result.logs.join('\n')}</pre>
                </details>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="tester-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          {result && !result.success && (
            <button className="btn-retry-primary" onClick={runTest}>
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
