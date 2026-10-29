import { Filter } from '@/features/ResultFiltering/types/filters';
import { decodeBase64Url, encodeBase64Url } from '@/features/Core/utils/web';
import {
  WORKING_VIEW_VERSION,
  WorkingViewState,
  isWorkingViewState,
  toWorkingViewState,
} from '@/features/ResultFiltering/utils/workingViewApi';

export const FILTER_URL_PARAM = 'f';

export const encodeFilterUrlState = (filters: Filter[]): string | null => {
  const state = toWorkingViewState(filters);
  if (state.filters.length === 0) return null;
  return encodeBase64Url(JSON.stringify({ version: WORKING_VIEW_VERSION, filters: state.filters }));
};

export const decodeFilterUrlState = (value: string | null): WorkingViewState | null => {
  if (value === null || value === '') return null;
  try {
    const parsed: unknown = JSON.parse(decodeBase64Url(value));
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { version, ...state } = parsed as { version?: unknown };
    if (version !== WORKING_VIEW_VERSION || !isWorkingViewState(state)) return null;
    return state;
  } catch {
    return null;
  }
};
