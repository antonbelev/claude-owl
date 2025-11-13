/**
 * HooksPage - Main page for Hooks Manager (Phase 1)
 *
 * Read-only hooks viewing, validation, and template library
 */

import { useState } from 'react';
import { SecurityWarningBanner } from '@/renderer/components/HooksManager/SecurityWarningBanner';
import { HookEventList } from '@/renderer/components/HooksManager/HookEventList';
import { HookTemplateGallery } from '@/renderer/components/HooksManager/HookTemplateGallery';
import { useAllHooks } from '@/renderer/hooks/useHooks';
import '../components/HooksManager/HooksManager.css';

export function HooksPage() {
  const { data: events, isLoading, isError, error, refetch, isRefetching } = useAllHooks();
  const [activeTab, setActiveTab] = useState<'hooks' | 'templates'>('hooks');

  return (
    <div className="hooks-page">
      {/* Page Header */}
      <div className="hooks-header">
        <div>
          <h1 className="hooks-title">Hooks Manager</h1>
          <p className="hooks-description">
            View and manage Claude Code hooks with security validation
          </p>
        </div>
        <button className="refresh-button" onClick={() => refetch()} disabled={isRefetching}>
          <span className={`refresh-icon ${isRefetching ? 'spinning' : ''}`}>⟳</span>
          Refresh
        </button>
      </div>

      {/* Security Warning */}
      <SecurityWarningBanner />

      {/* Main Content */}
      {isLoading ? (
        <div>
          <div className="skeleton" style={{ height: '3rem' }} />
          <div className="skeleton" style={{ height: '16rem' }} />
          <div className="skeleton" style={{ height: '16rem' }} />
        </div>
      ) : isError ? (
        <div className="error-card">
          <div className="error-icon">⚠</div>
          <h3 className="error-title">Failed to load hooks</h3>
          <p className="error-message">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
          <button onClick={() => refetch()} className="button button-outline">
            ⟳ Try Again
          </button>
        </div>
      ) : (
        <div className="tabs">
          {/* Tabs */}
          <div className="tabs-list">
            <button
              className={`tab-trigger ${activeTab === 'hooks' ? 'active' : ''}`}
              onClick={() => setActiveTab('hooks')}
            >
              Configured Hooks
              {events && (
                <span className="tab-badge">{events.reduce((sum, e) => sum + e.count, 0)}</span>
              )}
            </button>
            <button
              className={`tab-trigger ${activeTab === 'templates' ? 'active' : ''}`}
              onClick={() => setActiveTab('templates')}
            >
              Templates
            </button>
          </div>

          {/* Configured Hooks Tab */}
          {activeTab === 'hooks' && (
            <div className="tab-content">
              {events && events.length > 0 ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Hook Events</h2>
                      <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                        All {events.length} Claude Code hook events
                      </p>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      {events.filter(e => e.count > 0).length} events with hooks
                    </div>
                  </div>
                  <HookEventList events={events} />
                </>
              ) : (
                <div className="empty-state">
                  <p>No hook events found</p>
                </div>
              )}
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="tab-content">
              <HookTemplateGallery />
            </div>
          )}
        </div>
      )}

      {/* Footer Note */}
      <div className="footer-note">
        <p className="footer-note-title">📝 Phase 1: Read-Only Mode</p>
        <p>
          This is Phase 1 implementation focused on viewing and validation. To modify hooks, use the
          &quot;Edit in settings.json&quot; button to open the file in your external editor.
          Template-based editing will be available in Phase 2.
        </p>
      </div>
    </div>
  );
}
