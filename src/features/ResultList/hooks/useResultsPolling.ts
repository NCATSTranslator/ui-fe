import { useCallback, useEffect, useRef, useState, Dispatch, SetStateAction, RefObject } from 'react';
import { useResultsStatusQuery, useResultsDataQuery } from '@/features/ResultList/hooks/resultListHooks';
import { ARAStatusResponse, ResultSet } from '@/features/ResultList/types/results.d';
import { STATUS_CHECK_TIMEOUT } from '@/features/ResultList/utils/pollingConfig';
import { useLatest } from '@/features/Core/hooks/useLatest';

export const hasNewARAs = (currentARAs: string[], previousARAs: string[]): boolean =>
  currentARAs.length > previousARAs.length;

export const shouldStopStatusPolling = (status: string, statusCheckCount: number): boolean =>
  status === 'complete' || statusCheckCount >= STATUS_CHECK_TIMEOUT;

export const shouldResumeStatusPolling = (status: string, statusCheckCount: number): boolean =>
  status === 'running' && statusCheckCount < STATUS_CHECK_TIMEOUT;

/**
 * Runs `handle` once for each completed fetch, keyed on the fetch timestamp
 * rather than the value: identical polls share a reference, and a remount must
 * not replay a response that was already handled.
 */
const useOncePerFetch = <T,>(updatedAt: number, value: T | null | undefined, handle: (value: T) => void) => {
  const handledAt = useRef(0);
  useEffect(() => {
    if (value === null || value === undefined || updatedAt === handledAt.current) return;
    handledAt.current = updatedAt;
    handle(value);
  }, [updatedAt, value, handle]);
};

interface UseResultsPollingArgs {
  currentQueryID: string | null;
  presetIsLoading: boolean;
  /** A result set arrived; the caller decides whether to show it or hold it as "fresh". */
  onResults: (data: ResultSet) => void;
  /** A status or result fetch failed; polling has already updated its own flags. */
  onError: () => void;
}

/**
 * Hands out result fetches one at a time. A request made while a fetch is in
 * flight is remembered and served by a follow-up fetch once that one lands,
 * since the in-flight request may predate the ARAs that prompted it.
 */
const useResultsRequest = (
  isFetchingResults: boolean,
  setIsFetchingResults: Dispatch<SetStateAction<boolean>>,
  refetch: () => unknown,
) => {
  const isFetchingResultsRef = useLatest(isFetchingResults);
  const refetchRef = useLatest(refetch);
  const requestedMidFetch = useRef(false);

  const requestResults = useCallback(() => {
    if (isFetchingResultsRef.current) requestedMidFetch.current = true;
    else setIsFetchingResults(true);
  }, [isFetchingResultsRef, setIsFetchingResults]);

  const finishResults = useCallback(() => {
    if (!requestedMidFetch.current) {
      setIsFetchingResults(false);
      return;
    }
    requestedMidFetch.current = false;
    console.log("ARAs reported during the last results fetch; fetching again");
    refetchRef.current();
  }, [refetchRef, setIsFetchingResults]);

  const clearRequest = useCallback(() => {
    requestedMidFetch.current = false;
  }, []);

  return { requestResults, finishResults, clearRequest };
};

export interface UseResultsPollingReturn {
  arsStatus: ARAStatusResponse | null;
  isFetchingARAStatus: boolean | null;
  isFetchingARAStatusRef: RefObject<boolean | null>;
  isFetchingResults: boolean;
  resetPolling: () => void;
}

/**
 * Drives the status → results polling loop for a query. The ARA status endpoint
 * is polled while isFetchingARAStatus is true; each time more ARAs have reported,
 * or the status completes, the result endpoint is fetched once (isFetchingResults).
 * A "running" result set re-arms status polling, up to STATUS_CHECK_TIMEOUT checks.
 * ARAs that report while a result fetch is in flight get a follow-up fetch.
 */
