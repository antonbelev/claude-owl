/**
 * ContentField - Large textarea for markdown content
 *
 * Used for system prompts, instructions, command content, etc.
 */

import React from 'react';
import { Textarea } from '@/renderer/components/ui/textarea';
import { Label } from '@/renderer/components/ui/label';
import type { ContentFieldProps } from './types';

export const ContentField: React.FC<ContentFieldProps> = ({
  value,
  onChange,
  label = 'Content',
  placeholder = 'Enter content...',
  helpText = 'Markdown formatting supported',
  disabled = false,
  required = false,
  rows = 10,
  error,
  testId = 'content-field',
  monospace = false,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={testId}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Textarea
        id={testId}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        data-testid={testId}
        className={`${error ? 'border-destructive' : ''} ${monospace ? 'font-mono text-sm' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${testId}-error` : `${testId}-help`}
      />
      {error ? (
        <p id={`${testId}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        <p id={`${testId}-help`} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
    </div>
  );
};
