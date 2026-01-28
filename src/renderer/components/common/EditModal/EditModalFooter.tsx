/**
 * EditModalFooter - Consistent footer for edit modals
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';
import type { EditModalFooterProps } from './types';

export const EditModalFooter: React.FC<EditModalFooterProps> = ({
  onCancel,
  onSave,
  isLoading = false,
  isSaveDisabled = false,
  saveLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  saveVariant = 'default',
  leftContent,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 p-6 border-t border-neutral-200">
      <div className="flex-1">{leftContent}</div>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button variant={saveVariant} onClick={onSave} disabled={isLoading || isSaveDisabled}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Saving...' : saveLabel}
        </Button>
      </div>
    </div>
  );
};
