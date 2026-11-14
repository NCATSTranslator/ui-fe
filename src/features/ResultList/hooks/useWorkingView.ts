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
  /** The query the displayed results belong to. It lags currentQueryID right after a query change. */
  resultsQueryID: string | null;
  hasResults: boolean;
  activeFilters: Filter[];
  availableFilters: Filters;
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
): Filter[] => {
  if (urlState !== null) return filtersFromWorkingViewState(urlState, availableFilters, 'the URL');
  if (view !== null) return filtersFromWorkingView(view, availableFilters) ?? [];
  return [];
};

/**
 * Restores a query's filters once its results are in (from the URL first, else from the
 * user's saved working view) and afterwards saves the user's filter changes back.
 * Nothing is written to the server until the user changes a filter after the restore.
 */
const useWorkingView = ({
  user,
  currentQueryID,
  resultsQueryID,
  hasResults,
  activeFilters,
  availableFilters,
  urlState,
  handleSetFilters,
}: UseWorkingViewArgs): UseWorkingViewReturn => {
  const isLoggedIn = user !== null;
  const [loaded, setLoaded] = useState<LoadedWorkingView | null>(null);
  const [initializedPk, setInitializedPk] = useState<string | null>(null);
  const appliedPkRef = useRef<string | null>(null);
  // Serialized state the server is known (or assumed) to hold; a save is only needed when the active filters differ.
  const lastSyncedRef = useRef<string | null>(null);
  // The activeFilters array that was current when a restore was requested. Saving is held until
  // handleSetFilters has replaced it, so the pre-restore filters are never written over the saved view.
  const preRestoreFiltersRef = useRef<Filter[] | null>(null);

  const save = useMemo(() => debounce((pk: string, state: WorkingViewState, key: string) => {
    lastSyncedRef.current = key;
    setWorkingView(pk, state).catch(() => {});
  }, WORKING_VIEW_SAVE_DEBOUNCE_MS), []);

  // Start over, and load the saved view, whenever the query or the login state changes.
  useEffect(() => {
    setLoaded(null);
    setInitializedPk(null);
    appliedPkRef.current = null;
    lastSyncedRef.current = null;
    preRestoreFiltersRef.current = null;
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
  const resultsReady = hasResults && currentQueryID !== null && resultsQueryID === currentQueryID;
  const ready = resultsReady && (urlState !== null || !isLoggedIn || viewLoaded);

  // Restore once per query, as soon as its results (and, when they are needed, its saved view) are in.
  useEffect(() => {
    if (!ready || appliedPkRef.current === currentQueryID) return;
    appliedPkRef.current = currentQueryID;
    const restored = initialFilters(urlState, viewLoaded ? loaded.view : null, availableFilters);
    lastSyncedRef.current = serialize(toWorkingViewState(restored));
    // Filters picked in this session before the restore could run (e.g. while the login was
    // still resolving) win over it, and the effect below saves them.
    if (restored.length > 0 && activeFilters.length === 0) {
      preRestoreFiltersRef.current = activeFilters;
      handleSetFilters(restored);
    }
    setInitializedPk(currentQueryID);
  }, [ready, currentQueryID, urlState, viewLoaded, loaded, availableFilters, activeFilters, handleSetFilters]);

  // Save filter changes made after the restore, debounced. Unchanged state is never re-sent.
  useEffect(() => {
    if (!isLoggedIn || currentQueryID === null || initializedPk !== currentQueryID) return;
    if (preRestoreFiltersRef.current !== null) {
      if (activeFilters === preRestoreFiltersRef.current) return;
      preRestoreFiltersRef.current = null;
    }
    const state = toWorkingViewState(activeFilters);
    const key = serialize(state);
    if (key === lastSyncedRef.current) {
      save.cancel();
      return;
    }
    save(currentQueryID, state, key);
  }, [isLoggedIn, currentQueryID, initializedPk, activeFilters, save]);

  return { initialized: initializedPk !== null && initializedPk === currentQueryID };
};

export default useWorkingView;
