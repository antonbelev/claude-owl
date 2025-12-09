import React, { useMemo } from 'react';
import { cn } from '@/renderer/lib/utils';

interface SnowflakeProps {
  left: string;
  animationDelay: string;
  animationDuration: string;
  opacity: number;
  size: number;
}

interface SnowflakesOverlayProps {
  className?: string;
  count?: number;
}

/**
 * Animated snowflakes overlay for festive Year in Review experience
 * Respects prefers-reduced-motion for accessibility
 */
export const SnowflakesOverlay: React.FC<SnowflakesOverlayProps> = ({ className, count = 50 }) => {
  const snowflakes = useMemo<SnowflakeProps[]>(() => {
    return Array.from({ length: count }, () => ({
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 10}s`,
      animationDuration: `${10 + Math.random() * 20}s`,
      opacity: 0.3 + Math.random() * 0.5,
      size: 8 + Math.random() * 12,
    }));
  }, [count]);

  return (
    <div
      className={cn('fixed inset-0 pointer-events-none z-50 overflow-hidden', className)}
      aria-hidden="true"
    >
      {snowflakes.map((flake, index) => (
        <span
          key={index}
          className="snowflake absolute text-white animate-snowfall motion-reduce:animate-none motion-reduce:opacity-20 motion-reduce:top-1/2"
          style={{
            left: flake.left,
            animationDelay: flake.animationDelay,
            animationDuration: flake.animationDuration,
            opacity: flake.opacity,
            fontSize: `${flake.size}px`,
            top: '-20px',
          }}
        >
          ❄
        </span>
      ))}
    </div>
  );
};
