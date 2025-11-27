import { Card, CardContent } from '@/renderer/components/ui/card';
import type { MetricsSummary } from '@/shared/types';
import { TrendingUp, Zap, DollarSign, Calendar } from 'lucide-react';

interface MetricsSummaryCardProps {
  summary: MetricsSummary;
}

/**
 * MetricsSummaryCard - Display key metrics summary
 */
export function MetricsSummaryCard({ summary }: MetricsSummaryCardProps) {
  const stats = [
    {
      label: 'Total Cost',
      value: `$${summary.totalCost.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      label: 'Total Sessions',
      value: summary.totalSessions.toLocaleString(),
      icon: Calendar,
      color: 'text-blue-600',
    },
    {
      label: 'Total Tokens',
      value: summary.totalTokens.toLocaleString(),
      icon: Zap,
      color: 'text-orange-600',
    },
    {
      label: 'Avg Cost/Session',
      value: `$${summary.averageCostPerSession.toFixed(4)}`,
      icon: TrendingUp,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(stat => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
