import { useState, useEffect, useCallback } from 'react';
import type { YearReviewData, ComputeMetricsResponse } from '@/shared/types';
import { isYearReviewActive, buildYearReviewData } from '@/shared/utils/year-review.utils';

export interface YearReviewState {
  data: YearReviewData | null;
  loading: boolean;
  error: string | null;
  isActive: boolean;
  hasData: boolean;
}

/**
 * Hook for loading and managing Year in Review data
 */
export function useYearReview() {
  const [state, setState] = useState<YearReviewState>({
    data: null,
    loading: true,
    error: null,
    isActive: isYearReviewActive(),
    hasData: false,
  });

  const loadYearReview = useCallback(async () => {
    console.log('[useYearReview] Loading year in review data');
    setState(prev => ({ ...prev, loading: true, error: null }));

    // Check if feature is active
    if (!isYearReviewActive()) {
      console.log('[useYearReview] Feature not active');
      setState({
        data: null,
        loading: false,
        error: null,
        isActive: false,
        hasData: false,
      });
      return;
    }

    if (!window.electronAPI) {
      console.error('[useYearReview] electronAPI not available');
      setState({
        data: null,
        loading: false,
        error: 'Not running in Electron',
        isActive: true,
        hasData: false,
      });
      return;
    }

    try {
      // Fetch full year of metrics data
      const response = (await window.electronAPI.computeMetrics({
        filter: { days: 365 },
      })) as ComputeMetricsResponse;

      console.log('[useYearReview] Response received:', {
        success: response.success,
        sessionCount: response.data?.sessions.length,
        error: response.error,
      });

      if (response.success && response.data) {
        // Build year review data
        const yearReviewData = buildYearReviewData(response.data);

        const hasData = yearReviewData.metrics.sessions.length > 0;

        console.log('[useYearReview] Year review data built:', {
          sessions: yearReviewData.metrics.sessions.length,
          badges: yearReviewData.badges.filter(b => b.earned).length,
          hasData,
        });

        setState({
          data: yearReviewData,
          loading: false,
          error: null,
          isActive: true,
          hasData,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error ?? 'Failed to load metrics',
          isActive: true,
          hasData: false,
        });
      }
    } catch (error) {
      console.error('[useYearReview] Error loading year review:', error);
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load year review',
        isActive: true,
        hasData: false,
      });
    }
  }, []);

  useEffect(() => {
    loadYearReview();
  }, [loadYearReview]);

  return {
    ...state,
    refresh: loadYearReview,
  };
}
