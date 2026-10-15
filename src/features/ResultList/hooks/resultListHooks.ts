import { Dispatch, SetStateAction, useEffect, useState, RefObject, useRef } from "react";
import { useQuery } from '@tanstack/react-query';
import { API_PATH_PREFIX, useUser } from "@/features/UserAuth/utils/userApi";
import { fetchWithErrorHandling } from "@/features/Core/utils/web";
import { handleResultsError } from "@/features/ResultList/utils/resultsInteractionFunctions";
import { ARAStatusResponse, Result, ResultSet } from "@/features/ResultList/types/results.d";
import { queryStatusResultsCompleteToast } from "@/features/Core/utils/toastMessages";
import { useUpdateQueryLastSeen, useCopyQuery } from "@/features/Projects/hooks/customHooks";


// Constants
const STATUS_CHECK_TIMEOUT = 120; // 20 minutes (120 * 10 second intervals)
const REFETCH_INTERVAL = 10000; // 10 seconds

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

/**
 * Helper function to check if new ARAs have returned data
 */
const hasNewARAs = (currentARAs: string[], previousARAs: string[]): boolean => {
  return currentARAs.length > previousARAs.length;
};

/**
 * Helper function to check if status polling should stop
 */
const shouldStopStatusPolling = (status: string, statusCheckCount: number): boolean => {
  return status === 'complete' || statusCheckCount >= STATUS_CHECK_TIMEOUT;
};

/**
 * Helper function to handle error cases
 */
const handleStatusError = (
  error: unknown,
  formattedResults: Result[],
  setIsError: (value: boolean) => void,
  setIsLoading: (value: boolean) => void,
  setIsFetchingARAStatus: Dispatch<SetStateAction<boolean | null>>
): void => {
  if (formattedResults.length <= 0) {
    handleResultsError(true, setIsError, setIsLoading);
  }
  setIsFetchingARAStatus(null);
  console.error('ARA Status Error:', error);
};

/**
 * Custom hook for fetching ARA status using React Query
 * 
 * @param currentQueryID - The current query ID
 * @param isFetchingARAStatus - Whether ARA status is being fetched
 * @param setIsFetchingARAStatus - Setter for ARA status fetching state
 * @param numberOfStatusChecks - Ref to track number of status checks
 * @param formattedResults - Array of formatted results
 * @param setIsError - Function to set error state
 * @param setIsLoading - Function to set loading state
 * @param isFetchingResults - Whether results are being fetched
 * @param setIsFetchingResults - Setter for results fetching state
 * @param arsStatus - ARA status response
 * @param setArsStatus - Function to set query status
 */
export const useResultsStatusQuery = (
  currentQueryID: string | null,
  isFetchingARAStatus: boolean | null,
  setIsFetchingARAStatus: Dispatch<SetStateAction<boolean | null>>,
  isFetchingARAStatusRef: RefObject<boolean | null>,
  numberOfStatusChecks: RefObject<number>,
  formattedResults: Result[],
  setIsError: (value: boolean) => void,
  setIsLoading: (value: boolean) => void,
  isFetchingResults: boolean,
  setIsFetchingResults: Dispatch<SetStateAction<boolean>>,
  arsStatus: ARAStatusResponse | null,
  setArsStatus: (value: ARAStatusResponse) => void
) => {
  // Polling side-effect query: refs/setters are intentionally excluded from queryKey
  return useQuery({
    queryKey: ['resultsStatus', currentQueryID],
    queryFn: async (): Promise<void> => {
      if (!currentQueryID) {
        console.log("No query ID provided, skipping status fetch");
        return;
      }

      console.log("Fetching current ARA status...");

      try {
        const data = await fetchWithErrorHandling<ARAStatusResponse>(
          () => fetch(`${API_PATH_PREFIX}/query/${currentQueryID}/status`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          })
        );

        // Increment status check counter
        numberOfStatusChecks.current++;
        console.log("ARA status:", data);

        // Check if new ARAs have returned data
        const hasNewARAData = hasNewARAs(data.data.aras, arsStatus?.data.aras || []);
        
        if (hasNewARAData) {
          console.log(`Old ARAs: ${arsStatus?.data.aras}, New ARAs: ${data.data.aras}`);
          setIsFetchingResults(true);
        } else {
          console.log(`No new ARAs have returned data. Current status is: '${data.status}'`);
        }

        // Check if status polling should stop
        if (shouldStopStatusPolling(data.status, numberOfStatusChecks.current)) {
          console.log(`Stopping ARA status polling. Status: ${data.status}, Checks: ${numberOfStatusChecks.current}`);
          isFetchingARAStatusRef.current = false;
          setIsFetchingARAStatus(false);
          setIsFetchingResults(true);
        }

        // Set ars status
        setArsStatus(data);
      } catch (error) {
        handleStatusError(error, formattedResults, setIsError, setIsLoading, setIsFetchingARAStatus);
      }
    },
    refetchInterval: REFETCH_INTERVAL,
    enabled: isFetchingARAStatus === null ? false : isFetchingARAStatus,
    refetchOnWindowFocus: false,
    retry: false,
  });
};  

/**
 * Helper function to determine how to handle new results data
 */
const shouldSetFreshResults = (formattedResults: Result[]): boolean => {
  return formattedResults.length > 0;
};

/**
 * Helper function to check if ARA status polling should resume
 */
const shouldResumeStatusPolling = (status: string, statusCheckCount: number): boolean => {
  return status === 'running' && statusCheckCount < STATUS_CHECK_TIMEOUT;
};

/**
 * Helper function to handle results data processing
 */
