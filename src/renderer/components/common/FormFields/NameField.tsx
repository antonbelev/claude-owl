/**
 * NameField - Input field for kebab-case names
 *
 * Used for naming subagents, skills, commands, etc.
 * Validates kebab-case format: lowercase letters, numbers, and hyphens.
 */

import React from 'react';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import type { NameFieldProps } from './types';

/** Regex pattern for valid kebab-case names */
const KEBAB_CASE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const NameField: React.FC<NameFieldProps> = ({
  value,
  onChange,
  label = 'Name',
  placeholder = 'my-item-name',
  helpText = 'Lowercase letters, numbers, and hyphens only',
  disabled = false,
  required = false,
  maxLength = 64,
  error,
  testId = 'name-field',
}) => {
  // Validate on change (show error only if non-empty and invalid)
  const isInvalid = value.length > 0 && !KEBAB_CASE_PATTERN.test(value);
  const displayError =
    error || (isInvalid ? 'Must be lowercase with hyphens (e.g., my-name)' : undefined);

  return (
    <div className="space-y-2">
      <Label htmlFor={testId}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={testId}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value.toLowerCase())}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
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
          {helpText}
        </p>
      )}
    </div>
  );
};

/** Utility function to validate a name */
export function isValidName(name: string): boolean {
  return KEBAB_CASE_PATTERN.test(name);
}
