/**
 * UnsavedChangesAlert - Confirmation dialog for unsaved changes
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { Button } from '@/renderer/components/ui/button';
import type { UnsavedChangesAlertProps } from './types';

export const UnsavedChangesAlert: React.FC<UnsavedChangesAlertProps> = ({
  isOpen,
  onDiscard,
  onKeepEditing,
  title = 'Unsaved Changes',
  message = 'You have unsaved changes. Are you sure you want to close without saving?',
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onKeepEditing()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onKeepEditing}>
            Keep Editing
          </Button>
          <Button variant="destructive" onClick={onDiscard}>
            Discard Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
