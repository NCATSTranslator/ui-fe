import { useEffect, useRef } from 'react';
import isEqual from 'lodash/isEqual';
import { setQueryStatus, QueryLoadingStatus } from '@/features/ResultList/slices/queryStatusSlice';
import { AppDispatch } from '@/redux/store';

/** Mirrors the list's loading status into Redux for sub-views, dispatching only when it changes. */
export const useQueryStatusDispatch = (dispatch: AppDispatch, currentQueryID: string | null, status: QueryLoadingStatus) => {
  const { isLoading, isError, araCount, resultStatus } = status;
  const prevStatusRef = useRef<QueryLoadingStatus | null>(null);
  useEffect(() => {
    if (!currentQueryID)
      return;
    const next: QueryLoadingStatus = { isLoading, isError, araCount, resultStatus };
    if (prevStatusRef.current && isEqual(prevStatusRef.current, next))
      return;
    prevStatusRef.current = next;
    dispatch(setQueryStatus({ pk: currentQueryID, status: next }));
  }, [dispatch, currentQueryID, isLoading, isError, araCount, resultStatus]);
};
