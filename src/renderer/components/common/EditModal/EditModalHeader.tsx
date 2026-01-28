/**
 * EditModalHeader - Consistent header for edit modals
 */

import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/renderer/components/ui/badge';
import { Button } from '@/renderer/components/ui/button';
import type { EditModalHeaderProps } from './types';

export const EditModalHeader: React.FC<EditModalHeaderProps> = ({
  title,
  subtitle,
  badge,
  showCloseButton = true,
  onClose,
  closeDisabled = false,
}) => {
  return (
    <div className="flex items-start justify-between p-6 border-b border-neutral-200">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 id="edit-modal-title" className="text-xl font-semibold text-neutral-900 truncate">
            {title}
          </h2>
          {badge && <Badge variant={badge.variant || 'secondary'}>{badge.text}</Badge>}
        </div>
        {subtitle && (
          <p id="edit-modal-description" className="mt-1 text-sm text-neutral-600">
            {subtitle}
          </p>
        )}
      </div>
      {showCloseButton && onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          disabled={closeDisabled}
          className="ml-4 shrink-0"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};
