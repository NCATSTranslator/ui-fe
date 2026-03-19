import { useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export interface ResultsNavigateOptions {
  replace?: boolean;
}

// Parameters that are not persisted in the URL after navigation
export const TRANSIENT_PARAMS = ['pkey', 'ceids'] as const;

/**
 * A hook that navigates to a results page with the current search params.
 * @returns A function that navigates to a results page with the current search params.
 */
export const useResultsNavigate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Using a ref to avoid unnecessary re-renders of the component that uses this hook
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  
  return useCallback(
    (path: string, extraParams?: Record<string, string>, options?: ResultsNavigateOptions) => {
      const merged = new URLSearchParams(searchParamsRef.current);
      TRANSIENT_PARAMS.forEach(p => merged.delete(p));
      if (extraParams) {
        for (const [k, v] of Object.entries(extraParams)) {
          merged.set(k, v);
        }
      }
      navigate({ pathname: path, search: merged.toString() }, { replace: options?.replace });
    },
    [navigate]
  );
};
