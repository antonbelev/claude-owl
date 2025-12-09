import React from 'react';
import type { ReviewCardProps } from '@/shared/types';
import { cn } from '@/renderer/lib/utils';

/**
 * Badges card - Shows achievements/badges earned
 */
export const BadgesCard: React.FC<ReviewCardProps> = ({ data }) => {
  const { badges } = data;

  const earnedBadges = badges.filter(b => b.earned);
  const unearnedBadges = badges.filter(b => !b.earned);

  return (
    <div className="text-center text-white">
      <p className="text-white/70 text-lg mb-2">🏆 Your 2025 Badges 🏆</p>

      <p className="text-amber-400 font-semibold mb-6">
        You earned {earnedBadges.length} of {badges.length} badges!
      </p>

      {/* Earned badges */}
      <div className="grid grid-cols-4 gap-3 mb-6 max-w-md mx-auto">
        {earnedBadges.map(badge => (
          <div
            key={badge.id}
            className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3 flex flex-col items-center"
            title={`${badge.description} - ${badge.detail}`}
          >
            <span className="text-3xl mb-1">{badge.emoji}</span>
            <span className="text-xs text-white/80 text-center leading-tight">{badge.name}</span>
          </div>
        ))}
      </div>

      {/* Badge details */}
      {earnedBadges.length > 0 && (
        <div className="space-y-2 max-w-sm mx-auto text-left">
          {earnedBadges.slice(0, 4).map(badge => (
            <div key={badge.id} className="flex items-center gap-2 text-sm">
              <span className="text-lg">{badge.emoji}</span>
              <span className="text-white/60">{badge.name}:</span>
              <span className="text-white/90">{badge.detail}</span>
            </div>
          ))}
        </div>
      )}

      {/* Unearned badges preview */}
      {unearnedBadges.length > 0 && (
        <div className="mt-6">
          <p className="text-white/40 text-sm mb-2">Badges to unlock next year:</p>
          <div className="flex justify-center gap-2">
            {unearnedBadges.slice(0, 4).map(badge => (
              <div
                key={badge.id}
                className={cn('bg-white/5 rounded-lg p-2 opacity-40', 'grayscale')}
                title={`${badge.name}: ${badge.description}`}
              >
                <span className="text-2xl">{badge.emoji}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
