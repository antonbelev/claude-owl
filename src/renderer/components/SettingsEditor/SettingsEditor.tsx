import React, { useState } from 'react';
import type { ConfigLevel } from '@/shared/types';
import { SettingsHierarchyTab } from './SettingsHierarchyTab';
import { PageHeader } from '../common/PageHeader';
import './SettingsEditor.css';

type TabType = 'user' | 'managed';

export const SettingsEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('user');

  const renderTabContent = () => {
    return <SettingsHierarchyTab level={activeTab as ConfigLevel} />;
  };

  const handleDocsClick = () => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal('https://code.claude.com/docs/en/settings');
    } else {
      window.open('https://code.claude.com/docs/en/settings', '_blank');
    }
  };

  return (
    <div className="settings-editor" data-testid="settings-editor">
      <PageHeader
        title="Settings"
        description="Configure your global Claude Code preferences, environment variables, and permissions"
        actions={[
          {
            label: '📖 Documentation',
            onClick: handleDocsClick,
            variant: 'docs',
          },
        ]}
      />

      <div className="settings-tabs">
        <button
          className={`tab ${activeTab === 'user' ? 'active' : ''}`}
          onClick={() => setActiveTab('user')}
        >
          <span className="tab-icon">👤</span>
          <span className="tab-label">User Settings</span>
          <span className="tab-description">Your global preferences</span>
        </button>
        <button
          className={`tab ${activeTab === 'managed' ? 'active' : ''}`}
          onClick={() => setActiveTab('managed')}
        >
          <span className="tab-icon">🔒</span>
          <span className="tab-label">Managed Settings</span>
          <span className="tab-description">Organization policies (read-only)</span>
        </button>
      </div>

      <div className="settings-content">{renderTabContent()}</div>
    </div>
  );
};
