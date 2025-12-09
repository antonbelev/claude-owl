import React from 'react';

/**
 * Welcome card - First card in the Year in Review flow
 */
export const WelcomeCard: React.FC = () => {
  return (
    <div className="text-center text-white">
      <div className="text-6xl mb-6 animate-bounce">
        🎄 ❄️ 🎅
      </div>

      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
        Your 2025
      </h1>
      <h2 className="text-3xl font-semibold mb-6">
        Year in Review
      </h2>

      <p className="text-lg text-white/80 max-w-md mx-auto leading-relaxed">
        Let&apos;s take a journey through your Claude Code adventures this year.
        Discover your stats, achievements, and memorable moments!
      </p>

      <div className="mt-8 flex justify-center gap-4">
        <span className="text-4xl">🚀</span>
        <span className="text-4xl">💻</span>
        <span className="text-4xl">✨</span>
      </div>

      <p className="mt-8 text-white/60 text-sm">
        Click Next to begin your journey
      </p>
    </div>
  );
};
