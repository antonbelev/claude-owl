/**
 * Type definitions for MarkdownEditor components
 */

import type { ModelAlias } from '../FormFields/types';

/** Field types supported in the form view */
export type FieldType = 'name' | 'description' | 'content' | 'tools' | 'model' | 'text' | 'number' | 'boolean' | 'select';

/** Definition of a frontmatter field */
export interface FrontmatterField {
  /** Unique key for the field (matches frontmatter property) */
  key: string;
  /** Type of the field */
  type: FieldType;
  /** Display label */
  label: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled when editing (e.g., name) */
  immutableOnEdit?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Help text */
  helpText?: string;
  /** For select type: available options */
  options?: Array<{ value: string; label: string }>;
  /** Default value */
  defaultValue?: string | number | boolean;
}

/** Generic frontmatter type */
export interface Frontmatter {
  [key: string]: string | string[] | number | boolean | undefined;
}

export interface MarkdownEditorProps {
  /** Current frontmatter values */
  frontmatter: Frontmatter;
  /** Current markdown content (after frontmatter) */
  content: string;
  /** Handler for frontmatter changes */
  onFrontmatterChange: (frontmatter: Frontmatter) => void;
  /** Handler for content changes */
  onContentChange: (content: string) => void;
  /** Field definitions for the form view */
  fields: FrontmatterField[];
  /** Whether in edit mode (affects immutable fields) */
  isEditMode?: boolean;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Initial active tab */
  defaultTab?: 'form' | 'raw';
  /** Label for the content field in form view */
  contentLabel?: string;
  /** Placeholder for the content field */
  contentPlaceholder?: string;
  /** Help text for the content field */
  contentHelpText?: string;
}

export interface MarkdownFormViewProps {
  /** Current frontmatter values */
  frontmatter: Frontmatter;
  /** Current markdown content */
  content: string;
  /** Handler for frontmatter field changes */
  onFieldChange: (key: string, value: string | string[] | number | boolean) => void;
  /** Handler for content changes */
  onContentChange: (content: string) => void;
  /** Field definitions */
  fields: FrontmatterField[];
  /** Whether in edit mode */
  isEditMode?: boolean | undefined;
  /** Whether the form is disabled */
  disabled?: boolean | undefined;
  /** Label for the content field */
  contentLabel?: string | undefined;
  /** Placeholder for the content field */
  contentPlaceholder?: string | undefined;
  /** Help text for the content field */
  contentHelpText?: string | undefined;
}

export interface MarkdownRawViewProps {
  /** Full markdown content (with frontmatter) */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

/** Utility type for parsed markdown with frontmatter */
export interface ParsedMarkdown {
  frontmatter: Frontmatter;
  content: string;
}

/** Model alias type re-export for convenience */
export type { ModelAlias };
