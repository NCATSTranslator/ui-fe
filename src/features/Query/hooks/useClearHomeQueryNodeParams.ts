import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  hasHomeQueryNodeParams,
  stripHomeQueryNodeParams,
} from '@/features/Query/utils/homeQueryParams';

/**
 * Removes canvas/node prefill query params (`i`, `l`, `nc`) from the URL when present.
 * Keeps other params (e.g. `tab`). Uses replace so clear does not add history entries.
 */
export const useClearHomeQueryNodeParams = () => {
  const [, setSearchParams] = useSearchParams();

  return useCallback(() => {
    setSearchParams((prev) => {
      if (!hasHomeQueryNodeParams(prev)) return prev;
      return stripHomeQueryNodeParams(prev);
    }, { replace: true });
  }, [setSearchParams]);
};