export const useResultsPolling = ({
  currentQueryID,
  presetIsLoading,
  onResults,
  onError,
}: UseResultsPollingArgs): UseResultsPollingReturn => {
  const [arsStatus, setArsStatus] = useState<ARAStatusResponse | null>(null);
  // Lifted from refs so updates trigger re-renders for sidebar/status; null means "never started"
  const [isFetchingARAStatus, setIsFetchingARAStatus] = useState<boolean | null>(presetIsLoading ? true : null);
  const [isFetchingResults, setIsFetchingResults] = useState(false);
  const numberOfStatusChecks = useRef(0);

  // Latest values for the stable handlers below and for callers' stable callbacks
  const isFetchingARAStatusRef = useLatest(isFetchingARAStatus);
  const arsStatusRef = useLatest(arsStatus);
  const callbacksRef = useLatest({ onResults, onError });

  const statusQuery = useResultsStatusQuery(currentQueryID, isFetchingARAStatus === true);
  const dataQuery = useResultsDataQuery(currentQueryID, isFetchingResults);
  const { requestResults, finishResults, clearRequest } = useResultsRequest(isFetchingResults, setIsFetchingResults, dataQuery.refetch);

  const handleStatus = useCallback((data: ARAStatusResponse) => {
    numberOfStatusChecks.current++;
    console.log("ARA status:", data);

    const newARAs = hasNewARAs(data.data.aras, arsStatusRef.current?.data.aras ?? []);
    const stopPolling = shouldStopStatusPolling(data.status, numberOfStatusChecks.current);
    if (newARAs)
      console.log(`Old ARAs: ${arsStatusRef.current?.data.aras}, New ARAs: ${data.data.aras}`);
    if (stopPolling) {
      console.log(`Stopping ARA status polling. Status: ${data.status}, Checks: ${numberOfStatusChecks.current}`);
      isFetchingARAStatusRef.current = false;
      setIsFetchingARAStatus(false);
    }
    // Either event means the result endpoint has something new to offer
    if (newARAs || stopPolling)
      requestResults();
    setArsStatus(data);
  }, [arsStatusRef, isFetchingARAStatusRef, requestResults]);

  const handleStatusError = useCallback((error: Error) => {
    console.error('ARA Status Error:', error);
    setIsFetchingARAStatus(null);
    callbacksRef.current.onError();
  }, [callbacksRef]);

  const handleResults = useCallback((data: ResultSet) => {
    callbacksRef.current.onResults(data);
    // The ARS can rarely report that it is done in the status check when it is not done
    if (shouldResumeStatusPolling(data.status, numberOfStatusChecks.current))
      setIsFetchingARAStatus(true);
    finishResults();
  }, [callbacksRef, finishResults]);

  // A failed result fetch doesn't stop status polling: while the query is still
  // running, the next status tick (more ARAs, or completion) fetches results again.
  const handleResultsError = useCallback((error: Error) => {
    console.error('Results Data Error:', error);
    clearRequest();
    setIsFetchingResults(false);
    callbacksRef.current.onError();
  }, [callbacksRef, clearRequest]);

  useOncePerFetch(statusQuery.dataUpdatedAt, statusQuery.data, handleStatus);
  useOncePerFetch(statusQuery.errorUpdatedAt, statusQuery.error, handleStatusError);
  useOncePerFetch(dataQuery.dataUpdatedAt, dataQuery.data, handleResults);
  useOncePerFetch(dataQuery.errorUpdatedAt, dataQuery.error, handleResultsError);

  const resetPolling = useCallback(() => {
    setArsStatus(null);
    setIsFetchingARAStatus(true);
    clearRequest();
    setIsFetchingResults(false);
    numberOfStatusChecks.current = 0;
  }, [clearRequest]);

  return {
    arsStatus,
    isFetchingARAStatus,
    isFetchingARAStatusRef,
    isFetchingResults,
    resetPolling,
  };
};
