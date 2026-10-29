import { get, put, fetchWithErrorHandling, quietHttpErrorHandler } from '@/features/Core/utils/web';
import { isObject, isNumber, isString, isBoolean, checkProperties } from '@/features/Core/types/checkers';
import { Filter, Filters } from '@/features/ResultFiltering/types/filters';
import { makeEntitySearch } from '@/features/ResultFiltering/utils/filterFunctions';

const API_PATH_PREFIX = '/api/v1';

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

export const toWorkingViewState = (filters: Filter[]): WorkingViewState => ({
  filters: filters.flatMap((filter) => (filter.id === undefined ? [] : [{
    id: filter.id,
    name: filter.name,
    value: filter.value ?? '',
    negated: filter.negated ?? false,
  }])),
});

export const filtersFromWorkingView = (view: WorkingView, availableFilters: Filters): Filter[] | null => {
  if (view.version !== WORKING_VIEW_VERSION || !isWorkingViewState(view.state)) return null;
  const entitySearchId = makeEntitySearch().id;
  return view.state.filters.flatMap(({ id, name, value, negated }) => {
    const base: Filter | undefined = id === entitySearchId ? makeEntitySearch() : availableFilters[id];
    if (base === undefined) {
      console.error(`[filtersFromWorkingView] skipping unknown filter ${id} saved for query ${view.pk}`);
      return [];
    }
    return [{ ...base, id, name: base.name || name, value, negated }];
  });
};

const workingViewUrl = (pk: string): string => `${API_PATH_PREFIX}/users/me/queries/${pk}/working-view`;

const isWorkingViewOrNull = (data: unknown): data is WorkingView | null => data === null || isWorkingView(data);

export const getWorkingView = async (pk: string): Promise<WorkingView | null> => {
  const notFoundAsNull = async (): Promise<Response> => {
    const response = await get(workingViewUrl(pk));
    if (response.status !== 404) return response;
    return new Response('null', { status: 200, headers: { 'content-type': 'application/json' } });
  };
  return fetchWithErrorHandling<WorkingView | null>(notFoundAsNull, quietHttpErrorHandler, quietHttpErrorHandler, isWorkingViewOrNull);
};

export const setWorkingView = async (pk: string, state: WorkingViewState): Promise<WorkingView> => {
  return fetchWithErrorHandling<WorkingView>(
    () => put(workingViewUrl(pk), { version: WORKING_VIEW_VERSION, state }),
    quietHttpErrorHandler,
    quietHttpErrorHandler,
    isWorkingView,
  );
};
