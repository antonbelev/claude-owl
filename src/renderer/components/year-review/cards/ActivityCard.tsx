import React from 'react';
import type { ReviewCardProps } from '@/shared/types';
import { formatNumber } from '@/shared/utils/year-review.utils';

/**
 * Activity card - Shows peak coding month and activity trends
 */
export const ActivityCard: React.FC<ReviewCardProps> = ({ data }) => {
  const { activityStats, summary } = data;
  const { peakMonth, peakDay, monthlyData } = activityStats;

  // Get max sessions for scaling the bar chart
  const maxSessions = Math.max(...monthlyData.map((m) => m.sessions), 1);

  return (
    <div className="text-center text-white">
      <p className="text-white/70 text-lg mb-2">Your Peak Coding Period</p>

      {peakMonth && (
        <div className="my-6">
          <div className="text-5xl font-bold text-orange-400 mb-2">
            🔥 {peakMonth.name} 🔥
          </div>
          <p className="text-white/80">
            {peakMonth.sessions} sessions • {formatNumber(peakMonth.tokens)} tokens • $
            {peakMonth.cost.toFixed(2)}
          </p>
        </div>
      )}

      {/* Monthly activity bar chart */}
      <div className="my-8 px-4">
        <div className="flex items-end justify-center gap-1 h-24">
          {monthlyData.map((month) => {
            const height = (month.sessions / maxSessions) * 100;
            const isMax = peakMonth && month.month === `2025-${String(peakMonth.monthIndex + 1).padStart(2, '0')}`;
            return (
              <div
                key={month.month}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className={`w-5 rounded-t transition-all ${isMax ? 'bg-orange-400' : 'bg-white/30'}`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${month.monthName}: ${month.sessions} sessions`}
                />
                <span className="text-[10px] text-white/50">{month.monthName.charAt(0)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {peakDay && (
        <div className="bg-white/5 rounded-lg p-4 max-w-sm mx-auto">
          <p className="text-white/70 text-sm">Busiest Day</p>
          <p className="text-lg font-semibold text-amber-300">
            {peakDay.dayOfWeek}, {new Date(peakDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
          <p className="text-white/60 text-sm">
            {peakDay.sessions} sessions that day!
          </p>
        </div>
      )}

      <p className="mt-6 text-white/60">
        You were active for <span className="text-amber-400 font-semibold">{summary.daysActive}</span> days in 2025
      </p>
    </div>
  );
};
