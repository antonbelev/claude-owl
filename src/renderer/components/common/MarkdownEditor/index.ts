/**
 * MarkdownEditor - Unified markdown editing with form and raw views
 *
 * Provides tabbed interface for editing markdown files with frontmatter:
 * - Form view: Structured form fields
 * - Raw view: Direct markdown editing
 *
 * @see project-docs/adr/adr-012-unified-edit-feature.md
 */

export { MarkdownEditor } from './MarkdownEditor';
export { MarkdownFormView } from './MarkdownFormView';
export { MarkdownRawView } from './MarkdownRawView';
export type {
  MarkdownEditorProps,
  MarkdownFormViewProps,
  MarkdownRawViewProps,
  FrontmatterField,
} from './types';
