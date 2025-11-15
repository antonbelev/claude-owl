import * as React from 'react';
import { Badge } from '@/renderer/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/renderer/lib/utils';

type Status = 'success' | 'error' | 'warning' | 'info';

interface StatusBadgeProps {
  status: Status;
  children: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    variant: 'success' as const,
  },
  error: {
    icon: XCircle,
    variant: 'destructive' as const,
  },
  warning: {
    icon: AlertCircle,
    variant: 'warning' as const,
  },
  info: {
    icon: Info,
    variant: 'secondary' as const,
  },
};

/**
 * Status badge component for displaying status indicators
 * Combines badge with icon for consistent status display across the app
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  showIcon = true,
  className,
}) => {
  const { icon: Icon, variant } = statusConfig[status];

  return (
    <Badge variant={variant} className={cn('gap-1', className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {children}
    </Badge>
  );
};
