import React from 'react';
import type { ReviewCardProps } from '@/shared/types';

/**
 * Fun Facts card - Shows interesting stats and trivia
 */
export const FunFactsCard: React.FC<ReviewCardProps> = ({ data }) => {
  const { funFacts, activityStats } = data;

  return (
    <div className="text-center text-white">
      <p className="text-white/70 text-lg mb-6">Fun Facts About You</p>

      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {funFacts.slice(0, 6).map(fact => (
          <div key={fact.id} className="bg-white/5 rounded-lg p-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{fact.icon}</span>
              <span className="text-white/70 text-sm">{fact.title}</span>
            </div>
            <div className="text-xl font-bold text-amber-400">{fact.value}</div>
            <p className="text-xs text-white/50 mt-1">{fact.detail}</p>
          </div>
        ))}
      </div>

      {activityStats.longestStreak > 1 && (
        <div className="mt-6 bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 max-w-sm mx-auto">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl">🔥</span>
            <div>
              <span className="text-2xl font-bold text-orange-400">
                {activityStats.longestStreak}
              </span>
              <span className="text-white/80 ml-2">day streak!</span>
            </div>
          </div>
          <p className="text-white/60 text-sm mt-1">Your longest coding streak this year</p>
        </div>
      )}
    </div>
  );
};
