/**
 * MarkdownFormView - Form-based view for editing markdown frontmatter and content
 */

import React from 'react';
import { NameField, isValidName } from '../FormFields/NameField';
import { DescriptionField } from '../FormFields/DescriptionField';
import { ContentField } from '../FormFields/ContentField';
import { ToolsField, parseToolsString, formatToolsArray } from '../FormFields/ToolsField';
import { ModelSelector } from '../FormFields/ModelSelector';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import { Checkbox } from '@/renderer/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/components/ui/select';
import type { MarkdownFormViewProps, FrontmatterField, ModelAlias } from './types';

export const MarkdownFormView: React.FC<MarkdownFormViewProps> = ({
  frontmatter,
  content,
  onFieldChange,
  onContentChange,
  fields,
  isEditMode = false,
  disabled = false,
  contentLabel = 'Content',
  contentPlaceholder = 'Enter content...',
  contentHelpText = 'Markdown formatting supported',
}) => {
  // Render a field based on its type
  const renderField = (field: FrontmatterField) => {
    const value = frontmatter[field.key];
    const isFieldDisabled =
      disabled === true || (isEditMode === true && field.immutableOnEdit === true);

    switch (field.type) {
      case 'name':
        return (
          <NameField
            key={field.key}
            value={String(value || '')}
            onChange={v => onFieldChange(field.key, v)}
            label={field.label}
            placeholder={field.placeholder}
            helpText={field.helpText}
            disabled={isFieldDisabled}
            required={field.required}
            testId={`field-${field.key}`}
          />
        );

      case 'description':
        return (
          <DescriptionField
            key={field.key}
            value={String(value || '')}
            onChange={v => onFieldChange(field.key, v)}
            label={field.label}
            placeholder={field.placeholder}
            helpText={field.helpText}
            disabled={isFieldDisabled}
            required={field.required}
            testId={`field-${field.key}`}
          />
        );

      case 'tools':
        return (
          <ToolsField
            key={field.key}
            value={Array.isArray(value) ? formatToolsArray(value) : String(value || '')}
            onChange={v => onFieldChange(field.key, v)}
            label={field.label}
            placeholder={field.placeholder}
            helpText={field.helpText}
            disabled={isFieldDisabled}
            required={field.required}
            testId={`field-${field.key}`}
          />
        );

      case 'model':
        return (
          <ModelSelector
            key={field.key}
            value={(value as ModelAlias) || 'default'}
            onChange={v => onFieldChange(field.key, v)}
            label={field.label}
            helpText={field.helpText}
            disabled={isFieldDisabled}
            required={field.required}
            testId={`field-${field.key}`}
          />
        );

      case 'text':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={`field-${field.key}`}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={`field-${field.key}`}
              type="text"
              value={String(value || '')}
              onChange={e => onFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              disabled={isFieldDisabled}
              data-testid={`field-${field.key}`}
            />
            {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={`field-${field.key}`}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={`field-${field.key}`}
              type="number"
              value={value !== undefined ? Number(value) : ''}
              onChange={e => onFieldChange(field.key, Number(e.target.value))}
              placeholder={field.placeholder}
              disabled={isFieldDisabled}
              data-testid={`field-${field.key}`}
            />
            {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
          </div>
        );

      case 'boolean':
        return (
          <div key={field.key} className="flex items-center space-x-2">
            <Checkbox
              id={`field-${field.key}`}
              checked={Boolean(value)}
              onCheckedChange={checked => onFieldChange(field.key, checked)}
              disabled={isFieldDisabled}
              data-testid={`field-${field.key}`}
            />
            <Label htmlFor={`field-${field.key}`} className="cursor-pointer">
              {field.label}
            </Label>
          </div>
        );

      case 'select':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={`field-${field.key}`}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={String(value || '')}
              onValueChange={v => onFieldChange(field.key, v)}
              disabled={isFieldDisabled}
            >
              <SelectTrigger id={`field-${field.key}`} data-testid={`field-${field.key}`}>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Render frontmatter fields */}
      {fields.map(renderField)}

      {/* Render content field (always at the end) */}
      <ContentField
        value={content}
        onChange={onContentChange}
        label={contentLabel}
        placeholder={contentPlaceholder}
        helpText={contentHelpText}
        disabled={disabled}
        required={true}
        rows={12}
        testId="content-field"
      />
    </div>
  );
};

export { isValidName, parseToolsString, formatToolsArray };
