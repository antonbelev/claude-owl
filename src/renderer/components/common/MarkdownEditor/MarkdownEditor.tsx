/**
 * MarkdownEditor - Unified tabbed editor for markdown with frontmatter
 *
 * Provides:
 * - Form view: Structured form fields for frontmatter and content
 * - Raw view: Direct markdown editing
 * - Bidirectional sync between views
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/renderer/components/ui/tabs';
import { FileText, Code } from 'lucide-react';
import { MarkdownFormView } from './MarkdownFormView';
import { MarkdownRawView } from './MarkdownRawView';
import type { MarkdownEditorProps, Frontmatter, ParsedMarkdown } from './types';

/**
 * Serialize frontmatter and content to raw markdown string
 */
function serializeMarkdown(frontmatter: Frontmatter, content: string): string {
  const lines: string[] = ['---'];

  // Serialize frontmatter
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value === undefined || value === null || value === '') continue;

    if (Array.isArray(value)) {
      if (value.length > 0) {
        lines.push(`${key}:`);
        value.forEach(v => lines.push(`  - ${v}`));
      }
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === 'number') {
      lines.push(`${key}: ${value}`);
    } else {
      // String value - quote if contains special chars
      const strValue = String(value);
      if (strValue.includes(':') || strValue.includes('#') || strValue.includes('\n')) {
        lines.push(`${key}: "${strValue.replace(/"/g, '\\"')}"`);
      } else {
        lines.push(`${key}: ${strValue}`);
      }
    }
  }

  lines.push('---');
  lines.push('');
  lines.push(content);

  return lines.join('\n');
}

/**
 * Parse raw markdown string to frontmatter and content
 */
function parseMarkdown(raw: string): ParsedMarkdown {
  const trimmed = raw.trim();

  // Check for frontmatter delimiter
  if (!trimmed.startsWith('---')) {
    return { frontmatter: {}, content: trimmed };
  }

  // Find closing delimiter
  const secondDelimiter = trimmed.indexOf('---', 3);
  if (secondDelimiter === -1) {
    return { frontmatter: {}, content: trimmed };
  }

  const frontmatterBlock = trimmed.substring(3, secondDelimiter).trim();
  const content = trimmed.substring(secondDelimiter + 3).trim();

  // Parse YAML-like frontmatter (simple parser)
  const frontmatter: Frontmatter = {};
  const lines = frontmatterBlock.split('\n');
  let currentKey: string | null = null;
  let currentArray: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check for array item
    if (trimmedLine.startsWith('- ') && currentKey) {
      currentArray.push(trimmedLine.substring(2).trim());
      continue;
    }

    // Save previous array if exists
    if (currentKey && currentArray.length > 0) {
      frontmatter[currentKey] = currentArray;
      currentArray = [];
    }

    // Parse key-value
    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmedLine.substring(0, colonIndex).trim();
    const value = trimmedLine.substring(colonIndex + 1).trim();

    currentKey = key;

    if (value === '') {
      // Array starts on next line
      currentArray = [];
    } else if (value === 'true') {
      frontmatter[key] = true;
    } else if (value === 'false') {
      frontmatter[key] = false;
    } else if (/^-?\d+$/.test(value)) {
      frontmatter[key] = parseInt(value, 10);
    } else if (/^-?\d+\.\d+$/.test(value)) {
      frontmatter[key] = parseFloat(value);
    } else {
      // Remove quotes if present
      frontmatter[key] = value.replace(/^["']|["']$/g, '');
    }
  }

  // Save last array if exists
  if (currentKey && currentArray.length > 0) {
    frontmatter[currentKey] = currentArray;
  }

  return { frontmatter, content };
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  frontmatter,
  content,
  onFrontmatterChange,
  onContentChange,
  fields,
  isEditMode = false,
  disabled = false,
  defaultTab = 'form',
  contentLabel = 'Content',
  contentPlaceholder,
  contentHelpText,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'raw'>(defaultTab);

  // Compute raw markdown from frontmatter and content
  const rawMarkdown = useMemo(
    () => serializeMarkdown(frontmatter, content),
    [frontmatter, content]
  );

  // Handle form field changes
  const handleFieldChange = useCallback(
    (key: string, value: string | string[] | number | boolean) => {
      onFrontmatterChange({ ...frontmatter, [key]: value });
    },
    [frontmatter, onFrontmatterChange]
  );

  // Handle raw markdown changes
  const handleRawChange = useCallback(
    (raw: string) => {
      const parsed = parseMarkdown(raw);
      onFrontmatterChange(parsed.frontmatter);
      onContentChange(parsed.content);
    },
    [onFrontmatterChange, onContentChange]
  );

  return (
    <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'form' | 'raw')}>
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="form" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Form
        </TabsTrigger>
        <TabsTrigger value="raw" className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          Raw Markdown
        </TabsTrigger>
      </TabsList>

      <TabsContent value="form">
        <MarkdownFormView
          frontmatter={frontmatter}
          content={content}
          onFieldChange={handleFieldChange}
          onContentChange={onContentChange}
          fields={fields}
          isEditMode={isEditMode}
          disabled={disabled}
          contentLabel={contentLabel}
          contentPlaceholder={contentPlaceholder}
          contentHelpText={contentHelpText}
        />
      </TabsContent>

      <TabsContent value="raw">
        <MarkdownRawView
          value={rawMarkdown}
          onChange={handleRawChange}
          disabled={disabled}
        />
      </TabsContent>
    </Tabs>
  );
};

export { serializeMarkdown, parseMarkdown };
