import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { DailyStats } from '@/shared/types';

interface DailySpendChartProps {
  data: DailyStats[];
}

/**
 * DailySpendChart - Line chart showing cost and token breakdown over time
 */
export function DailySpendChart({ data }: DailySpendChartProps) {
  // Transform data for recharts
  const chartData = data.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cost: Number(day.cost.toFixed(4)),
    inputTokens: day.inputTokens,
    outputTokens: day.outputTokens,
    cacheCreationTokens: day.cacheCreationTokens,
    cacheReadTokens: day.cacheReadTokens,
    totalTokens: day.totalTokens,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" tick={{ fill: 'currentColor' }} />
        <YAxis
          yAxisId="left"
          className="text-xs"
          tick={{ fill: 'currentColor' }}
          tickFormatter={value => `$${value.toFixed(2)}`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          className="text-xs"
          tick={{ fill: 'currentColor' }}
          tickFormatter={value => `${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                  <p className="font-semibold mb-2">{data.date}</p>
                  <p className="text-sm text-green-600 font-semibold">
                    Cost: ${data.cost.toFixed(4)}
                  </p>
                  <div className="mt-2 space-y-1 text-xs">
                    <p className="text-blue-600">Input: {data.inputTokens.toLocaleString()}</p>
                    <p className="text-emerald-600">Output: {data.outputTokens.toLocaleString()}</p>
                    <p className="text-amber-600">
                      Cache Create: {data.cacheCreationTokens.toLocaleString()}
                    </p>
                    <p className="text-purple-600">
                      Cache Read: {data.cacheReadTokens.toLocaleString()}
                    </p>
                    <p className="text-muted-foreground font-semibold border-t pt-1 mt-1">
                      Total: {data.totalTokens.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="cost"
          stroke="#10b981"
          strokeWidth={3}
          dot={{ fill: '#10b981', r: 4 }}
          activeDot={{ r: 6 }}
          name="Cost ($)"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="inputTokens"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          name="Input Tokens"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="outputTokens"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          name="Output Tokens"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="cacheCreationTokens"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
          name="Cache Create"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="cacheReadTokens"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={false}
          name="Cache Read"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
