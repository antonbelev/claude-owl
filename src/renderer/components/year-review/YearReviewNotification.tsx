import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/renderer/components/ui/dialog';
import { Button } from '@/renderer/components/ui/button';
import { Checkbox } from '@/renderer/components/ui/checkbox';
import { Label } from '@/renderer/components/ui/label';
import { isYearReviewActive } from '@/shared/utils/year-review.utils';
import {
  isYearReviewNotificationDismissed,
  dismissYearReviewNotification,
} from '@/renderer/utils/year-review-storage';

/**
 * Notification modal that appears when user first opens Claude Owl
 * during the Year in Review period (Dec 15 - Jan 1)
 */
export const YearReviewNotification: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [hasCheckedData, setHasCheckedData] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkShouldShow = async () => {
      // Check if feature is active
      if (!isYearReviewActive()) {
        console.log('[YearReviewNotification] Feature not active');
        return;
      }

      // Check if already dismissed
      if (isYearReviewNotificationDismissed()) {
        console.log('[YearReviewNotification] Already dismissed');
        return;
      }

      // Check if user has data
      if (window.electronAPI) {
        try {
          const response = await window.electronAPI.computeMetrics({
            filter: { days: 365 },
          });

          if (response.success && response.data && response.data.sessions.length > 0) {
            console.log('[YearReviewNotification] User has data, showing notification');
            setIsOpen(true);
          } else {
            console.log('[YearReviewNotification] No data found');
          }
        } catch (error) {
          console.error('[YearReviewNotification] Error checking data:', error);
        }
      }

      setHasCheckedData(true);
    };

    // Small delay to let the app load
    const timer = setTimeout(checkShouldShow, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleViewNow = () => {
    dismissYearReviewNotification(dontShowAgain);
    setIsOpen(false);
    navigate('/year-review');
  };

  const handleMaybeLater = () => {
    dismissYearReviewNotification(dontShowAgain);
    setIsOpen(false);
  };

  // Don't render if we haven't checked yet
  if (!hasCheckedData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-900 to-indigo-950 border-white/20 text-white">
        <DialogHeader>
          <div className="text-center mb-4">
            <div className="text-5xl mb-3 animate-bounce">🎄 ❄️ 🎅</div>
          </div>
          <DialogTitle className="text-center text-2xl bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
            Your 2025 Year in Review is ready!
          </DialogTitle>
          <DialogDescription className="text-center text-white/70 text-base mt-2">
            See how you used Claude Code this year - your tokens, projects, and AI adventures await!
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-col gap-3 mt-4">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleMaybeLater}
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleViewNow}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            >
              ✨ View Now ✨
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-2 mt-2">
            <Checkbox
              id="dontShow"
              checked={dontShowAgain}
              onCheckedChange={checked => setDontShowAgain(checked === true)}
              className="border-white/40 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
            />
            <Label htmlFor="dontShow" className="text-sm text-white/60 cursor-pointer">
              Don&apos;t show this again
            </Label>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
