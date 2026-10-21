import { useCallback, useEffect, useRef, RefObject } from 'react';
import { ResultSet } from '@/features/ResultList/types/results.d';
import { trackEvent } from '@/features/Analytics/utils/dataLayer';

/**
 * Reports the results_loaded analytics event once per query: on the first result
 * set that either has results or arrives after the ARS has finished. The ARS
 * streams partial sets, so the returned callback may be called many times.
 */
export const useResultsLoadedTracking = (
  currentQueryID: string | null,
  isPathfinderRef: RefObject<boolean>,
  isFetchingARAStatusRef: RefObject<boolean | null>,
) => {
  const trackedFor = useRef<string | null>(null);
  const waitStartedAt = useRef<number>(Date.now());

  // Restart the clock whenever a different query is opened, so load_ms measures
  // this query's wait rather than time since the tab opened.
  useEffect(() => {
    waitStartedAt.current = Date.now();
  }, [currentQueryID]);

  return useCallback((resultSet: ResultSet, resultCount: number) => {
    const settled = resultCount > 0 || !isFetchingARAStatusRef.current;
    if (!settled || trackedFor.current === currentQueryID) return;
    trackedFor.current = currentQueryID;
    trackEvent('results_loaded', {
      query_type: isPathfinderRef.current ? 'pathfinder' : 'single',
      query_status: resultSet.status,
      result_count: resultCount,
      load_ms: Date.now() - waitStartedAt.current,
    });
  }, [currentQueryID, isPathfinderRef, isFetchingARAStatusRef]);
};
