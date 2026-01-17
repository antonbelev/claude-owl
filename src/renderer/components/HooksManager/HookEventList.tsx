/**
 * HookEventList - Display all 8 hook events with status
 *
 * Shows event cards with hook counts, validation status, and actions
 */

import { useState } from 'react';
import { Check, AlertTriangle, X, ChevronRight, ExternalLink } from 'lucide-react';
import type { HookEventSummary, HookWithMetadata } from '@/shared/types/hook.types';
import { HookDetailsViewer } from './HookDetailsViewer';
import { Card, CardContent } from '@/renderer/components/ui/card';
import { Button } from '@/renderer/components/ui/button';
import { Badge } from '@/renderer/components/ui/badge';

interface HookEventListProps {
  events: HookEventSummary[];
  className?: string | undefined;
  /** Callback when user wants to edit a hook */
  onEditHook?: ((hook: HookWithMetadata) => void) | undefined;
  /** Callback when user wants to delete a hook */
  onDeleteHook?: ((hook: HookWithMetadata) => void) | undefined;
}

export function HookEventList({ events, className, onEditHook, onDeleteHook }: HookEventListProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const toggleEvent = (eventName: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventName)) {
      newExpanded.delete(eventName);
    } else {
      newExpanded.add(eventName);
    }
    setExpandedEvents(newExpanded);
  };

  const getScoreIcon = (score: 'green' | 'yellow' | 'red') => {
    switch (score) {
      case 'green':
        return <Check className="h-4 w-4" />;
      case 'yellow':
        return <AlertTriangle className="h-4 w-4" />;
      case 'red':
        return <X className="h-4 w-4" />;
    }
  };

  const getScoreColorClass = (score: 'green' | 'yellow' | 'red') => {
    switch (score) {
      case 'green':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'yellow':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'red':
        return 'bg-red-500/10 text-red-700 border-red-200';
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-col gap-3">
        {events.map(eventSummary => {
          const isExpanded = expandedEvents.has(eventSummary.event);
          const hasHooks = eventSummary.count > 0;

          return (
            <Card key={eventSummary.event}>
              <button
                className="w-full text-left p-6 hover:bg-neutral-50 transition-colors"
                onClick={() => toggleEvent(eventSummary.event)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base">{eventSummary.info.name}</h3>
                      <ChevronRight
                        className={`h-4 w-4 text-neutral-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">{eventSummary.info.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasHooks && (
                      <Badge
                        variant="outline"
                        className={getScoreColorClass(eventSummary.worstScore)}
                      >
                        {getScoreIcon(eventSummary.worstScore)}
                      </Badge>
                    )}
                    <Badge variant={hasHooks ? 'default' : 'secondary'}>
                      {hasHooks
                        ? `${eventSummary.count} hook${eventSummary.count > 1 ? 's' : ''}`
                        : 'No hooks'}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="outline">Triggers: {eventSummary.info.whenTriggers}</Badge>
                  {eventSummary.info.supportsPromptHooks && (
                    <Badge variant="outline">Supports prompt hooks</Badge>
                  )}
                </div>
              </button>

              {isExpanded && (
                <CardContent className="pt-0 space-y-4">
                  {/* Event Info */}
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Matcher required:</span>{' '}
                      {eventSummary.info.requiresMatcher
                        ? 'Yes (specify tools)'
                        : 'No (applies to all)'}
                    </p>
                    <p>
                      <span className="font-medium">Available context:</span>{' '}
                      {eventSummary.info.contextVariables.join(', ')}
                    </p>
                  </div>

                  {/* Hooks List */}
                  {hasHooks ? (
                    <div className="flex flex-col gap-3">
                      <h4 className="text-sm text-neutral-600">
                        Configured Hooks ({eventSummary.count})
                      </h4>
                      {eventSummary.hooks.map((hook, index) => (
                        <HookDetailsViewer
                          key={index}
                          hook={hook}
                          onEdit={onEditHook}
                          onDelete={onDeleteHook}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-neutral-50 rounded-lg p-6 text-center">
                      <p className="text-neutral-900 font-medium">
                        No hooks configured for this event
                      </p>
                      <p className="text-sm text-neutral-600 mt-1">
                        Use templates below to add hooks, or edit settings.json manually
                      </p>
                    </div>
                  )}

                  {/* Documentation Link */}
                  <div className="pt-4 border-t border-neutral-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        window.electronAPI.openExternal(eventSummary.info.docsUrl);
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Learn more about {eventSummary.event}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
