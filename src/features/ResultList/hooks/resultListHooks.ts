import { Dispatch, SetStateAction, useEffect, useState, RefObject, useRef } from "react";
import { useQuery } from '@tanstack/react-query';
import { API_PATH_PREFIX, SaveGroup } from "@/features/UserAuth/utils/userApi";
import { fetchWithErrorHandling } from "@/features/Common/utils/web";
import { handleResultsError } from "@/features/ResultList/utils/resultsInteractionFunctions";
import { ARAStatusResponse, Result, ResultSet, ResultEdge, Path, PathFilterState, SharedItem } from "@/features/ResultList/types/results.d";
import { Filter } from "@/features/ResultFiltering/types/filters";
import { queryStatusResultsCompleteToast } from "@/features/Core/utils/toastMessages";
import { useUpdateQueryLastSeen } from "@/features/Projects/hooks/customHooks";
import { getDataFromQueryVar } from "@/features/Common/utils/utilities";
import { useDispatch } from "react-redux";

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
  isFetchingARAStatus: RefObject<boolean | null>
): void => {
  if (formattedResults.length <= 0) {
    handleResultsError(true, setIsError, setIsLoading);
    isFetchingARAStatus.current = null;
  } else {
    isFetchingARAStatus.current = null;
  }
  console.error('ARA Status Error:', error);
};

/**
 * Custom hook for fetching ARA status using React Query
 * 
 * @param currentQueryID - The current query ID
 * @param isFetchingARAStatus - Ref to track if ARA status is being fetched
 * @param numberOfStatusChecks - Ref to track number of status checks
 * @param formattedResults - Array of formatted results
 * @param setIsError - Function to set error state
 * @param setIsLoading - Function to set loading state
 * @param isFetchingResults - Ref to track if results are being fetched
 * @param arsStatus - Ref to track ARA status
 * @param setArsStatus - Function to set query status
 */
export const useResultsStatusQuery = (
  currentQueryID: string | null,
  isFetchingARAStatus: RefObject<boolean | null>,
  numberOfStatusChecks: RefObject<number>,
  formattedResults: Result[],
  setIsError: (value: boolean) => void,
  setIsLoading: (value: boolean) => void,
  isFetchingResults: RefObject<boolean>,
  arsStatus: ARAStatusResponse | null,
  setArsStatus: (value: ARAStatusResponse) => void
) => {
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
          isFetchingResults.current = true;
        } else {
          console.log(`No new ARAs have returned data. Current status is: '${data.status}'`);
        }

        // Check if status polling should stop
        if (shouldStopStatusPolling(data.status, numberOfStatusChecks.current)) {
          console.log(`Stopping ARA status polling. Status: ${data.status}, Checks: ${numberOfStatusChecks.current}`);
          isFetchingARAStatus.current = false;
          isFetchingResults.current = true;
        }

        // Set ars status
        setArsStatus(data);
      } catch (error) {
        handleStatusError(error, formattedResults, setIsError, setIsLoading, isFetchingARAStatus);
      }
    },
    refetchInterval: REFETCH_INTERVAL,
    enabled: isFetchingARAStatus.current === null ? false : isFetchingARAStatus.current,
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
  isFetchingARAStatus: RefObject<boolean | null>,
  isFetchingResults: RefObject<boolean>,
  updateQueryLastSeen: () => void
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
    isFetchingARAStatus.current = true;
  }

  isFetchingResults.current = false;

  // call out to queries/touch endpoint to update the query last_seen timestamp
  updateQueryLastSeen();
};

/**
 * Helper function to handle results data errors
 */
const handleResultsDataError = (
  error: unknown,
  formattedResults: Result[],
  isFetchingARAStatus: RefObject<boolean | null>,
  isFetchingResults: RefObject<boolean>,
  setIsError: (value: boolean) => void,
  setIsLoading: (value: boolean) => void
): void => {
  console.error('Results Data Error:', error);
  isFetchingARAStatus.current = false;
  isFetchingResults.current = false;
  
  if (formattedResults.length <= 0) {
    handleResultsError(true, setIsError, setIsLoading);
  }
};

/**
 * Custom hook for fetching results data using React Query
 * 
 * @param currentQueryID - The current query ID
 * @param isFetchingResults - Ref to track if results are being fetched
 * @param formattedResults - Array of formatted results
 * @param setFreshRawResults - Function to set fresh raw results
 * @param handleNewResults - Function to handle new results
 * @param numberOfStatusChecks - Ref to track number of status checks
 * @param isFetchingARAStatus - Ref to track if ARA status is being fetched
 * @param setIsError - Function to set error state
 * @param setIsLoading - Function to set loading state
 */
