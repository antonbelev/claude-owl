/**
 * MarkdownRawView - Raw markdown editing view with syntax highlighting
 */

import React from 'react';
import { Textarea } from '@/renderer/components/ui/textarea';
import type { MarkdownRawViewProps } from './types';

export const MarkdownRawView: React.FC<MarkdownRawViewProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = `---
name: my-item
description: A description of my item
---

# Content

Your markdown content here...`,
}) => {
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={20}
        className="font-mono text-sm leading-relaxed"
        data-testid="raw-markdown-editor"
      />
      <p className="text-xs text-muted-foreground">
        Edit the raw markdown including YAML frontmatter. Changes sync with the form view.
      </p>
    </div>
  );
};
