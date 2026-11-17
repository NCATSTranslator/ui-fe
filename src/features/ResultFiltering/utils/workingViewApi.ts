import { get, put, fetchWithErrorHandling, quietHttpErrorHandler } from '@/features/Core/utils/web';
import { API_PATH_PREFIX } from '@/features/UserAuth/utils/userApi';
import { isObject, isNumber, isString, isBoolean, checkProperties } from '@/features/Core/types/checkers';
import { Filter, Filters } from '@/features/ResultFiltering/types/filters';
import { makeEntitySearch } from '@/features/ResultFiltering/utils/filterFunctions';

export const WORKING_VIEW_VERSION = 1;

export interface PersistedFilter {
  id: string;
  name: string;
  value: string;
  negated: boolean;
}

export interface WorkingViewState {
  filters: PersistedFilter[];
}

/** The envelope a WorkingViewState travels in, both in the API body and in the URL. */
export interface VersionedWorkingViewState {
  version: number;
  state: WorkingViewState;
}

export interface WorkingView {
  user_id: string;
  pk: string;
  version: number;
  state: unknown;
  time_updated: string;
}

export const isPersistedFilter = (obj: unknown, warn = false): obj is PersistedFilter => {
  if (!isObject(obj)) return false;
  return checkProperties('isPersistedFilter', obj, [
    ['id', isString(obj.id), 'string', obj.id],
    ['name', isString(obj.name), 'string', obj.name],
    ['value', isString(obj.value), 'string', obj.value],
    ['negated', isBoolean(obj.negated), 'boolean', obj.negated],
  ], warn);
};

export const isWorkingViewState = (obj: unknown, warn = false): obj is WorkingViewState => {
  if (!isObject(obj)) return false;
  return checkProperties('isWorkingViewState', obj, [
    ['filters', Array.isArray(obj.filters) && obj.filters.every((f) => isPersistedFilter(f, warn)), 'PersistedFilter[]', obj.filters],
  ], warn);
};

export const isWorkingView = (obj: unknown, warn = false): obj is WorkingView => {
  if (!isObject(obj)) return false;
  return checkProperties('isWorkingView', obj, [
    ['user_id', isString(obj.user_id), 'string', obj.user_id],
    ['pk', isString(obj.pk), 'string', obj.pk],
    ['version', isNumber(obj.version), 'number', obj.version],
    ['state', 'state' in obj, 'present', obj.state],
    ['time_updated', isString(obj.time_updated), 'string', obj.time_updated],
  ], warn);
};

export const toVersionedWorkingViewState = (state: WorkingViewState): VersionedWorkingViewState =>
  ({ version: WORKING_VIEW_VERSION, state });

/**
 * Unwraps a versioned envelope (an API working view or a decoded URL payload) when this
 * client can read it: the current version with a well-formed state. Anything else is null.
 */
export const parseVersionedWorkingViewState = (envelope: unknown): WorkingViewState | null => {
  if (!isObject(envelope)) return null;
  return envelope.version === WORKING_VIEW_VERSION && isWorkingViewState(envelope.state) ? envelope.state : null;
};

export const toWorkingViewState = (filters: Filter[]): WorkingViewState => ({
  filters: filters.flatMap((filter) => (filter.id === undefined ? [] : [{
    id: filter.id,
    name: filter.name,
    value: filter.value ?? '',
    negated: filter.negated ?? false,
  }])),
});

export const filtersFromWorkingViewState = (state: WorkingViewState, availableFilters: Filters, origin: string): Filter[] => {
  const entitySearchId = makeEntitySearch().id;
  return state.filters.flatMap(({ id, name, value, negated }) => {
    const base: Filter | undefined = id === entitySearchId ? makeEntitySearch() : availableFilters[id];
    if (base === undefined) {
      console.error(`[filtersFromWorkingViewState] skipping unknown filter ${id} from ${origin}`);
      return [];
    }
    return [{ ...base, id, name: base.name || name, value, negated }];
  });
};

export const filtersFromWorkingView = (view: WorkingView, availableFilters: Filters): Filter[] | null => {
  const state = parseVersionedWorkingViewState(view);
  return state === null ? null : filtersFromWorkingViewState(state, availableFilters, `query ${view.pk}`);
};

const workingViewUrl = (pk: string): string => `${API_PATH_PREFIX}/users/me/queries/${pk}/working-view`;

/** Resolves to null when the query has no working view yet (404). Other failures reject after logging. */
export const getWorkingView = async (pk: string): Promise<WorkingView | null> => {
  const response = await get(workingViewUrl(pk));
  if (response.status === 404) return null;
  return fetchWithErrorHandling<WorkingView>(() => Promise.resolve(response), quietHttpErrorHandler, quietHttpErrorHandler, isWorkingView);
};

export const setWorkingView = async (pk: string, state: WorkingViewState): Promise<WorkingView> =>
  fetchWithErrorHandling<WorkingView>(
    () => put(workingViewUrl(pk), toVersionedWorkingViewState(state)),
    quietHttpErrorHandler,
    quietHttpErrorHandler,
    isWorkingView,
  );