export const useResultsDataQuery = (
  currentQueryID: string | null,
  isFetchingResults: RefObject<boolean>,
  formattedResults: Result[],
  setFreshRawResults: (results: ResultSet | null) => void,
  handleNewResults: (resultSet: ResultSet) => void,
  numberOfStatusChecks: RefObject<number>,
  isFetchingARAStatus: RefObject<boolean | null>,
  setIsError: (value: boolean) => void,
  setIsLoading: (value: boolean) => void,
  sid?: string
) => {
  const { mutate: updateQueryLastSeen } = useUpdateQueryLastSeen(sid);
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
          isFetchingARAStatus,
          isFetchingResults,
          updateQueryLastSeen
        );
      } catch (error) {
        handleResultsDataError(
          error,
          formattedResults,
          isFetchingARAStatus,
          isFetchingResults,
          setIsError,
          setIsLoading
        );
      }
    },
    enabled: isFetchingResults.current,
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
  // Current state
  currentQueryID: string | null;
  decodedParams: string;
  itemsPerPage: number;
  
  // Refs to reset
  prevQueryID: RefObject<string | null>;
  rawResults: RefObject<ResultSet | null>;
  prevRawResults: RefObject<ResultSet | null>;
  originalResults: RefObject<Result[]>;
  isFetchingARAStatus: RefObject<boolean | null>;
  isFetchingResults: RefObject<boolean>;
  numberOfStatusChecks: RefObject<number>;
  currentPage: RefObject<number>;
  firstLoad: RefObject<boolean>;
  shareResultID: RefObject<string | null>;
  
  // State setters
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setIsError: Dispatch<SetStateAction<boolean>>;
  setFormattedResults: Dispatch<SetStateAction<Result[]>>;
  setFreshRawResults: Dispatch<SetStateAction<ResultSet | null>>;
  setActiveFilters: Dispatch<SetStateAction<Filter[]>>;
  setActiveEntityFilters: Dispatch<SetStateAction<string[]>>;
  setAvailableFilters: Dispatch<SetStateAction<{[key: string]: Filter}>>;
  setPathFilterState: Dispatch<SetStateAction<PathFilterState | null>>;
  setArsStatus: Dispatch<SetStateAction<ARAStatusResponse | null>>;
  setResultStatus: Dispatch<SetStateAction<"error" | "running" | "success" | "unknown">>;
  setItemOffset: Dispatch<SetStateAction<number>>;
  setEndResultIndex: Dispatch<SetStateAction<number>>;
  setSelectedResult: Dispatch<SetStateAction<Result | null>>;
  setSelectedEdge: Dispatch<SetStateAction<ResultEdge | null>>;
  setSelectedPath: Dispatch<SetStateAction<Path | null>>;
  setSelectedPathKey: Dispatch<SetStateAction<string>>;
  setEvidenceModalOpen: Dispatch<SetStateAction<boolean>>;
  setNotesModalOpen: Dispatch<SetStateAction<boolean>>;
  setFocusModalOpen: Dispatch<SetStateAction<boolean>>;
  setShareModalOpen: Dispatch<SetStateAction<boolean>>;
  setSharedItem: Dispatch<SetStateAction<SharedItem>>;
  setAutoScrollToResult: Dispatch<SetStateAction<boolean>>;
  setExpandSharedResult: Dispatch<SetStateAction<boolean>>;
  setUserSaves: Dispatch<SetStateAction<SaveGroup | null>>;
  setResultIdParam: Dispatch<SetStateAction<string | null>>;
  setNodeDescription: Dispatch<SetStateAction<string>>;
}

/**
 * Hook to reset ResultList state when the query ID changes (e.g., navigating to a different query).
 * This ensures that when a user navigates to a new query via URL change, all state is properly
 * reset and new data is fetched.
 * 
 * @param config - Configuration object containing all refs and setters to reset
 */
export const useQueryChangeReset = (config: QueryChangeResetConfig): void => {
  const {
    currentQueryID,
    decodedParams,
    itemsPerPage,
    prevQueryID,
    rawResults,
    prevRawResults,
    originalResults,
    isFetchingARAStatus,
    isFetchingResults,
    numberOfStatusChecks,
    currentPage,
    firstLoad,
    shareResultID,
    setIsLoading,
    setIsError,
    setFormattedResults,
    setFreshRawResults,
    setActiveFilters,
    setActiveEntityFilters,
    setAvailableFilters,
    setPathFilterState,
    setArsStatus,
    setResultStatus,
    setItemOffset,
    setEndResultIndex,
    setSelectedResult,
    setSelectedEdge,
    setSelectedPath,
    setSelectedPathKey,
    setEvidenceModalOpen,
    setNotesModalOpen,
    setFocusModalOpen,
    setShareModalOpen,
    setSharedItem,
    setAutoScrollToResult,
    setExpandSharedResult,
    setUserSaves,
    setResultIdParam,
    setNodeDescription,
  } = config;

  const dispatch = useDispatch();

  useEffect(() => {
    // Only reset if the query ID actually changed
    if (prevQueryID.current === currentQueryID) {
      return;
    }
    
    // Update the previous query ID ref
    prevQueryID.current = currentQueryID;
    
    // Reset loading and error state
    setIsLoading(true);
    setIsError(false);
    
    // Reset results state
    setFormattedResults([]);
    setFreshRawResults(null);
    rawResults.current = null;
    prevRawResults.current = null;
    originalResults.current = [];
    
    // Reset filter state
    setActiveFilters([]);
    setActiveEntityFilters([]);
    setAvailableFilters({});
    setPathFilterState(null);
    
    // Reset fetching refs
    isFetchingARAStatus.current = true;
    isFetchingResults.current = false;
    numberOfStatusChecks.current = 0;
    
    // Reset ARA status
    setArsStatus(null);
    setResultStatus("unknown");
    
    // Reset pagination
    currentPage.current = 0;
    setItemOffset(0);
    setEndResultIndex(itemsPerPage);
    
    // Reset first load flag to handle shared result modal
    firstLoad.current = true;
    
    // Reset modal and selection state
    setSelectedResult(null);
    setSelectedEdge(null);
    setSelectedPath(null);
    setSelectedPathKey("");
    setEvidenceModalOpen(false);
    setNotesModalOpen(false);
    setFocusModalOpen(false);
    setShareModalOpen(false);
    setSharedItem({index: 0, page: 0, name: '', type: ''});
    setAutoScrollToResult(false);
    setExpandSharedResult(false);
    shareResultID.current = null;
    
    // Reset user saves for new query
    setUserSaves(null);
    
    // Update result ID param from URL for new query
    setResultIdParam(getDataFromQueryVar("r", decodedParams));
    setNodeDescription("");
  }, [currentQueryID, decodedParams, itemsPerPage]);
};
