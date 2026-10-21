import { Dispatch, SetStateAction, useEffect, useState, RefObject, useRef } from "react";
import { useQuery } from '@tanstack/react-query';
import { API_PATH_PREFIX } from "@/features/UserAuth/utils/userApi";
import { fetchWithErrorHandling } from "@/features/Core/utils/web";
import { ARAStatusResponse, ResultSet } from "@/features/ResultList/types/results.d";
import { queryStatusResultsCompleteToast } from "@/features/Core/utils/toastMessages";

import { REFETCH_INTERVAL } from "@/features/ResultList/utils/pollingConfig";

/**
 * Returns the current New Results Available disclaimer status and a setter
 * that also updates localStorage.
 *
 * @param {boolean} visible - Whether the disclaimer tooltip is visible.
 * @returns {[boolean, Dispatch<SetStateAction<boolean>>]} - The disclaimer approval status and a setter.
 */
export const useNewResultsDisclaimerApproved = (
  visible: boolean
): [boolean, Dispatch<SetStateAction<boolean>>] => {
  const STORAGE_KEY = 'newResultsDisclaimerApproved';

  const [isNewResultsDisclaimerApproved, setIsNewResultsDisclaimerApproved] = useState<boolean>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : false;
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : false;
    setIsNewResultsDisclaimerApproved(stored);
  }, [visible]);

  const setAndPersistNewResultsDisclaimerApproved: Dispatch<SetStateAction<boolean>> = (value) => {
    setIsNewResultsDisclaimerApproved((prev) => {
      const next = typeof value === 'function' ? (value as (prev: boolean) => boolean)(prev) : value;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return [isNewResultsDisclaimerApproved, setAndPersistNewResultsDisclaimerApproved];
};

const JSON_GET = { method: 'GET', headers: { 'Content-Type': 'application/json' } };

// Both queries below are driven by useResultsPolling toggling `enabled`. Every
// enable must hit the network and a query switch must never replay a cached
// response, hence staleTime/gcTime 0 regardless of the client defaults.
const POLLED_QUERY_OPTIONS = { refetchOnWindowFocus: false, retry: false, staleTime: 0, gcTime: 0 } as const;

/**
 * Polls the ARA status endpoint for a query while enabled.
 * Response handling lives in useResultsPolling.
 */
export const useResultsStatusQuery = (currentQueryID: string | null, enabled: boolean) =>
  useQuery({
    queryKey: ['resultsStatus', currentQueryID],
    queryFn: () => {
      console.log("Fetching current ARA status...");
      return fetchWithErrorHandling<ARAStatusResponse>(
        () => fetch(`${API_PATH_PREFIX}/query/${currentQueryID}/status`, JSON_GET)
      );
    },
    enabled: enabled && !!currentQueryID,
    refetchInterval: REFETCH_INTERVAL,
    ...POLLED_QUERY_OPTIONS,
  });

/**
 * Fetches a query's result set once each time it is enabled.
 * Response handling lives in useResultsPolling.
 */
export const useResultsDataQuery = (currentQueryID: string | null, enabled: boolean) =>
  useQuery({
    queryKey: ['resultsData', currentQueryID],
    queryFn: () => {
      console.log("Fetching new results...");
      return fetchWithErrorHandling<ResultSet>(
        () => fetch(`${API_PATH_PREFIX}/query/${currentQueryID}/result`, JSON_GET)
      );
    },
    enabled: enabled && !!currentQueryID,
    ...POLLED_QUERY_OPTIONS,
  });

/**
 * Hook to show the results complete toast
 * 
 * @param arsStatus - The ARA status response
 * @param isFetchingResults - Whether results are being fetched
 */
export const useResultsCompleteToast = (arsStatus: ARAStatusResponse | null, isFetchingResults: boolean) => {
  const hasShownToast = useRef(false);
  useEffect(() => {
    if(arsStatus?.status === 'complete' && !isFetchingResults && !hasShownToast.current) {
      hasShownToast.current = true;
      queryStatusResultsCompleteToast();
    }
  }, [arsStatus?.status, isFetchingResults]);
};

/**
 * Configuration for the useQueryChangeReset hook
 */
export interface QueryChangeResetConfig {
  currentQueryID: string | null;
  prevQueryID: RefObject<string | null>;
  // Each owning hook resets its own state
  resetResultsData: () => void;
  resetFilters: () => void;
  resetPagination: () => void;
  closeNotesModal: () => void;
  resetShareState: () => void;
  resetBookmarks: () => void;
}

/**
 * Hook to reset ResultList state when the query ID changes (e.g., navigating to a different query).
 * This ensures that when a user navigates to a new query via URL change, all state is properly
 * reset and new data is fetched.
 * 
 * @param config - The current query ID plus each owning hook's reset callback
 */
export const useQueryChangeReset = (config: QueryChangeResetConfig): void => {
  const {
    currentQueryID,
    prevQueryID,
    resetResultsData,
    resetFilters,
    resetPagination,
    closeNotesModal,
    resetShareState,
    resetBookmarks,
  } = config;

  useEffect(() => {
    // Only reset if the query ID actually changed
    if (prevQueryID.current === currentQueryID) {
      return;
    }
    prevQueryID.current = currentQueryID;

    resetResultsData();
    resetFilters();
    resetPagination();
    closeNotesModal();
    resetShareState();
    resetBookmarks();
  }, [currentQueryID, prevQueryID, resetResultsData, resetFilters, resetPagination, closeNotesModal, resetShareState, resetBookmarks]);
};