const processResultsData = (
  data: ResultSet,
  formattedResults: Result[],
  setFreshRawResults: (results: ResultSet | null) => void,
  handleNewResults: (resultSet: ResultSet) => void,
  numberOfStatusChecks: RefObject<number>,
  setIsFetchingARAStatus: Dispatch<SetStateAction<boolean | null>>,
  setIsFetchingResults: Dispatch<SetStateAction<boolean>>,
  markQuerySeen: () => void
): void => {
  console.log('New results:', data);
  
  // If we've already gotten results before, set freshRawResults instead to
  // prevent original results from being overwritten
  if (shouldSetFreshResults(formattedResults)) {
    setFreshRawResults(data);
  } else {
    handleNewResults(data);
  }

  // The ARS can rarely report that it is done in the status check when it is not done
  if (shouldResumeStatusPolling(data.status, numberOfStatusChecks.current)) {
    setIsFetchingARAStatus(true);
  }

  setIsFetchingResults(false);

  markQuerySeen();
};

/**
 * Helper function to handle results data errors
 */
interface ResultsDataErrorContext {
  formattedResults: Result[];
  setIsFetchingARAStatus: Dispatch<SetStateAction<boolean | null>>;
  setIsFetchingResults: Dispatch<SetStateAction<boolean>>;
  setIsError: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
}

const handleResultsDataError = (error: unknown, context: ResultsDataErrorContext): void => {
  const { formattedResults, setIsFetchingARAStatus, setIsFetchingResults, setIsError, setIsLoading } = context;
  console.error('Results Data Error:', error);
  setIsFetchingARAStatus(false);
  setIsFetchingResults(false);
  
  if (formattedResults.length <= 0) {
    handleResultsError(true, setIsError, setIsLoading);
  }
};

/**
 * Custom hook for fetching results data using React Query
 * 
 * @param currentQueryID - The current query ID
 * @param isFetchingResults - Whether results are being fetched
 * @param formattedResults - Array of formatted results
 * @param setFreshRawResults - Function to set fresh raw results
 * @param handleNewResults - Function to handle new results
 * @param numberOfStatusChecks - Ref to track number of status checks
 * @param isFetchingARAStatus - Whether ARA status is being fetched (unused in queryFn but for enabled)
 * @param setIsFetchingARAStatus - Setter for ARA status fetching state
 * @param setIsError - Function to set error state
 * @param setIsLoading - Function to set loading state
 * @param setIsFetchingResults - Setter for results fetching state
 * @param sid - The save ID of the user's copy of the query, if one exists
 * @param areUserQueriesLoaded - Whether the user's queries have loaded, so a missing sid means "not saved" rather than "unknown"
 */
export const useResultsDataQuery = (
  currentQueryID: string | null,
  isFetchingResults: boolean,
  formattedResults: Result[],
  setFreshRawResults: (results: ResultSet | null) => void,
  handleNewResults: (resultSet: ResultSet) => void,
  numberOfStatusChecks: RefObject<number>,
  isFetchingARAStatus: boolean | null,
  setIsFetchingARAStatus: Dispatch<SetStateAction<boolean | null>>,
  setIsError: (value: boolean) => void,
  setIsLoading: (value: boolean) => void,
  setIsFetchingResults: Dispatch<SetStateAction<boolean>>,
  sid: number | undefined,
  areUserQueriesLoaded: boolean
) => {
  const [user] = useUser();
  const { mutate: touchQueryLastSeen } = useUpdateQueryLastSeen(sid);
  const { mutate: copyQueryMutate } = useCopyQuery();

  // A new object per results fetch, so each fetch is handled exactly once by the effect below
  const [seenResults, setSeenResults] = useState<{ queryID: string } | null>(null);
  const handledSeenResults = useRef<{ queryID: string } | null>(null);
  const copiedQueryID = useRef<string | null>(null);

  // Deferred until the user's queries have loaded; otherwise an unloaded list looks
  // like an unsaved query and triggers a duplicate copy
  useEffect(() => {
    if (!user || !areUserQueriesLoaded || !seenResults)
      return;
    if (seenResults === handledSeenResults.current || seenResults.queryID !== currentQueryID)
      return;
    handledSeenResults.current = seenResults;

    if (sid !== undefined) {
      touchQueryLastSeen();
    } else if (copiedQueryID.current !== seenResults.queryID) {
      copiedQueryID.current = seenResults.queryID;
      copyQueryMutate(seenResults.queryID);
    }
  }, [user, areUserQueriesLoaded, seenResults, currentQueryID, sid, touchQueryLastSeen, copyQueryMutate]);

  // Polling side-effect query: refs/setters/callbacks are intentionally excluded from queryKey
  return useQuery({
    queryKey: ['resultsData', currentQueryID],
    queryFn: async (): Promise<void> => {
      if (!currentQueryID) {
        console.log("No query ID provided, skipping results fetch");
        return;
      }

      console.log("Fetching new results...");

      try {
        const data = await fetchWithErrorHandling<ResultSet>(
          () => fetch(`${API_PATH_PREFIX}/query/${currentQueryID}/result`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          })
        );

        processResultsData(
          data,
          formattedResults,
          setFreshRawResults,
          handleNewResults,
          numberOfStatusChecks,
          setIsFetchingARAStatus,
          setIsFetchingResults,
          () => setSeenResults({ queryID: currentQueryID })
        );
      } catch (error) {
        handleResultsDataError(error, {
          formattedResults,
          setIsFetchingARAStatus,
          setIsFetchingResults,
          setIsError,
          setIsLoading,
        });
      }
    },
    enabled: isFetchingResults,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

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
