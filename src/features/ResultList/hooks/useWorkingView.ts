import { useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import { Filter, Filters } from '@/features/ResultFiltering/types/filters';
import { User } from '@/features/UserAuth/types/user';
import {
  WorkingView,
  WorkingViewState,
  getWorkingView,
  setWorkingView,
  toWorkingViewState,
  filtersFromWorkingView,
  filtersFromWorkingViewState,
} from '@/features/ResultFiltering/utils/workingViewApi';

export const WORKING_VIEW_SAVE_DEBOUNCE_MS = 500;

interface LoadedWorkingView {
  pk: string;
  view: WorkingView | null;
}

interface UseWorkingViewArgs {
  user: User | null;
  currentQueryID: string | null;
  activeFilters: Filter[];
  availableFilters: Filters;
  hasResults: boolean;
  urlState: WorkingViewState | null;
  handleSetFilters: (filters: Filter[]) => void;
}

export interface UseWorkingViewReturn {
  initialized: boolean;
}

const serialize = (state: WorkingViewState): string => JSON.stringify(state);

const initialFilters = (
  urlState: WorkingViewState | null,
  view: WorkingView | null,
  availableFilters: Filters,
): Filter[] | null => {
  if (urlState !== null) return filtersFromWorkingViewState(urlState, availableFilters, 'the URL');
  if (view !== null) return filtersFromWorkingView(view, availableFilters);
  return null;
};

const useWorkingView = ({
  user,
  currentQueryID,
  activeFilters,
  availableFilters,
  hasResults,
  urlState,
  handleSetFilters,
}: UseWorkingViewArgs): UseWorkingViewReturn => {
  const isLoggedIn = user !== null;
  const [loaded, setLoaded] = useState<LoadedWorkingView | null>(null);
  const [initializedPk, setInitializedPk] = useState<string | null>(null);
  const appliedPkRef = useRef<string | null>(null);
  const lastSyncedRef = useRef<string | null>(null);

  const save = useMemo(() => debounce((pk: string, state: WorkingViewState, key: string) => {
    lastSyncedRef.current = key;
    setWorkingView(pk, state).catch(() => {});
  }, WORKING_VIEW_SAVE_DEBOUNCE_MS), []);

  useEffect(() => {
    setLoaded(null);
    appliedPkRef.current = null;
    lastSyncedRef.current = null;
    if (!isLoggedIn || currentQueryID === null) return;
    const pk = currentQueryID;
    let cancelled = false;
    getWorkingView(pk).then(
      (view) => { if (!cancelled) setLoaded({ pk, view }); },
      () => {},
    );
    return () => {
      cancelled = true;
      save.flush();
    };
  }, [isLoggedIn, currentQueryID, save]);

  const viewLoaded = loaded !== null && loaded.pk === currentQueryID;
  const ready = hasResults && currentQueryID !== null && (urlState !== null || !isLoggedIn || viewLoaded);

  useEffect(() => {
    if (!ready || appliedPkRef.current === currentQueryID) return;
    appliedPkRef.current = currentQueryID;
    const filters = initialFilters(urlState, viewLoaded ? loaded.view : null, availableFilters);
    if (filters !== null) {
      lastSyncedRef.current = serialize(toWorkingViewState(filters));
      if (filters.length > 0) handleSetFilters(filters);
    }
    setInitializedPk(currentQueryID);
  }, [ready, currentQueryID, urlState, viewLoaded, loaded, availableFilters, handleSetFilters]);

  useEffect(() => {
    if (!isLoggedIn || currentQueryID === null || appliedPkRef.current !== currentQueryID) return;
    const state = toWorkingViewState(activeFilters);
    const key = serialize(state);
    if (key === lastSyncedRef.current) {
      save.cancel();
      return;
    }
    save(currentQueryID, state, key);
  }, [isLoggedIn, currentQueryID, activeFilters, save]);

  return { initialized: initializedPk !== null && initializedPk === currentQueryID };
};

export default useWorkingView;
