import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDataFromQueryVar } from '@/features/Core/utils/urlHelpers';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { WorkingViewState } from '@/features/ResultFiltering/utils/workingViewApi';
import {
  FILTER_URL_PARAM,
  decodeFilterUrlState,
  encodeFilterUrlState,
} from '@/features/ResultFiltering/utils/filterUrlState';

export const useFilterUrlState = (decodedParams: string): WorkingViewState | null =>
  useMemo(() => decodeFilterUrlState(getDataFromQueryVar(FILTER_URL_PARAM, decodedParams)), [decodedParams]);

interface UseFilterUrlSyncArgs {
  activeFilters: Filter[];
  enabled: boolean;
}

export const useFilterUrlSync = ({ activeFilters, enabled }: UseFilterUrlSyncArgs): void => {
  const [searchParams, setSearchParams] = useSearchParams();
  const encoded = useMemo(() => encodeFilterUrlState(activeFilters), [activeFilters]);
  const current = searchParams.get(FILTER_URL_PARAM);

  useEffect(() => {
    if (!enabled || encoded === current) return;
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (encoded === null) next.delete(FILTER_URL_PARAM);
      else next.set(FILTER_URL_PARAM, encoded);
      return next;
    }, { replace: true });
  }, [enabled, encoded, current, setSearchParams]);
};
