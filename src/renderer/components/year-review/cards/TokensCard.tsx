import React from 'react';
import type { ReviewCardProps } from '@/shared/types';
import { formatNumber } from '@/shared/utils/year-review.utils';

/**
 * Tokens card - Shows total tokens generated with fun comparison
 */
export const TokensCard: React.FC<ReviewCardProps> = ({ data }) => {
  const { summary, tokenComparison } = data;

  return (
    <div className="text-center text-white">
      <p className="text-white/70 text-lg mb-2">In 2025, you generated</p>

      <div className="my-8">
        <div className="text-6xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent animate-pulse">
          {formatNumber(summary.totalTokens)}
        </div>
        <div className="text-2xl text-white/80 mt-2">tokens</div>
      </div>

      <p className="text-lg text-amber-300/90 mb-8">📚 {tokenComparison}</p>

      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">
            {formatNumber(summary.totalInputTokens)}
          </div>
          <div className="text-xs text-white/60 mt-1">Input</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-2xl font-bold text-emerald-400">
            {formatNumber(summary.totalOutputTokens)}
          </div>
          <div className="text-xs text-white/60 mt-1">Output</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-400">
            {formatNumber(summary.totalCacheCreationTokens + summary.totalCacheReadTokens)}
          </div>
          <div className="text-xs text-white/60 mt-1">Cached</div>
        </div>
      </div>
    </div>
  );
};
