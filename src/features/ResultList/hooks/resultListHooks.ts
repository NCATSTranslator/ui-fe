import { Dispatch, SetStateAction, useEffect, useState, RefObject } from "react";
import { useQuery } from '@tanstack/react-query';
import { API_PATH_PREFIX } from "@/features/UserAuth/utils/userApi";
import { fetchWithErrorHandling } from "@/features/Common/utils/web";
import { handleResultsError } from "@/features/ResultList/utils/resultsInteractionFunctions";
import { ARAStatusResponse, Result, ResultSet } from "@/features/ResultList/types/results";

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
  return status === 'success' || statusCheckCount >= STATUS_CHECK_TIMEOUT;
};

/**
 * Helper function to update returned ARAs state
 */
const updateReturnedARAs = (
  data: ARAStatusResponse,
  returnedARAs: RefObject<{aras: string[], status: string}>
): void => {
  const newReturnedARAs = {
    ...data.data,
    status: data.status
  };
  returnedARAs.current = newReturnedARAs;
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
 * @param returnedARAs - Ref to track returned ARAs
 * @param numberOfStatusChecks - Ref to track number of status checks
 * @param formattedResults - Array of formatted results
 * @param setIsError - Function to set error state
 * @param setIsLoading - Function to set loading state
 * @param isFetchingResults - Ref to track if results are being fetched
 */
export const useResultsStatusQuery = (
  currentQueryID: string | null,
  isFetchingARAStatus: RefObject<boolean | null>,
  returnedARAs: RefObject<{aras: string[], status: string}>,
  numberOfStatusChecks: RefObject<number>,
  formattedResults: Result[],
  setIsError: (value: boolean) => void,
  setIsLoading: (value: boolean) => void,
  isFetchingResults: RefObject<boolean>
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
        const hasNewARAData = hasNewARAs(data.data.aras, returnedARAs.current.aras);
        
        if (hasNewARAData) {
          console.log(`Old ARAs: ${returnedARAs.current.aras}, New ARAs: ${data.data.aras}`);
          updateReturnedARAs(data, returnedARAs);
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
  isFetchingResults: RefObject<boolean>
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
  setIsLoading: (value: boolean) => void
) => {
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
          isFetchingResults
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