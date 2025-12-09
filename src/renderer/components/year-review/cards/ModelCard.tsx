import React from 'react';
import type { ReviewCardProps } from '@/shared/types';

/**
 * Model card - Shows favorite model with personality description
 */
export const ModelCard: React.FC<ReviewCardProps> = ({ data }) => {
  const { byModel, modelPersonality, summary } = data;

  // Get top 3 models
  const topModels = byModel.slice(0, 3);

  // Format model name for display
  const formatModelName = (model: string): string => {
    return model
      .replace('claude-', '')
      .replace(/-\d{8}$/, '')
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
  };

  // Format tokens for display (e.g., 1500000 -> "1.5M")
  const formatTokens = (tokens: number): string => {
    if (tokens >= 1_000_000) {
      return `${(tokens / 1_000_000).toFixed(1)}M`;
    }
    if (tokens >= 1_000) {
      return `${(tokens / 1_000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  const colors = ['text-purple-400', 'text-orange-400', 'text-blue-400'];
  const bgColors = ['bg-purple-500/20', 'bg-orange-500/20', 'bg-blue-500/20'];

  return (
    <div className="text-center text-white">
      <p className="text-white/70 text-lg mb-2">Your Favorite Claude</p>

      <div className="my-6">
        <div className="text-6xl mb-2">{modelPersonality.emoji}</div>
        <div className="text-4xl font-bold text-purple-400 mb-2">
          {formatModelName(summary.topModel)}
        </div>
        <p className="text-xl text-amber-300">&ldquo;{modelPersonality.title}&rdquo;</p>
      </div>

      <p className="text-white/80 mb-8 max-w-sm mx-auto">
        {modelPersonality.description}
      </p>

      {/* Model breakdown */}
      <div className="space-y-3 max-w-sm mx-auto">
        {topModels.map((model, index) => (
          <div
            key={model.model}
            className={`${bgColors[index]} rounded-lg p-3 flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-lg font-bold ${colors[index]}`}>
                {Math.round(model.percentage)}%
              </span>
              <span className="text-white/90 text-sm">
                {formatModelName(model.model)}
              </span>
            </div>
            <span className="text-white/60 text-sm">
              {formatTokens(model.totalTokens)} tokens
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
