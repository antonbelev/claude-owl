import React from 'react';
import { Button } from '@/renderer/components/ui/button';
import { cn } from '@/renderer/lib/utils';
import { LucideIcon } from 'lucide-react';

interface PageHeaderAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline';
  disabled?: boolean;
  icon?: LucideIcon;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: PageHeaderAction[];
  className?: string;
}

/**
 * Page header component with title, description, and action buttons
 * Provides consistent header styling across all pages
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-6 border-b-2 border-neutral-200 pb-6 mb-8 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-3xl font-semibold text-neutral-900 mb-2">{title}</h1>
        {description && (
          <p className="text-base text-neutral-600 leading-relaxed max-w-2xl">{description}</p>
        )}
      </div>
      {actions && actions.length > 0 && (
        <div className="flex gap-3 items-center flex-shrink-0">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant={action.variant || 'default'}
              disabled={action.disabled}
              className="whitespace-nowrap"
            >
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
