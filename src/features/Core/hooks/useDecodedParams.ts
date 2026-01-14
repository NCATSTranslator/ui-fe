import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { getDecodedParamsFromSearch } from "@/features/Common/utils/web";

/**
 * React hook that returns decoded URL query parameters.
 * Automatically re-computes when the URL changes (reactive to navigation).
 *
 * @returns {string} The decoded query parameters.
 */
export const useDecodedParams = (): string => {
  const location = useLocation();
  return useMemo(() => getDecodedParamsFromSearch(location.search), [location.search]);
}

