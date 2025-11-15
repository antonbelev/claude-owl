import React, { useState } from 'react';
import { User, Lock, BookOpen, FolderIcon, ArrowLeftIcon } from 'lucide-react';
import type { ConfigLevel } from '@/shared/types';
import { SettingsHierarchyTab } from './SettingsHierarchyTab';
import { PageHeader } from '../common/PageHeader';
import { ProjectSelector } from '../ProjectSelector/ProjectSelector';
import { useProjectContext } from '../../contexts/ProjectContext';
import { cn } from '@/renderer/lib/utils';
import { Button } from '../ui/button';

type TabType = 'user' | 'project' | 'managed';

export const SettingsEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('user');
  const { selectedProject, clearSelection } = useProjectContext();

  const renderTabContent = () => {
    // If project tab is selected, show ProjectSelector first
    if (activeTab === 'project') {
      if (!selectedProject) {
        return (
          <div className="space-y-6">
            <ProjectSelector />
          </div>
        );
      }
      // Show project settings if a project is selected with a "Change Project" button
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded">
                <FolderIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">{selectedProject.name}</h3>
                <p className="text-sm text-neutral-600">{selectedProject.path}</p>
              </div>
            </div>
            <Button onClick={clearSelection} variant="outline" size="sm" className="gap-2">
              <ArrowLeftIcon className="h-4 w-4" />
              Change Project
            </Button>
          </div>
          <SettingsHierarchyTab level="project" />
        </div>
      );
    }

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
            variant: 'outline',
            icon: BookOpen,
          },
        ]}
      />

      <div className="grid grid-cols-3 gap-4 p-6 bg-neutral-50">
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
            activeTab === 'project'
              ? 'border-primary bg-primary/5 text-neutral-900'
              : 'border-neutral-200 text-neutral-600'
          )}
          onClick={() => setActiveTab('project')}
        >
          <FolderIcon className="h-6 w-6" />
          <span
            className={cn(
              'text-base font-semibold',
              activeTab === 'project' ? 'text-primary' : 'text-neutral-900'
            )}
          >
            Project Settings
          </span>
          <span className="text-sm text-neutral-500 leading-snug">
            {selectedProject ? `${selectedProject.name}` : 'Select a project'}
          </span>
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
