import { useState, useCallback, Dispatch, SetStateAction, RefObject } from 'react';
import { filterCompare } from '@/features/Core/utils/sortingFunctions';
import { isEntityFilter, isSameFilterValue } from '@/features/ResultFiltering/utils/filterFunctions';
import { Result, ResultSet, PathFilterState } from '@/features/ResultList/types/results.d';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { SaveGroup } from '@/features/UserAuth/utils/userApi';
import { trackEvent } from '@/features/Analytics/utils/dataLayer';

export type HandleUpdateResultsFn = (
  filters: Filter[],
  asFilters: string[],
  summary: ResultSet | null,
  or: Result[] | undefined,
  justSort: boolean | undefined,
  sortType: string,
  isPathfinder?: boolean,
  userSavesGroup?: SaveGroup | null,
  pfState?: PathFilterState | null,
) => Result[];

export interface UseResultFilteringReturn {
  activeFilters: Filter[];
  setActiveFilters: Dispatch<SetStateAction<Filter[]>>;
  availableFilters: { [key: string]: Filter };
  setAvailableFilters: Dispatch<SetStateAction<{ [key: string]: Filter }>>;
  activeEntityFilters: string[];
  setActiveEntityFilters: Dispatch<SetStateAction<string[]>>;
  pathFilterState: PathFilterState | null;
  setPathFilterState: Dispatch<SetStateAction<PathFilterState | null>>;
  handleFilter: (filter: Filter) => void;
  handleSetFilters: (filters: Filter[]) => void;
  handleClearAllFilters: () => void;
  resetFilters: () => void;
}

interface UseResultFilteringArgs {
  handlePageReset: (newItemsPerPage: number | false, resultsLength: number) => void;
  rawResults: RefObject<ResultSet | null>;
  originalResults: RefObject<Result[]>;
  currentSortString: RefObject<string>;
  isPathfinder: boolean;
  userSavesRef: RefObject<SaveGroup | null>;
  handleUpdateResultsRef: RefObject<HandleUpdateResultsFn | null>;
}

const useResultFiltering = ({
  handlePageReset,
  rawResults,
  originalResults,
  currentSortString,
  isPathfinder,
  userSavesRef,
  handleUpdateResultsRef,
}: UseResultFilteringArgs): UseResultFilteringReturn => {
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [availableFilters, setAvailableFilters] = useState<{ [key: string]: Filter }>({});
  const [activeEntityFilters, setActiveEntityFilters] = useState<string[]>([]);
  const [pathFilterState, setPathFilterState] = useState<PathFilterState | null>(null);

  const handleApplyFilterAndCleanup = useCallback((
    filtersToActivate: Filter[],
    entityFilters: string[],
    rawResultsVal: ResultSet | null,
    originalResultsVal: Result[],
    sortString: string,
    isPathfinderVal: boolean = false,
    userSavesVal: SaveGroup | null = null,
  ) => {
    if (!rawResultsVal || !handleUpdateResultsRef.current)
      return;

    setActiveFilters(filtersToActivate);
    let newFormattedResults = handleUpdateResultsRef.current(filtersToActivate, entityFilters, rawResultsVal, originalResultsVal, false, sortString, isPathfinderVal, userSavesVal);
    handlePageReset(false, newFormattedResults.length);
  }, [handlePageReset]);

  const handleFilter = useCallback((filter: Filter) => {
    // Try to find a filter with same {id, value, negated} — for toggle-off
    const exactMatchIndex = activeFilters.findIndex(
      (f) =>
        f.id === filter.id &&
        isSameFilterValue(f.value, filter.value) &&
        f.negated === filter.negated
    );

    if (exactMatchIndex !== -1) {
      // Exact match found → toggle off by removing it
      const updatedFilters = activeFilters.filter((_, i) => i !== exactMatchIndex);
      trackEvent('filter_cleared', {
        filter_type: filter.id ?? filter.name,
        filter_count: updatedFilters.length,
      });
      handleApplyFilterAndCleanup(
        updatedFilters,
        activeEntityFilters,
        rawResults.current,
        originalResults.current,
        currentSortString.current,
        isPathfinder,
        userSavesRef.current
      );
      return;
    }

    // Try to find a filter with same {id, value} but different negated — for update
    const sameIdValueIndex = activeFilters.findIndex(
      (f) =>
        f.id === filter.id &&
        isSameFilterValue(f.value, filter.value) &&
        f.negated !== filter.negated
    );

    let updatedFilters: Filter[];
    if (sameIdValueIndex !== -1) {
      // Replace old filter with new one (different negated)
      updatedFilters = activeFilters.map((f, i) =>
        i === sameIdValueIndex ? { ...filter } : f
      );
    } else {
      // Add new filter
      updatedFilters = [...activeFilters, { ...filter }];
    }

    updatedFilters.sort(filterCompare);

    trackEvent('filter_applied', {
      filter_type: filter.id ?? filter.name,
      // Facet values are labels and CURIEs, bounded enough to report on. A string
      // filter's value is whatever the user typed, so only its use is recorded.
      filter_value: isEntityFilter(filter) ? 'string filter' : filter.value,
      filter_count: updatedFilters.length,
    });
    handleApplyFilterAndCleanup(
      updatedFilters,
      activeEntityFilters,
      rawResults.current,
      originalResults.current,
      currentSortString.current,
      isPathfinder,
      userSavesRef.current
    );
  }, [activeFilters, handleApplyFilterAndCleanup, activeEntityFilters, rawResults, originalResults, currentSortString, isPathfinder, userSavesRef]);

  const handleSetFilters = useCallback((filters: Filter[]) => {
    handleApplyFilterAndCleanup(
      filters,
      activeEntityFilters,
      rawResults.current,
      originalResults.current,
      currentSortString.current,
      isPathfinder,
      userSavesRef.current
    );
  }, [handleApplyFilterAndCleanup, activeEntityFilters, rawResults, originalResults, currentSortString, isPathfinder, userSavesRef]);

  const handleClearAllFilters = useCallback(() => {
    trackEvent('filter_cleared', { filter_type: 'all', filter_count: 0 });
    handleApplyFilterAndCleanup([], activeEntityFilters, rawResults.current, originalResults.current, currentSortString.current, isPathfinder, userSavesRef.current);
  }, [handleApplyFilterAndCleanup, activeEntityFilters, rawResults, originalResults, currentSortString, isPathfinder, userSavesRef]);

  const resetFilters = useCallback(() => {
    setActiveFilters([]);
    setActiveEntityFilters([]);
    setAvailableFilters({});
    setPathFilterState(null);
  }, []);

  return {
    activeFilters,
    setActiveFilters,
    availableFilters,
    setAvailableFilters,
    activeEntityFilters,
    setActiveEntityFilters,
    pathFilterState,
    setPathFilterState,
    handleFilter,
    handleSetFilters,
    handleClearAllFilters,
    resetFilters,
  };
};

export default useResultFiltering;
