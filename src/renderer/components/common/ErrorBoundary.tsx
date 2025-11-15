import React, { Component, ReactNode } from 'react';
import { AlertCircle, Copy, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const errorText = `
Error: ${error?.message || 'Unknown error'}

Stack Trace:
${error?.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}

User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
`.trim();

    navigator.clipboard.writeText(errorText).then(
      () => {
        alert('Error details copied to clipboard! Please paste this when reporting the issue.');
      },
      err => {
        console.error('Failed to copy error details:', err);
        // Fallback: show the error in a prompt
        prompt('Failed to copy automatically. Please copy this error manually:', errorText);
      }
    );
  };

  override render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
                  <p className="text-gray-600">
                    The application encountered an unexpected error
                  </p>
                </div>
              </div>

              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong className="font-semibold">Error:</strong> {error?.message || 'Unknown error'}
                </AlertDescription>
              </Alert>

              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Technical Details</h2>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-64 text-xs font-mono">
                  <pre className="whitespace-pre-wrap break-words">
                    {error?.stack || 'No stack trace available'}
                  </pre>
                  {errorInfo?.componentStack && (
                    <>
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="text-gray-400 mb-2">Component Stack:</div>
                        <pre className="whitespace-pre-wrap break-words text-gray-300">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={this.handleReset} variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleCopyError} variant="default" className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Error Details
                </Button>
                <Button onClick={this.handleReload} variant="secondary" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload App
                </Button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong className="font-semibold">Need help?</strong> Please copy the error details
                  above and report this issue on{' '}
                  <a
                    href="https://github.com/anthropics/claude-owl/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-700"
                  >
                    GitHub
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
