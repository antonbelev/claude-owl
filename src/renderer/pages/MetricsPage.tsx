import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/renderer/components/ui/card';
import { useMetrics } from '@/renderer/hooks/useMetrics';
import type { MetricsFilter } from '@/shared/types';
import { DailySpendChart } from '@/renderer/components/metrics/DailySpendChart';
import { TokenCompositionChart } from '@/renderer/components/metrics/TokenCompositionChart';
import { ModelBreakdownChart } from '@/renderer/components/metrics/ModelBreakdownChart';
import { MetricsSummaryCard } from '@/renderer/components/metrics/MetricsSummaryCard';
import { TimelinePicker } from '@/renderer/components/metrics/TimelinePicker';
import { Loader2 } from 'lucide-react';

/**
 * MetricsPage - Display usage metrics and analytics
 * Phase 0 MVP: On-demand JSONL parsing with beautiful charts
 */
export function MetricsPage() {
  const [filter, setFilter] = useState<MetricsFilter>({});
  const { data, loading, error, refresh } = useMetrics(filter);

  // Loading state with spinner
  if (loading) {
    return (
      <div className="container mx-auto p-6 h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Computing Metrics...</h2>
        <p className="text-muted-foreground">
          Parsing JSONL files and calculating usage statistics
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Metrics</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No data state
  if (!data || data.sessions.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Usage Data Found</CardTitle>
            <CardDescription>No Claude Code sessions found in ~/.claude/projects/</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Start using Claude Code to generate usage metrics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Usage Metrics</h1>
            <p className="text-muted-foreground">Analyze your Claude Code usage and spending</p>
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Refresh
          </button>
        </div>

        {/* Timeline Filter */}
        <TimelinePicker filter={filter} onFilterChange={setFilter} />
      </div>

      {/* Summary Card */}
      <MetricsSummaryCard summary={data.summary} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Spend Trend */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Spend Trend</CardTitle>
            <CardDescription>Cost and token usage over time</CardDescription>
          </CardHeader>
          <CardContent>
            <DailySpendChart data={data.daily} />
          </CardContent>
        </Card>

        {/* Token Composition */}
        <Card>
          <CardHeader>
            <CardTitle>Token Composition</CardTitle>
            <CardDescription>Overall breakdown by token type</CardDescription>
          </CardHeader>
          <CardContent>
            <TokenCompositionChart summary={data.summary} />
          </CardContent>
        </Card>

        {/* Model Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Model Usage</CardTitle>
            <CardDescription>Token distribution by model</CardDescription>
          </CardHeader>
          <CardContent>
            <ModelBreakdownChart models={data.byModel} />
          </CardContent>
        </Card>
      </div>

      {/* Project Stats Table */}
      {data.byProject.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Project Statistics</CardTitle>
            <CardDescription>Usage breakdown by project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Project</th>
                    <th className="text-right py-2 px-4">Sessions</th>
                    <th className="text-right py-2 px-4">Total Tokens</th>
                    <th className="text-right py-2 px-4">Cost</th>
                    <th className="text-right py-2 px-4">Top Model</th>
                    <th className="text-right py-2 px-4">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byProject.map(project => (
                    <tr key={project.projectPath} className="border-b">
                      <td className="py-2 px-4 font-medium">{project.projectName}</td>
                      <td className="text-right py-2 px-4">{project.sessionCount}</td>
                      <td className="text-right py-2 px-4">
                        {(project.totalTokens || 0).toLocaleString()}
                      </td>
                      <td className="text-right py-2 px-4">${(project.cost || 0).toFixed(4)}</td>
                      <td className="text-right py-2 px-4 text-sm text-muted-foreground">
                        {project.topModel}
                      </td>
                      <td className="text-right py-2 px-4 text-sm text-muted-foreground">
                        {new Date(project.lastActivity).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
