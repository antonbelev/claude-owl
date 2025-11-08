/**
 * HookEventList - Display all 8 hook events with status
 *
 * Shows event cards with hook counts, validation status, and actions
 */

import { useState } from 'react';
import type { HookEventSummary } from '@/shared/types/hook.types';
import { HookDetailsViewer } from './HookDetailsViewer';
import './HooksManager.css';

interface HookEventListProps {
  events: HookEventSummary[];
  className?: string;
}

export function HookEventList({ events, className }: HookEventListProps) {
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
        return '✓';
      case 'yellow':
        return '⚠';
      case 'red':
        return '✕';
    }
  };

  const getScoreColorClass = (score: 'green' | 'yellow' | 'red') => {
    switch (score) {
      case 'green':
        return 'badge-green';
      case 'yellow':
        return 'badge-yellow';
      case 'red':
        return 'badge-red';
    }
  };

  return (
    <div className={className}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {events.map((eventSummary) => {
          const isExpanded = expandedEvents.has(eventSummary.event);
          const hasHooks = eventSummary.count > 0;

          return (
            <div key={eventSummary.event} className="card">
              <button
                className="collapsible-trigger"
                onClick={() => toggleEvent(eventSummary.event)}
              >
                <div className="hook-event-card">
                  <div className="hook-event-info">
                    <div className="hook-event-name">
                      <h3>
                        {eventSummary.info.name}
                      </h3>
                      <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                        ➤
                      </span>
                    </div>
                    <p className="card-description">
                      {eventSummary.info.description}
                    </p>
                  </div>

                  <div className="hook-event-badges">
                    {hasHooks && (
                      <span className={`badge ${getScoreColorClass(eventSummary.worstScore)}`}>
                        {getScoreIcon(eventSummary.worstScore)}
                      </span>
                    )}
                    <span className={`badge ${hasHooks ? 'badge-default' : 'badge-secondary'}`}>
                      {hasHooks ? `${eventSummary.count} hook${eventSummary.count > 1 ? 's' : ''}` : 'No hooks'}
                    </span>
                  </div>
                </div>

                <div className="hook-event-badges">
                  <span className="badge badge-outline">
                    Triggers: {eventSummary.info.whenTriggers}
                  </span>
                  {eventSummary.info.supportsPromptHooks && (
                    <span className="badge badge-outline">
                      Supports prompt hooks
                    </span>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="hook-details">
                  {/* Event Info */}
                  <div className="hook-event-meta">
                    <p>
                      <span style={{ fontWeight: 500 }}>Matcher required:</span>{' '}
                      {eventSummary.info.requiresMatcher ? 'Yes (specify tools)' : 'No (applies to all)'}
                    </p>
                    <p>
                      <span style={{ fontWeight: 500 }}>Available context:</span>{' '}
                      {eventSummary.info.contextVariables.join(', ')}
                    </p>
                  </div>

                  {/* Hooks List */}
                  {hasHooks ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <h4 className="card-description">
                        Configured Hooks ({eventSummary.count})
                      </h4>
                      {eventSummary.hooks.map((hook, index) => (
                        <HookDetailsViewer key={index} hook={hook} />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No hooks configured for this event</p>
                      <p className="card-description" style={{ marginTop: '0.25rem' }}>
                        Use templates below to add hooks, or edit settings.json manually
                      </p>
                    </div>
                  )}

                  {/* Documentation Link */}
                  <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                    <button
                      className="button button-ghost"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        window.electronAPI.openExternal(eventSummary.info.docsUrl);
                      }}
                    >
                      🔗 Learn more about {eventSummary.event}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
