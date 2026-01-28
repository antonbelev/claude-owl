/**
 * DescriptionField - Textarea for descriptions with character limit
 */

import React from 'react';
import { Textarea } from '@/renderer/components/ui/textarea';
import { Label } from '@/renderer/components/ui/label';
import type { DescriptionFieldProps } from './types';

export const DescriptionField: React.FC<DescriptionFieldProps> = ({
  value,
  onChange,
  label = 'Description',
  placeholder = 'Enter a description...',
  helpText,
  disabled = false,
  required = false,
  maxLength = 1024,
  rows = 3,
  error,
  testId = 'description-field',
}) => {
  const charCount = value.length;
  const isOverLimit = charCount > maxLength;
  const displayError =
    error || (isOverLimit ? `Description exceeds ${maxLength} characters` : undefined);
  const defaultHelpText = `Max ${maxLength} characters (${charCount}/${maxLength})`;

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
        maxLength={maxLength + 100} // Allow slight overflow to show error
        data-testid={testId}
        className={displayError ? 'border-destructive' : ''}
        aria-invalid={!!displayError}
        aria-describedby={displayError ? `${testId}-error` : `${testId}-help`}
      />
      {displayError ? (
        <p id={`${testId}-error`} className="text-xs text-destructive">
          {displayError}
        </p>
      ) : (
        <p id={`${testId}-help`} className="text-xs text-muted-foreground">
          {helpText || defaultHelpText}
        </p>
      )}
    </div>
  );
};
