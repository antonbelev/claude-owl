/**
 * Type definitions for FormFields components
 */

export interface NameFieldProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Field label (default: "Name") */
  label?: string | undefined;
  /** Placeholder text */
  placeholder?: string | undefined;
  /** Help text shown below field */
  helpText?: string | undefined;
  /** Whether field is disabled (e.g., when editing) */
  disabled?: boolean | undefined;
  /** Whether field is required */
  required?: boolean | undefined;
  /** Maximum length (default: 64) */
  maxLength?: number | undefined;
  /** Custom validation error message */
  error?: string | undefined;
  /** Test ID for testing */
  testId?: string | undefined;
}

export interface DescriptionFieldProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Field label (default: "Description") */
  label?: string | undefined;
  /** Placeholder text */
  placeholder?: string | undefined;
  /** Help text shown below field */
  helpText?: string | undefined;
  /** Whether field is disabled */
  disabled?: boolean | undefined;
  /** Whether field is required */
  required?: boolean | undefined;
  /** Maximum length (default: 1024) */
  maxLength?: number | undefined;
  /** Number of rows (default: 3) */
  rows?: number | undefined;
  /** Custom validation error message */
  error?: string | undefined;
  /** Test ID for testing */
  testId?: string | undefined;
}

export interface ContentFieldProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Field label (default: "Content") */
  label?: string | undefined;
  /** Placeholder text */
  placeholder?: string | undefined;
  /** Help text shown below field */
  helpText?: string | undefined;
  /** Whether field is disabled */
  disabled?: boolean | undefined;
  /** Whether field is required */
  required?: boolean | undefined;
  /** Number of rows (default: 10) */
  rows?: number | undefined;
  /** Custom validation error message */
  error?: string | undefined;
  /** Test ID for testing */
  testId?: string | undefined;
  /** Whether to show a monospace font */
  monospace?: boolean | undefined;
}

export interface ToolsFieldProps {
  /** Current value (comma-separated string or array) */
  value: string | string[];
  /** Change handler (returns comma-separated string) */
  onChange: (value: string) => void;
  /** Field label (default: "Tools") */
  label?: string | undefined;
  /** Placeholder text */
  placeholder?: string | undefined;
  /** Help text shown below field */
  helpText?: string | undefined;
  /** Whether field is disabled */
  disabled?: boolean | undefined;
  /** Whether field is required */
  required?: boolean | undefined;
  /** Custom validation error message */
  error?: string | undefined;
  /** Test ID for testing */
  testId?: string | undefined;
}

export type ModelAlias = 'sonnet' | 'opus' | 'haiku' | 'default' | 'inherit';

export interface ModelOption {
  alias: ModelAlias;
  label: string;
  description: string;
}

export interface ModelSelectorProps {
  /** Current value */
  value: ModelAlias;
  /** Change handler */
  onChange: (value: ModelAlias) => void;
  /** Field label (default: "Model") */
  label?: string | undefined;
  /** Help text shown below field */
  helpText?: string | undefined;
  /** Whether field is disabled */
  disabled?: boolean | undefined;
  /** Whether field is required */
  required?: boolean | undefined;
  /** Available model options (default: all) */
  options?: ModelOption[] | undefined;
  /** Whether to include 'inherit' option (default: true) */
  includeInherit?: boolean | undefined;
  /** Whether to include 'default' option (default: true) */
  includeDefault?: boolean | undefined;
  /** Test ID for testing */
  testId?: string | undefined;
}
