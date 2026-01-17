/**
 * ToolsField - Input field for comma-separated tool names
 *
 * Used for allowed-tools in skills, commands, and subagents.
 */

import React from 'react';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import { Badge } from '@/renderer/components/ui/badge';
import type { ToolsFieldProps } from './types';

export const ToolsField: React.FC<ToolsFieldProps> = ({
  value,
  onChange,
  label = 'Tools',
  placeholder = 'Read, Write, Bash (comma-separated)',
  helpText = 'Comma-separated list of allowed tools (leave empty for all tools)',
  disabled = false,
  required = false,
  error,
  testId = 'tools-field',
}) => {
  // Normalize value to string
  const stringValue = Array.isArray(value) ? value.join(', ') : value;

  // Parse tools for display as badges
  const tools = stringValue
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2">
      <Label htmlFor={testId}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={testId}
        type="text"
        value={stringValue}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        data-testid={testId}
        className={error ? 'border-destructive' : ''}
        aria-invalid={!!error}
        aria-describedby={error ? `${testId}-error` : `${testId}-help`}
      />

      {/* Show parsed tools as badges when there are valid entries */}
      {tools.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tools.map((tool, index) => (
            <Badge key={`${tool}-${index}`} variant="secondary" className="text-xs">
              {tool}
            </Badge>
          ))}
        </div>
      )}

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

/** Utility function to parse tools string to array */
export function parseToolsString(value: string): string[] {
  return value
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
}

/** Utility function to format tools array to string */
export function formatToolsArray(tools: string[]): string {
  return tools.filter(Boolean).join(', ');
}
