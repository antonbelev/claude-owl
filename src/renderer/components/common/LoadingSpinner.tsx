import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/renderer/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

/**
 * Loading spinner component for displaying loading states
 * Uses lucide-react's Loader2 icon with animation
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className, text }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary-600', sizeClasses[size])} />
      {text && <p className="text-sm text-neutral-600 dark:text-neutral-400">{text}</p>}
    </div>
  );
};
