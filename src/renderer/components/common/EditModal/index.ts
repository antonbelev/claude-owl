/**
 * EditModal - Unified modal components for editing configurations
 *
 * Provides consistent modal structure across all features:
 * - Subagents, Skills, Slash Commands, Hooks
 *
 * @see project-docs/adr/adr-012-unified-edit-feature.md
 */

export { EditModal } from './EditModal';
export { EditModalHeader } from './EditModalHeader';
export { EditModalFooter } from './EditModalFooter';
export { UnsavedChangesAlert } from './UnsavedChangesAlert';
export type { EditModalProps, EditModalHeaderProps, EditModalFooterProps } from './types';
