import React, { useState, useEffect } from 'react';
import './SessionsPage.css';

export const SessionsPage: React.FC = () => {
  const [installed, setInstalled] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [rawOutput, setRawOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsageData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if ccusage is installed
      const installCheck = (await window.electronAPI.checkCCUsageInstalled()) as {
        success: boolean;
        installed: boolean;
      };

      if (!installCheck.success || !installCheck.installed) {
        setInstalled(false);
        setLoading(false);
        return;
      }

      setInstalled(true);

      // Get version
      const versionResp = (await window.electronAPI.getCCUsageVersion()) as {
        success: boolean;
        version: string | null;
      };
      if (versionResp.success && versionResp.version) {
        setVersion(versionResp.version);
      }

      // Get raw output
      if (window.electronAPI.getCCUsageRawOutput) {
        const outputResp = (await window.electronAPI.getCCUsageRawOutput()) as {
          success: boolean;
          data?: string;
          error?: string;
        };
        if (outputResp.success && outputResp.data) {
          setRawOutput(outputResp.data);
        } else {
          setError(outputResp.error || 'Failed to load usage data');
        }
      } else {
        setError('getCCUsageRawOutput not available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsageData();
  }, []);

  if (loading) {
    return (
      <div className="page sessions-page">
        <div className="usage-header">
          <h1>Token Usage & Costs</h1>
        </div>
        <div className="usage-loading">
          <p>Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (!installed) {
    return (
      <div className="page sessions-page">
        <div className="usage-header">
          <h1>Token Usage & Costs</h1>
          <p className="header-subtitle">Track your Claude Code API usage and costs</p>
        </div>

        <div className="usage-not-installed">
          <div className="not-installed-icon">📊</div>
          <h2>ccusage Not Installed</h2>
          <p>
            To view your token usage and costs, you need to install <code>ccusage</code>, a CLI tool
            that analyzes your Claude Code usage.
          </p>

          <div className="installation-steps">
            <h3>Installation Instructions</h3>
            <ol>
              <li>
                Install ccusage using npm:
                <pre className="code-block">npm install -g ccusage</pre>
              </li>
              <li>
                Run ccusage in your terminal to verify:
                <pre className="code-block">ccusage</pre>
              </li>
              <li>Refresh this page to see your usage data</li>
            </ol>
          </div>

          <div className="installation-links">
            <a
              href="https://github.com/ryoppippi/ccusage"
              onClick={e => {
                e.preventDefault();
                window.electronAPI?.openExternal('https://github.com/ryoppippi/ccusage');
              }}
              className="btn-github"
            >
              <span>📦</span> View on GitHub
            </a>
            <button onClick={loadUsageData} className="btn-refresh">
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page sessions-page">
        <div className="usage-header">
          <h1>Token Usage & Costs</h1>
        </div>
        <div className="usage-error">
          <p className="error-message">{error}</p>
          <button onClick={loadUsageData} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page sessions-page">
      <div className="usage-header">
        <div>
          <h1>Token Usage & Costs</h1>
          {version && <p className="usage-version">ccusage {version}</p>}
        </div>
        <button onClick={loadUsageData} className="btn-refresh">
          🔄 Refresh Data
        </button>
      </div>

      {rawOutput ? (
        <div className="usage-output">
          <pre className="output-content">{rawOutput}</pre>
        </div>
      ) : (
        <div className="usage-empty">
          <div className="empty-icon">📈</div>
          <h3>No Usage Data</h3>
          <p>Run ccusage in your terminal to generate usage statistics, then refresh this page.</p>
        </div>
      )}
    </div>
  );
};
