/**
 * ScopeSelector component - Unified scope selection for scoped features
 *
 * Combines scope toggle (user vs project) with project picker in one component.
 * Used by all features that support both user-level and project-level configurations.
 */

import React from 'react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { ProjectPicker } from './ProjectPicker';
import type { ProjectInfo } from '@/shared/types';

export interface ScopeSelectorProps {
  scope: 'user' | 'project';
  selectedProject: ProjectInfo | null;
  onScopeChange: (scope: 'user' | 'project') => void;
  onProjectChange: (project: ProjectInfo | null) => void;
  compact?: boolean; // Optional compact mode for small dialogs
  disabled?: boolean;
  className?: string;
  // Labels for customization
  userLabel?: string;
  projectLabel?: string;
  userDescription?: string;
  projectDescription?: string;
}

export const ScopeSelector: React.FC<ScopeSelectorProps> = ({
  scope,
  selectedProject,
  onScopeChange,
  onProjectChange,
  compact = false,
  disabled = false,
  className = '',
  userLabel = 'User-level',
  projectLabel = 'Project-level',
  userDescription = 'Apply globally to all projects',
  projectDescription = 'Apply to a specific project',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Scope Toggle */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Scope</Label>
        <RadioGroup
          value={scope}
          onValueChange={(value: string) => onScopeChange(value as 'user' | 'project')}
          disabled={disabled}
          className="grid grid-cols-2 gap-3"
        >
          <div>
            <RadioGroupItem
              value="user"
              id="scope-user"
              className="peer sr-only"
              disabled={disabled}
            />
            <Label
              htmlFor="scope-user"
              className={`
                flex flex-col items-start justify-start gap-2 rounded-lg border-2 p-4
                cursor-pointer transition-all
                peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
              `}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    peer-data-[state=checked]:border-blue-500
                  `}
                >
                  {scope === 'user' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <span className="font-medium text-sm">{userLabel}</span>
              </div>
              {!compact && <p className="text-xs text-gray-600 pl-6">{userDescription}</p>}
            </Label>
          </div>

          <div>
            <RadioGroupItem
              value="project"
              id="scope-project"
              className="peer sr-only"
              disabled={disabled}
            />
            <Label
              htmlFor="scope-project"
              className={`
                flex flex-col items-start justify-start gap-2 rounded-lg border-2 p-4
                cursor-pointer transition-all
                peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
              `}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    peer-data-[state=checked]:border-blue-500
                  `}
                >
                  {scope === 'project' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <span className="font-medium text-sm">{projectLabel}</span>
              </div>
              {!compact && <p className="text-xs text-gray-600 pl-6">{projectDescription}</p>}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Project Picker (conditional) */}
      {scope === 'project' && (
        <ProjectPicker
          selectedProject={selectedProject}
          onSelect={onProjectChange}
          compact={compact}
          disabled={disabled}
          showSearch={!compact}
        />
      )}
    </div>
  );
};
