/**
 * Year in Review localStorage utilities
 * These functions are renderer-only (require localStorage)
 */

import type { YearReviewNotificationState } from '@/shared/types';

const YEAR_REVIEW_STORAGE_KEY = 'yearReview2025';

/**
 * Check if the notification has been dismissed
 */
export function isYearReviewNotificationDismissed(): boolean {
  try {
    const stored = localStorage.getItem(YEAR_REVIEW_STORAGE_KEY);
    if (!stored) return false;
    const state: YearReviewNotificationState = JSON.parse(stored);
    return state.hasDismissedPermanently || state.hasSeenNotification;
  } catch {
    return false;
  }
}

/**
 * Dismiss the Year in Review notification
 */
export function dismissYearReviewNotification(permanent: boolean = false): void {
  const state: YearReviewNotificationState = {
    hasSeenNotification: true,
    hasDismissedPermanently: permanent,
    lastShownAt: new Date().toISOString(),
  };
  localStorage.setItem(YEAR_REVIEW_STORAGE_KEY, JSON.stringify(state));
}
