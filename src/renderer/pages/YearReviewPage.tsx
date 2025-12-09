import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useYearReview } from '@/renderer/hooks/useYearReview';
import {
  SnowflakesOverlay,
  ReviewCard,
  WelcomeCard,
  TokensCard,
  CostCard,
  ActivityCard,
  ModelCard,
  ProjectsCard,
  BadgesCard,
  FunFactsCard,
  ShareCard,
} from '@/renderer/components/year-review';
import { Button } from '@/renderer/components/ui/button';

/**
 * Year in Review Page - Story-style review of 2025 Claude Code usage
 */
export function YearReviewPage() {
  const { data, loading, error, isActive, hasData } = useYearReview();
  const [currentCard, setCurrentCard] = useState(0);
  const navigate = useNavigate();

  // Feature not active (outside Dec 15 - Jan 1 window)
  if (!isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-8">
        <div className="text-center text-white max-w-md">
          <div className="text-6xl mb-6">🎄</div>
          <h2 className="text-2xl font-bold mb-4">
            The 2025 Year in Review has ended
          </h2>
          <p className="text-white/70 mb-6">
            Check back next December for your 2026 review!
          </p>
          <Button onClick={() => navigate('/metrics')} variant="outline" className="text-white border-white/30 hover:bg-white/10">
            Go to Metrics
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <SnowflakesOverlay count={30} />
        <div className="text-center text-white z-10">
          <Loader2 className="h-16 w-16 animate-spin text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">
            Preparing your 2025 journey...
          </h2>
          <p className="text-white/60">Crunching the numbers</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-8">
        <SnowflakesOverlay count={20} />
        <div className="text-center text-white max-w-md z-10">
          <div className="text-6xl mb-6">😢</div>
          <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <Button onClick={() => navigate('/metrics')} variant="outline" className="text-white border-white/30 hover:bg-white/10">
            Go to Metrics
          </Button>
        </div>
      </div>
    );
  }

  // No data state
  if (!hasData || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-8">
        <SnowflakesOverlay count={30} />
        <div className="text-center text-white max-w-md z-10">
          <div className="text-6xl mb-6">🎄 ❄️ 🎅</div>
          <h2 className="text-2xl font-bold mb-4">No 2025 Data Yet</h2>
          <p className="text-white/70 mb-6">
            Start using Claude Code to build your year in review! Your stats will
            appear here once you have some sessions.
          </p>
          <Button onClick={() => navigate('/metrics')} variant="outline" className="text-white border-white/30 hover:bg-white/10">
            Go to Metrics
          </Button>
        </div>
      </div>
    );
  }

  // Build cards array
  const cards = [
    { key: 'welcome', component: <WelcomeCard /> },
    { key: 'tokens', component: <TokensCard data={data} /> },
    { key: 'cost', component: <CostCard data={data} /> },
    { key: 'activity', component: <ActivityCard data={data} /> },
    { key: 'model', component: <ModelCard data={data} /> },
    { key: 'projects', component: <ProjectsCard data={data} /> },
    { key: 'badges', component: <BadgesCard data={data} /> },
    { key: 'funfacts', component: <FunFactsCard data={data} /> },
    { key: 'share', component: <ShareCard data={data} /> },
  ];

  const handleNext = () => {
    if (currentCard < cards.length - 1) {
      setCurrentCard((prev) => prev + 1);
    } else {
      // Finished - go back to metrics
      navigate('/metrics');
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard((prev) => prev - 1);
    }
  };

  const currentCardData = cards[currentCard];
  if (!currentCardData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-8">
      <SnowflakesOverlay />

      <div className="w-full max-w-2xl z-10">
        <ReviewCard
          key={currentCardData.key}
          onNext={handleNext}
          onPrevious={handlePrevious}
          currentIndex={currentCard}
          totalCards={cards.length}
        >
          {currentCardData.component}
        </ReviewCard>
      </div>
    </div>
  );
}
