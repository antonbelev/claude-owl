import { Calendar } from 'lucide-react';
import type { MetricsFilter } from '@/shared/types';

interface TimelinePickerProps {
  filter: MetricsFilter;
  onFilterChange: (filter: MetricsFilter) => void;
}

type TimelinePeriod = 7 | 30 | 90 | 365 | 'all';

/**
 * TimelinePicker - Allow users to filter metrics by time period
 */
export function TimelinePicker({ filter, onFilterChange }: TimelinePickerProps) {
  const periods: { label: string; value: TimelinePeriod }[] = [
    { label: 'Last 7 Days', value: 7 },
    { label: 'Last 30 Days', value: 30 },
    { label: 'Last 90 Days', value: 90 },
    { label: 'Last Year', value: 365 },
    { label: 'All Time', value: 'all' },
  ];

  const currentPeriod: TimelinePeriod = filter.days || 'all';

  const handlePeriodChange = (period: TimelinePeriod) => {
    if (period === 'all') {
      // Remove days filter
      const { days: _days, ...rest } = filter;
      onFilterChange(rest);
    } else {
      onFilterChange({ ...filter, days: period as 7 | 30 | 90 | 365 });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <div className="flex gap-1 border rounded-lg p-1">
        {periods.map(period => (
          <button
            key={period.value}
            onClick={() => handlePeriodChange(period.value)}
            className={`
              px-3 py-1.5 text-sm rounded transition-colors
              ${
                currentPeriod === period.value
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground'
              }
            `}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
}
