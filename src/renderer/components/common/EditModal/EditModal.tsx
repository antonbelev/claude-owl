/**
 * EditModal - Unified modal wrapper for editing configurations
 *
 * Provides consistent modal structure with:
 * - Escape key handling
 * - Unsaved changes detection
 * - Loading states
 * - Keyboard shortcuts (Cmd/Ctrl + S to save)
 *
 * @see project-docs/adr/adr-012-unified-edit-feature.md
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { EditModalHeader } from './EditModalHeader';
import { UnsavedChangesAlert } from './UnsavedChangesAlert';
import type { EditModalProps } from './types';

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  isLoading = false,
  hasUnsavedChanges = false,
  children,
  footer,
  maxWidth = 'max-w-3xl',
  className = '',
  onSave,
  isSaveDisabled = false,
}) => {
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Save the previously focused element and restore it on close
  useEffect(() => {
    if (isOpen) {
      // Save the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the modal content after it renders
      requestAnimationFrame(() => {
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          modalRef.current?.focus();
        }
      });
    } else {
      // Restore focus to the previously focused element
      if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges && !isLoading) {
      setShowUnsavedAlert(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, isLoading, onClose]);

  // Handle keyboard shortcuts (Escape to close, Cmd/Ctrl+S to save)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape' && !isLoading) {
        e.preventDefault();
        handleClose();
      }

      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (onSave && !isLoading && !isSaveDisabled) {
          onSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, handleClose, onSave, isSaveDisabled]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Modal backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
      >
        {/* Modal content */}
        <div
          ref={modalRef}
          className={`flex flex-col bg-white rounded-lg shadow-2xl w-full ${maxWidth} max-h-[90vh] m-4 ${className}`}
          onClick={e => e.stopPropagation()}
          tabIndex={-1}
          aria-describedby={subtitle ? 'edit-modal-description' : undefined}
        >
          {/* Header */}
          <EditModalHeader
            title={title}
            subtitle={subtitle}
            badge={badge}
            onClose={handleClose}
            closeDisabled={isLoading}
          />

          {/* Body - scrollable */}
          <div className="flex-1 overflow-y-auto">{children}</div>

          {/* Footer */}
          {footer}
        </div>
      </div>

      {/* Unsaved changes confirmation */}
      <UnsavedChangesAlert
        isOpen={showUnsavedAlert}
        onDiscard={() => {
          setShowUnsavedAlert(false);
          onClose();
        }}
        onKeepEditing={() => setShowUnsavedAlert(false)}
      />
    </>
  );
};
