import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';
import { cn } from '@/renderer/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'outline';
  };
  className?: string;
}

/**
 * Empty state component for displaying when there's no content
 * Used across the app for consistent empty state messaging
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      <div className="mb-4 rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
        <Icon className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-neutral-900 dark:text-neutral-100">
        {title}
      </h3>
      <p className="mb-6 max-w-md text-sm text-neutral-600 dark:text-neutral-400">
        {description}
      </p>
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
