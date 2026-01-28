/**
 * Type definitions for EditModal components
 */

import type { BadgeProps } from '@/renderer/components/ui/badge';

export interface EditModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title (e.g., "Edit Subagent: my-agent") */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Optional badge to display next to title */
  badge?: {
    text: string;
    variant?: BadgeProps['variant'];
  };
  /** Whether a save operation is in progress */
  isLoading?: boolean;
  /** Whether there are unsaved changes (enables close confirmation) */
  hasUnsavedChanges?: boolean;
  /** Modal content */
  children: React.ReactNode;
  /** Optional footer content (use EditModalFooter for standard pattern) */
  footer?: React.ReactNode;
  /** Maximum width class (default: max-w-3xl) */
  maxWidth?: string;
  /** Custom className for the modal content */
  className?: string;
  /** Optional save callback for Cmd/Ctrl+S shortcut */
  onSave?: () => void;
  /** Whether save is disabled (prevents Cmd/Ctrl+S from triggering) */
  isSaveDisabled?: boolean;
}

export interface EditModalHeaderProps {
  /** Modal title */
  title: string;
  /** Optional subtitle */
  subtitle?: string | undefined;
  /** Optional badge */
  badge?:
    | {
        text: string;
        variant?: BadgeProps['variant'];
      }
    | undefined;
  /** Whether to show close button (default: true) */
  showCloseButton?: boolean | undefined;
  /** Callback when close button clicked */
  onClose?: (() => void) | undefined;
  /** Whether close is disabled (e.g., during save) */
  closeDisabled?: boolean | undefined;
}

export interface EditModalFooterProps {
  /** Callback when cancel button clicked */
  onCancel: () => void;
  /** Callback when save button clicked */
  onSave: () => void;
  /** Whether save operation is in progress */
  isLoading?: boolean;
  /** Whether save button should be disabled */
  isSaveDisabled?: boolean;
  /** Label for save button (default: "Save Changes") */
  saveLabel?: string;
  /** Label for cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Variant for save button */
  saveVariant?: 'default' | 'destructive';
  /** Additional content to show on the left side */
  leftContent?: React.ReactNode;
}

export interface UnsavedChangesAlertProps {
  /** Whether the alert dialog is open */
  isOpen: boolean;
  /** Callback when user chooses to discard changes */
  onDiscard: () => void;
  /** Callback when user chooses to keep editing */
  onKeepEditing: () => void;
  /** Custom title (default: "Unsaved Changes") */
  title?: string;
  /** Custom message */
  message?: string;
}
