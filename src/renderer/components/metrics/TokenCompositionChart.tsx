import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip, Legend } from 'recharts';
import type { MetricsSummary } from '@/shared/types';

interface TokenCompositionChartProps {
  summary: MetricsSummary;
}

interface LabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

/**
 * Custom label component that only shows text for segments > 5%
 */
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: LabelProps) => {
  // Only show label if percentage is greater than 5%
  if (!percent || !cx || !cy || !midAngle || !innerRadius || !outerRadius || percent < 0.05) return null;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-sm font-semibold"
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

/**
 * TokenCompositionChart - Pie chart showing token type breakdown
 */
export function TokenCompositionChart({ summary }: TokenCompositionChartProps) {
  const data = [
    {
      name: 'Input Tokens',
      value: summary.totalInputTokens,
      color: '#3b82f6', // blue
    },
    {
      name: 'Output Tokens',
      value: summary.totalOutputTokens,
      color: '#10b981', // green
    },
    {
      name: 'Cache Creation',
      value: summary.totalCacheCreationTokens,
      color: '#f59e0b', // amber
    },
    {
      name: 'Cache Read',
      value: summary.totalCacheReadTokens,
      color: '#8b5cf6', // purple
    },
  ].filter(item => item.value > 0); // Only show non-zero values

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={90}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const item = payload[0].payload;
              return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm">
                    {item.value.toLocaleString()} tokens
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {((item.value / summary.totalTokens) * 100).toFixed(1)}%
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value, entry) => {
            const payload = entry.payload as { value: number };
            const percent = ((payload.value / summary.totalTokens) * 100).toFixed(1);
            return `${value} (${percent}%)`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
