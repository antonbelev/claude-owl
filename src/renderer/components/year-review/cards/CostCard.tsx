import React from 'react';
import type { ReviewCardProps } from '@/shared/types';

/**
 * Calculate accurate cache savings from sessions
 */
function calculateCacheSavings(data: ReviewCardProps['data']): number {
  // Model pricing for cache savings calculation
  const modelSavingsRate: Record<string, number> = {
    'claude-opus-4-5-20251101': 4.5,
    'claude-opus-4-20250514': 4.5,
    'claude-sonnet-4-5-20250929': 2.7,
    'claude-sonnet-3-5-20241022': 2.7,
    'claude-haiku-4-5-20251001': 0.9,
    'claude-haiku-3-5-20241022': 0.72,
  };

  let totalSavings = 0;

  for (const session of data.metrics.sessions) {
    for (const msg of session.messages) {
      const savingsRate = modelSavingsRate[msg.model] || 0;
      if (savingsRate > 0 && msg.cacheReadTokens > 0) {
        totalSavings += (msg.cacheReadTokens / 1_000_000) * savingsRate;
      }
    }
  }

  return totalSavings;
}

/**
 * Cost card - Shows spending with fun comparison and cache savings
 */
export const CostCard: React.FC<ReviewCardProps> = ({ data }) => {
  const { summary, costComparison } = data;

  const dailyAverage = summary.totalCost / Math.max(summary.daysActive, 1);
  const cacheSavings = calculateCacheSavings(data);

  return (
    <div className="text-center text-white">
      <p className="text-white/70 text-lg mb-2">Your 2025 AI Spend</p>

      <div className="my-8">
        <div className="text-6xl font-bold text-emerald-400">${summary.totalCost.toFixed(2)}</div>
      </div>

      <p className="text-lg text-white/80 mb-4">💰 {costComparison}</p>

      <p className="text-white/60 mb-8">
        That&apos;s about ${dailyAverage.toFixed(2)}/day on average
      </p>

      {cacheSavings > 0.01 && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-4 max-w-sm mx-auto">
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <span className="text-2xl">🟢</span>
            <span className="font-semibold">
              You saved ${cacheSavings.toFixed(2)} with prompt caching!
            </span>
          </div>
          <p className="text-sm text-white/60 mt-2">
            Cache efficiency: {Math.round(summary.cacheEfficiency)}%
          </p>
        </div>
      )}

      <p className="mt-8 text-amber-400 font-medium">&ldquo;Money well spent!&rdquo; 💪</p>
    </div>
  );
};
