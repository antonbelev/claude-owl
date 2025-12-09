import React from 'react';
import { cn } from '@/renderer/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';

interface ReviewCardProps {
  children: React.ReactNode;
  onNext: () => void;
  onPrevious: () => void;
  currentIndex: number;
  totalCards: number;
  className?: string;
}

/**
 * Wrapper component for Year in Review story-style cards
 * Provides navigation, progress dots, and animation
 */
export const ReviewCard: React.FC<ReviewCardProps> = ({
  children,
  onNext,
  onPrevious,
  currentIndex,
  totalCards,
  className,
}) => {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalCards - 1;

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (!isLast) onNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!isFirst) onPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFirst, isLast, onNext, onPrevious]);

  return (
    <div
      className={cn(
        'relative w-full max-w-2xl mx-auto',
        'animate-in fade-in-0 zoom-in-95 duration-300',
        className
      )}
    >
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-6">
        {Array.from({ length: totalCards }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-300',
              i === currentIndex
                ? 'bg-amber-400 w-6'
                : i < currentIndex
                  ? 'bg-amber-400/60'
                  : 'bg-white/30'
            )}
          />
        ))}
      </div>

      {/* Card content */}
      <div
        className={cn(
          'bg-white/10 backdrop-blur-md rounded-2xl p-8 min-h-[400px]',
          'border border-white/20 shadow-2xl',
          'flex flex-col'
        )}
      >
        <div className="flex-1">{children}</div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={onPrevious}
            disabled={isFirst}
            className={cn(
              'text-white/70 hover:text-white hover:bg-white/10',
              isFirst && 'opacity-0 pointer-events-none'
            )}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <span className="text-white/50 text-sm">
            {currentIndex + 1} / {totalCards}
          </span>

          <Button
            onClick={onNext}
            className={cn(
              'bg-amber-500 hover:bg-amber-600 text-white',
              isLast && 'bg-emerald-500 hover:bg-emerald-600'
            )}
          >
            {isLast ? 'Finish' : 'Next'}
            {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-white/40 text-xs mt-4">
        Use arrow keys or click to navigate
      </p>
    </div>
  );
};
