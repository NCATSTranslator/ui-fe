import { Filter } from '@/features/ResultFiltering/types/filters';
import { decodeBase64Url, encodeBase64Url } from '@/features/Core/utils/web';
import {
  WorkingViewState,
  parseVersionedWorkingViewState,
  toVersionedWorkingViewState,
  toWorkingViewState,
} from '@/features/ResultFiltering/utils/workingViewApi';

export const FILTER_URL_PARAM = 'f';

/** Encodes the active filters for the URL parameter, or null when there is nothing to carry. */
export const encodeFilterUrlState = (filters: Filter[]): string | null => {
  const state = toWorkingViewState(filters);
  if (state.filters.length === 0) return null;
  return encodeBase64Url(JSON.stringify(toVersionedWorkingViewState(state)));
};

/** Reads the URL parameter back; anything unreadable, stale or malformed is null. */
export const decodeFilterUrlState = (value: string | null): WorkingViewState | null => {
  if (value === null || value === '') return null;
  try {
    return parseVersionedWorkingViewState(JSON.parse(decodeBase64Url(value)));
  } catch {
    return null;
  }
};
