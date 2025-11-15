/**
 * HookDetailsViewer - Read-only display of hook configuration
 *
 * Shows hook details with syntax highlighting and validation
 */

import { Edit, ExternalLink } from 'lucide-react';
import type { HookWithMetadata } from '@/shared/types/hook.types';
import { HookValidationPanel } from './HookValidationPanel';
import { useOpenSettingsFile } from '@/renderer/hooks/useHooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/renderer/components/ui/card';
import { Button } from '@/renderer/components/ui/button';
import { Badge } from '@/renderer/components/ui/badge';

interface HookDetailsViewerProps {
  hook: HookWithMetadata;
  className?: string;
}

export function HookDetailsViewer({ hook, className }: HookDetailsViewerProps) {
  const openSettingsFile = useOpenSettingsFile();

  const handleOpenSettings = () => {
    // Map 'local' to 'project' for opening settings file
    const location = hook.location === 'local' ? 'project' : hook.location;
    openSettingsFile.mutate({
      location: location as 'user' | 'project',
    });
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-base">
                {hook.event} Hook #{hook.hookIndex + 1}
              </CardTitle>
              <CardDescription className="mt-1">
                {hook.configuration.matcher ? (
                  <>
                    Matches tools:{' '}
                    <code className="font-mono text-xs bg-neutral-100 px-1 py-0.5 rounded">
                      {hook.configuration.matcher}
                    </code>
                  </>
                ) : (
                  'Applies to all tool invocations'
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{hook.location}</Badge>
              <Badge variant={hook.hook.type === 'command' ? 'default' : 'secondary'}>
                {hook.hook.type}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Hook Configuration */}
          <div>
            <h4 className="text-sm text-neutral-600 mb-2">Configuration</h4>
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <pre className="text-xs text-neutral-900 overflow-x-auto">
                {JSON.stringify(hook.hook, null, 2)}
              </pre>
            </div>
          </div>

          {/* Command/Prompt Content */}
          {hook.hook.command && (
            <div>
              <h4 className="text-sm text-neutral-600 mb-2">Bash Command</h4>
              <div className="bg-neutral-900 text-neutral-100 rounded-lg p-4">
                <code className="text-sm whitespace-pre-wrap">{hook.hook.command}</code>
              </div>
            </div>
          )}

          {hook.hook.prompt && (
            <div>
              <h4 className="text-sm text-neutral-600 mb-2">LLM Prompt</h4>
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                <div className="text-sm whitespace-pre-wrap">{hook.hook.prompt}</div>
              </div>
            </div>
          )}

          {/* Timeout */}
          {hook.hook.timeout && (
            <div>
              <h4 className="text-sm text-neutral-600 mb-2">Timeout</h4>
              <p className="text-sm text-neutral-600">{hook.hook.timeout} seconds</p>
            </div>
          )}

          {/* Validation Results */}
          <div>
            <HookValidationPanel validation={hook.validation} />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-neutral-200">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenSettings}
              disabled={openSettingsFile.isPending}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit in settings.json
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                window.electronAPI.openExternal('https://code.claude.com/docs/en/hooks');
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
