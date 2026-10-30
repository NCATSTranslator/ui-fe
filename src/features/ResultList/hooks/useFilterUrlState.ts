import { useEffect, useMemo } from 'react';
import { SetURLSearchParams, useSearchParams } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { getDataFromQueryVar } from '@/features/Core/utils/urlHelpers';
import { useLatest } from '@/features/Core/hooks/useLatest';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { WorkingViewState } from '@/features/ResultFiltering/utils/workingViewApi';
import {
  FILTER_URL_PARAM,
  decodeFilterUrlState,
  encodeFilterUrlState,
} from '@/features/ResultFiltering/utils/filterUrlState';

export const FILTER_URL_SYNC_DEBOUNCE_MS = 250;

/** The filter state carried by the URL, read from the already-decoded query string. */
export const useFilterUrlState = (decodedParams: string): WorkingViewState | null =>
  useMemo(() => decodeFilterUrlState(getDataFromQueryVar(FILTER_URL_PARAM, decodedParams)), [decodedParams]);

const writeFilterParam = (setSearchParams: SetURLSearchParams, encoded: string | null): void => {
  setSearchParams((previous) => {
    const next = new URLSearchParams(previous);
    if (encoded === null) next.delete(FILTER_URL_PARAM);
    else next.set(FILTER_URL_PARAM, encoded);
    return next;
  }, { replace: true });
};

interface UseFilterUrlSyncArgs {
  activeFilters: Filter[];
  enabled: boolean;
}

/**
 * Mirrors the active filters into the URL once `enabled`. Each write is a router
 * navigation that re-renders every consumer of the location, so writes are debounced
 * and a burst of filter clicks lands as one. A write still pending on unmount is dropped.
 */
export const useFilterUrlSync = ({ activeFilters, enabled }: UseFilterUrlSyncArgs): void => {
  const [searchParams, setSearchParams] = useSearchParams();
  // setSearchParams changes identity with the search string; the debounced write reads the latest.
  const setSearchParamsRef = useLatest(setSearchParams);
  const encoded = useMemo(() => encodeFilterUrlState(activeFilters), [activeFilters]);
  const current = searchParams.get(FILTER_URL_PARAM);

  const write = useMemo(
    () => debounce((value: string | null) => writeFilterParam(setSearchParamsRef.current, value), FILTER_URL_SYNC_DEBOUNCE_MS),
    [setSearchParamsRef],
  );
  useEffect(() => () => write.cancel(), [write]);

  useEffect(() => {
    if (!enabled || encoded === current) {
      write.cancel();
      return;
    }
    write(encoded);
  }, [enabled, encoded, current, write]);
};
