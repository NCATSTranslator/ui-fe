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
  handleSetFilters: (filters: Filter[]) => void;
}

const serialize = (state: WorkingViewState): string => JSON.stringify(state);

const useWorkingView = ({
  user,
  currentQueryID,
  activeFilters,
  availableFilters,
  hasResults,
  handleSetFilters,
}: UseWorkingViewArgs): void => {
  const isLoggedIn = user !== null;
  const [loaded, setLoaded] = useState<LoadedWorkingView | null>(null);
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

  useEffect(() => {
    if (loaded === null || loaded.pk !== currentQueryID || loaded.view === null) return;
    if (!hasResults || appliedPkRef.current === loaded.pk) return;
    appliedPkRef.current = loaded.pk;
    const filters = filtersFromWorkingView(loaded.view, availableFilters);
    if (filters === null) return;
    lastSyncedRef.current = serialize(toWorkingViewState(filters));
    if (filters.length > 0) handleSetFilters(filters);
  }, [loaded, currentQueryID, hasResults, availableFilters, handleSetFilters]);

  useEffect(() => {
    if (loaded === null || loaded.pk !== currentQueryID) return;
    if (loaded.view !== null && appliedPkRef.current !== loaded.pk) return;
    const state = toWorkingViewState(activeFilters);
    const key = serialize(state);
    if (key === lastSyncedRef.current) {
      save.cancel();
      return;
    }
    save(loaded.pk, state, key);
  }, [loaded, currentQueryID, activeFilters, save]);
};

export default useWorkingView;
