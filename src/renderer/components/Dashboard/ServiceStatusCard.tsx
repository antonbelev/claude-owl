import React, { useState } from 'react';
import { useServiceStatus } from '../../hooks/useServiceStatus';
import type { ServiceStatusLevel, ServiceIncident } from '@/shared/types';

const STATUS_PAGE_URL = 'https://status.claude.com';

// Status indicators with colors and icons
const STATUS_INDICATORS: Record<
  ServiceStatusLevel,
  { color: string; icon: string; label: string }
> = {
  operational: {
    color: '#22c55e',
    icon: '✓',
    label: 'Operational',
  },
  degraded: {
    color: '#f59e0b',
    icon: '⚠',
    label: 'Degraded Performance',
  },
  outage: {
    color: '#ef4444',
    icon: '✕',
    label: 'Service Outage',
  },
  maintenance: {
    color: '#3b82f6',
    icon: '🔧',
    label: 'Maintenance',
  },
  unknown: {
    color: '#9ca3af',
    icon: '?',
    label: 'Unknown',
  },
};

export const ServiceStatusCard: React.FC = () => {
  const { loading, status, error, refetch } = useServiceStatus();
  const [showAllIncidents, setShowAllIncidents] = useState(false);

  const openStatusPage = () => {
    if (window.electronAPI) {
      window.electronAPI.openExternal(STATUS_PAGE_URL);
    }
  };

  const formatTimestamp = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 3) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const cleanHtmlMessage = (message: string): string => {
    // Remove HTML tags and decode entities
    return message
      .replace(/<[^>]*>/g, ' ') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
  };

  const renderIncident = (incident: ServiceIncident) => {
    const indicator = STATUS_INDICATORS[incident.resolved ? 'operational' : 'degraded'];

    return (
      <div
        key={incident.id}
        className="incident-item"
        style={{
          padding: '0.75rem',
          marginTop: '0.75rem',
          background: '#f9fafb',
          borderRadius: '6px',
          borderLeft: `3px solid ${indicator.color}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '0.125rem' }}>
            {indicator.icon}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Incident Title */}
            <div
              style={{
                fontWeight: 600,
                color: '#1f2937',
                fontSize: '0.875rem',
                marginBottom: '0.5rem',
                lineHeight: '1.4',
              }}
            >
              {incident.title}
            </div>

            {/* Updates Timeline */}
            {incident.updates.length > 0 && (
              <div style={{ marginBottom: '0.5rem' }}>
                {incident.updates.map((update, index) => (
                  <div
                    key={index}
                    style={{
                      fontSize: '0.75rem',
                      marginBottom: index < incident.updates.length - 1 ? '0.375rem' : 0,
                      paddingBottom: index < incident.updates.length - 1 ? '0.375rem' : 0,
                      borderBottom:
                        index < incident.updates.length - 1 ? '1px solid #e5e7eb' : 'none',
                    }}
                  >
                    <div style={{ color: '#4b5563', fontWeight: 500, marginBottom: '0.125rem' }}>
                      {update.status}
                    </div>
                    <div
                      style={{
                        color: '#6b7280',
                        lineHeight: '1.4',
                        wordBreak: 'break-word',
                      }}
                    >
                      {cleanHtmlMessage(update.message)}
                    </div>
                    <div style={{ color: '#9ca3af', marginTop: '0.125rem', fontSize: '0.7rem' }}>
                      {formatTimestamp(update.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Status and Time Footer */}
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.375rem' }}>
              <span>Reported {formatTimestamp(incident.publishedAt)}</span>
              {incident.resolved && (
                <span style={{ marginLeft: '0.5rem', color: '#22c55e', fontWeight: 500 }}>
                  ✓ Resolved
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !status) {
    return (
      <div className="status-card" data-testid="service-status-card">
        <h2>Claude Service Status</h2>
        <p>Checking service status...</p>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="status-card status-error" data-testid="service-status-card">
        <h2>Claude Service Status</h2>
        <p className="error-message">Error: {error}</p>
        <button onClick={refetch} data-testid="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="status-card" data-testid="service-status-card">
        <h2>Claude Service Status</h2>
        <p className="help-text">Unable to load status information</p>
        <button onClick={refetch} data-testid="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  const indicator = STATUS_INDICATORS[status.level];
  const displayedIncidents = showAllIncidents
    ? status.recentIncidents
    : status.recentIncidents.slice(0, 2);

  return (
    <div className="status-card" data-testid="service-status-card">
      <h2>Claude Service Status</h2>

      {/* Overall Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: indicator.color,
            flexShrink: 0,
          }}
        />
        <div>
          <div style={{ fontWeight: 600, color: '#333', fontSize: '1rem' }}>{indicator.label}</div>
          <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.125rem' }}>
            {status.message}
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      {status.recentIncidents.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#333',
              marginBottom: '0.5rem',
            }}
          >
            Recent Activity (Last 3 Days)
          </div>
          {displayedIncidents.map(renderIncident)}

          {status.recentIncidents.length > 2 && (
            <button
              onClick={() => setShowAllIncidents(!showAllIncidents)}
              style={{
                marginTop: '0.5rem',
                padding: '0.375rem 0.75rem',
                fontSize: '0.8rem',
                background: 'transparent',
                color: '#3b82f6',
                border: '1px solid #3b82f6',
              }}
            >
              {showAllIncidents ? 'Show Less' : `Show ${status.recentIncidents.length - 2} More`}
            </button>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e5e7eb',
        }}
      >
        <button onClick={openStatusPage} style={{ flex: 1 }}>
          View Full Status
        </button>
        <button
          onClick={refetch}
          data-testid="refresh-button"
          style={{ background: '#6b7280', flex: 1 }}
        >
          Refresh
        </button>
      </div>

      {/* Last Checked */}
      <div
        style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.75rem', textAlign: 'center' }}
      >
        Last checked: {formatTimestamp(status.lastChecked)}
      </div>
    </div>
  );
};
