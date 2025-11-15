/**
 * SecurityWarningBanner - Prominent security warning for hooks
 *
 * Displays critical security information at the top of Hooks Manager
 */

import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';

export function SecurityWarningBanner() {
  return (
    <Alert variant="destructive" className="border-2">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-lg font-bold">Security Warning</AlertTitle>
      <AlertDescription className="space-y-4 mt-2">
        <p className="text-sm">
          Claude Code hooks execute arbitrary commands on your system automatically during agent
          operations. Hooks run with your current environment&apos;s credentials.
        </p>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Malicious hooks can:</p>
          <ul className="text-sm list-disc list-inside space-y-1 ml-2">
            <li>Exfiltrate your data</li>
            <li>Modify or delete files</li>
            <li>Execute unauthorized commands</li>
            <li>Compromise your system security</li>
          </ul>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-2">
          <p className="text-sm font-semibold text-red-900">Before creating or enabling hooks:</p>
          <ul className="text-sm list-disc list-inside space-y-1 ml-2 text-red-900">
            <li>Always review hook code carefully</li>
            <li>Only use hooks from trusted sources</li>
            <li>Understand what each command does</li>
            <li>Test hooks in safe environments first</li>
          </ul>
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.electronAPI.openExternal('https://code.claude.com/docs/en/hooks');
            }}
            className="gap-2"
          >
            <ExternalLink className="h-3 w-3" />
            Claude Code Hooks Documentation
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
