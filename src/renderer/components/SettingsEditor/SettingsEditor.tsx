import React, { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import type { ConfigLevel } from '@/shared/types';
import { SettingsHierarchyTab } from './SettingsHierarchyTab';
import { EffectiveSettingsTab } from './EffectiveSettingsTab';
import './SettingsEditor.css';

type TabType = 'user' | 'project' | 'local' | 'managed' | 'effective';

export const SettingsEditor: React.FC = () => {
  const { loading, error, effectiveConfig, refetch } = useSettings();
  const [activeTab, setActiveTab] = useState<TabType>('effective');

  if (loading) {
    return (
      <div className="settings-editor" data-testid="settings-editor">
        <div className="settings-header">
          <h1>Settings Editor</h1>
        </div>
        <div className="settings-loading">
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-editor" data-testid="settings-editor">
        <div className="settings-header">
          <h1>Settings Editor</h1>
        </div>
        <div className="settings-error">
          <p className="error-message">Error: {error}</p>
          <button onClick={refetch} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'effective':
        return <EffectiveSettingsTab effectiveConfig={effectiveConfig} />;
      case 'user':
      case 'project':
      case 'local':
      case 'managed':
        return <SettingsHierarchyTab level={activeTab as ConfigLevel} />;
      default:
        return null;
    }
  };

  return (
    <div className="settings-editor" data-testid="settings-editor">
      <div className="settings-header">
        <h1>Settings Editor</h1>
        <div className="settings-actions">
          <button
            onClick={() => {
              if (window.electronAPI?.openExternal) {
                window.electronAPI.openExternal('https://code.claude.com/docs/en/settings');
              } else {
                window.open('https://code.claude.com/docs/en/settings', '_blank');
              }
            }}
            className="btn-docs"
          >
            📖 Settings Documentation
          </button>
        </div>
      </div>

      <div className="settings-tabs">
        <button
          className={`tab ${activeTab === 'effective' ? 'active' : ''}`}
          onClick={() => setActiveTab('effective')}
        >
          Effective Settings
        </button>
        <button
          className={`tab ${activeTab === 'user' ? 'active' : ''}`}
          onClick={() => setActiveTab('user')}
        >
          User Settings
        </button>
        <button
          className={`tab ${activeTab === 'project' ? 'active' : ''}`}
          onClick={() => setActiveTab('project')}
        >
          Project Settings
        </button>
        <button
          className={`tab ${activeTab === 'local' ? 'active' : ''}`}
          onClick={() => setActiveTab('local')}
        >
          Local Settings
        </button>
        <button
          className={`tab ${activeTab === 'managed' ? 'active' : ''}`}
          onClick={() => setActiveTab('managed')}
        >
          Managed Settings
        </button>
      </div>

      <div className="settings-content">{renderTabContent()}</div>
    </div>
  );
};
