import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import type { ModelStats } from '@/shared/types';

interface ModelBreakdownChartProps {
  models: ModelStats[];
}

/**
 * ModelBreakdownChart - Stacked bar chart showing token breakdown by model
 */
export function ModelBreakdownChart({ models }: ModelBreakdownChartProps) {
  // Transform data for recharts - show top 5 models by cost
  const chartData = models
    .slice(0, 5)
    .map(model => ({
      name: model.model.replace('claude-', '').replace(/^(.*?)-(\d{8})$/, '$1'),
      cost: Number(model.cost.toFixed(4)),
      percentage: Number(model.percentage.toFixed(1)),
      sessions: model.sessionCount,
      messages: model.messageCount,
      inputTokens: model.inputTokens,
      outputTokens: model.outputTokens,
      cacheCreationTokens: model.cacheCreationTokens,
      cacheReadTokens: model.cacheReadTokens,
      totalTokens: model.totalTokens,
    }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="name"
          className="text-xs"
          tick={{ fill: 'currentColor' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: 'currentColor' }}
          tickFormatter={value => {
            if (value === 0) return '0';
            if (value < 1000) return value.toString();
            return `${(value / 1000).toFixed(1)}k`;
          }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const item = payload[0].payload;
              return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                  <p className="font-semibold mb-2">{item.name}</p>
                  <p className="text-sm text-green-600 font-semibold mb-2">
                    Cost: ${item.cost.toFixed(4)} ({item.percentage}%)
                  </p>
                  <div className="space-y-1 text-xs">
                    <p className="text-blue-600">Input: {item.inputTokens.toLocaleString()}</p>
                    <p className="text-emerald-600">Output: {item.outputTokens.toLocaleString()}</p>
                    <p className="text-amber-600">Cache Create: {item.cacheCreationTokens.toLocaleString()}</p>
                    <p className="text-purple-600">Cache Read: {item.cacheReadTokens.toLocaleString()}</p>
                    <p className="text-muted-foreground font-semibold border-t pt-1 mt-1">
                      Total: {item.totalTokens.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {item.sessions} sessions, {item.messages} messages
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
        <Bar
          dataKey="inputTokens"
          stackId="tokens"
          fill="#3b82f6"
          name="Input Tokens"
        />
        <Bar
          dataKey="outputTokens"
          stackId="tokens"
          fill="#10b981"
          name="Output Tokens"
        />
        <Bar
          dataKey="cacheCreationTokens"
          stackId="tokens"
          fill="#f59e0b"
          name="Cache Create"
        />
        <Bar
          dataKey="cacheReadTokens"
          stackId="tokens"
          fill="#8b5cf6"
          name="Cache Read"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
