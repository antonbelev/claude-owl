import React, { useState } from 'react';
import { User, Lock, BookOpen } from 'lucide-react';
import type { ConfigLevel } from '@/shared/types';
import { SettingsHierarchyTab } from './SettingsHierarchyTab';
import { PageHeader } from '../common/PageHeader';
import { cn } from '@/renderer/lib/utils';

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
    <div className="h-full flex flex-col bg-white p-8" data-testid="settings-editor">
      <PageHeader
        title="Settings"
        description="Configure your global Claude Code preferences, environment variables, and permissions"
        actions={[
          {
            label: 'Documentation',
            onClick: handleDocsClick,
            variant: 'docs',
            icon: BookOpen,
          },
        ]}
      />

      <div className="grid grid-cols-2 gap-4 p-6 bg-neutral-50">
        <button
          className={cn(
            'p-5 bg-white border-2 rounded-xl text-left transition-all',
            'flex flex-col gap-2 hover:border-primary-light hover:bg-neutral-50',
            activeTab === 'user'
              ? 'border-primary bg-primary/5 text-neutral-900'
              : 'border-neutral-200 text-neutral-600'
          )}
          onClick={() => setActiveTab('user')}
        >
          <User className="h-6 w-6" />
          <span
            className={cn(
              'text-base font-semibold',
              activeTab === 'user' ? 'text-primary' : 'text-neutral-900'
            )}
          >
            User Settings
          </span>
          <span className="text-sm text-neutral-500 leading-snug">Your global preferences</span>
        </button>
        <button
          className={cn(
            'p-5 bg-white border-2 rounded-xl text-left transition-all',
            'flex flex-col gap-2 hover:border-primary-light hover:bg-neutral-50',
            activeTab === 'managed'
              ? 'border-primary bg-primary/5 text-neutral-900'
              : 'border-neutral-200 text-neutral-600'
          )}
          onClick={() => setActiveTab('managed')}
        >
          <Lock className="h-6 w-6" />
          <span
            className={cn(
              'text-base font-semibold',
              activeTab === 'managed' ? 'text-primary' : 'text-neutral-900'
            )}
          >
            Managed Settings
          </span>
          <span className="text-sm text-neutral-500 leading-snug">
            Organization policies (read-only)
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">{renderTabContent()}</div>
    </div>
  );
};
