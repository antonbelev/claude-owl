/**
 * HookTemplateGallery - Browse and copy hook templates
 *
 * Displays security-reviewed templates with copy-to-clipboard functionality
 */

import { useState } from 'react';
import { Shield, Zap, FileText, Bell, Copy, Check, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import type { HookTemplate } from '@/shared/types/hook.types';
import { useHookTemplates } from '@/renderer/hooks/useHooks';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  security: <Shield className="h-4 w-4" />,
  automation: <Zap className="h-4 w-4" />,
  logging: <FileText className="h-4 w-4" />,
  notification: <Bell className="h-4 w-4" />,
};

export function HookTemplateGallery() {
  const { data: templates, isLoading, isError } = useHookTemplates();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleCopyTemplate = async (template: HookTemplate) => {
    const jsonConfig = JSON.stringify(template.configuration, null, 2);

    // Copy JSON configuration to clipboard
    await navigator.clipboard.writeText(jsonConfig);

    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyScript = async (template: HookTemplate) => {
    if (!template.scriptContent) return;

    await navigator.clipboard.writeText(template.scriptContent);

    setCopiedId(`${template.id}-script`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-neutral-100 animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  if (isError || !templates) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load templates</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Hook Templates</h2>
          <p className="text-neutral-600 mt-1">
            Pre-built, security-reviewed hooks for common use cases
          </p>
        </div>
        <Badge variant="outline">{templates.length} templates</Badge>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {templates.map(template => {
          const categoryIcon = CATEGORY_ICONS[template.category];
          const isExpanded = expandedIds.has(template.id);

          return (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-neutral-900">{template.name}</h3>
                      <Badge
                        variant={template.securityLevel === 'green' ? 'default' : 'outline'}
                        className="flex items-center gap-1"
                      >
                        {template.securityLevel === 'green' ? (
                          <>
                            <Check className="h-3 w-3" />
                            Safe
                          </>
                        ) : (
                          'Review'
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-600">{template.description}</p>
                  </div>
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
                    {categoryIcon}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Badge variant="outline">{template.event}</Badge>
                  <Badge variant="outline" className="capitalize">
                    {template.category}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Configuration Preview */}
                <div>
                  <button
                    className="flex items-center justify-between w-full text-sm font-medium text-neutral-900 hover:text-neutral-700 mb-2"
                    onClick={() => toggleExpand(template.id)}
                  >
                    <span>Configuration</span>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {isExpanded && (
                    <pre className="p-3 bg-neutral-50 border border-neutral-200 rounded-md text-xs overflow-auto">
                      {JSON.stringify(template.configuration, null, 2)}
                    </pre>
                  )}
                </div>

                {/* Script Path */}
                {template.scriptPath && (
                  <div className="text-sm">
                    <span className="font-medium text-neutral-900">Script path:</span>{' '}
                    <code className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-xs">
                      {template.scriptPath}
                    </code>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCopyTemplate(template)}
                  >
                    {copiedId === template.id ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Configuration
                      </>
                    )}
                  </Button>

                  {template.scriptContent && (
                    <Button variant="outline" size="sm" onClick={() => handleCopyScript(template)}>
                      {copiedId === `${template.id}-script` ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Script
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Usage Note */}
                <p className="text-xs text-neutral-600 bg-blue-50 border border-blue-200 rounded-md p-2">
                  Copy the configuration and paste it into your settings.json file
                  {template.scriptContent && ' (and save the script to the specified path)'}.
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
