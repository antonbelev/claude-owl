/**
 * ModelSelector - Dropdown for selecting Claude model
 *
 * Used for model selection in subagents and commands.
 */

import React from 'react';
import { Label } from '@/renderer/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/components/ui/select';
import type { ModelSelectorProps, ModelOption, ModelAlias } from './types';

/** Default model options */
const DEFAULT_MODEL_OPTIONS: ModelOption[] = [
  {
    alias: 'default',
    label: 'Default',
    description: 'Use the default model configured for Claude Code',
  },
  {
    alias: 'inherit',
    label: 'Inherit',
    description: 'Inherit model from parent context',
  },
  {
    alias: 'sonnet',
    label: 'Claude Sonnet',
    description: 'Best balance of speed and capability',
  },
  {
    alias: 'opus',
    label: 'Claude Opus',
    description: 'Most capable, best for complex tasks',
  },
  {
    alias: 'haiku',
    label: 'Claude Haiku',
    description: 'Fastest, best for simple tasks',
  },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  label = 'Model',
  helpText = 'Select the Claude model to use',
  disabled = false,
  required = false,
  options,
  includeInherit = true,
  includeDefault = true,
  testId = 'model-selector',
}) => {
  // Build options list
  let availableOptions = options || DEFAULT_MODEL_OPTIONS;

  // Filter options based on flags
  if (!includeInherit) {
    availableOptions = availableOptions.filter(o => o.alias !== 'inherit');
  }
  if (!includeDefault) {
    availableOptions = availableOptions.filter(o => o.alias !== 'default');
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={testId}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select
        value={value}
        onValueChange={val => onChange(val as ModelAlias)}
        disabled={disabled}
      >
        <SelectTrigger id={testId} data-testid={testId}>
          <SelectValue placeholder="Select a model..." />
        </SelectTrigger>
        <SelectContent className="z-[1100]">
          {availableOptions.map(option => (
            <SelectItem
              key={option.alias}
              value={option.alias}
              className="py-2.5"
              textValue={option.label}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
};

export { DEFAULT_MODEL_OPTIONS };
