import cloneDeep from 'lodash/cloneDeep';
import { Result, ResultSet, PathFilterState } from '@/features/ResultList/types/results.d';
import { Filter, Filters } from '@/features/ResultFiltering/types/filters';
import { SaveGroup } from '@/features/UserAuth/utils/userApi';
import { ResultsUpdate } from '@/features/ResultList/hooks/useResultFiltering';
import { applyFilters, injectDynamicFilters, genPathFilterState, calculateFacetCounts } from '@/features/ResultList/utils/resultsInteractionFunctions';

export type SortResultsFn = (summary: ResultSet, results: Result[], sortType: string, isPathfinder: boolean) => Result[];

export interface ResultsUpdateInputs {
  update: ResultsUpdate;
  /** The result set currently held by the list; the source for refilter and sort. */
  rawResults: ResultSet | null;
  /** The canonical, unfiltered list; empty until the first rebuild. */
  originalResults: Result[];
  activeFilters: Filter[];
  sortType: string;
  isPathfinder: boolean;
  userSaves: SaveGroup | null;
  pathFilterState: PathFilterState | null;
  /** IDs of the results currently shown; a sort re-orders only these. */
  visibleResultIds: Set<string>;
  sortResults: SortResultsFn;
}

/** Produced only when filters were (re)applied. */
export interface ResultsFilteringOutput {
  /** The canonical list after bookmark/note tags were injected. */
  originalResults: Result[];
  /** Entity (string-search) filters as applyFilters normalised them. */
  entityFilters: string[];
  availableFilters: Filters;
  shouldResetPage: boolean;
}

export interface ResultsUpdateOutput {
  /** The summary with bookmark/note tags injected; becomes the list's rawResults. */
  summary: ResultSet;
  formattedResults: Result[];
  pathFilterState: PathFilterState;
  filtering?: ResultsFilteringOutput;
}

interface StartingState {
  summary: ResultSet;
  formatted: Result[];
  original: Result[];
  pathFilterState: PathFilterState;
}

/**
 * Picks the result set and canonical list an update starts from, then injects
 * bookmark/note tags. An empty canonical list means the state was never
 * populated, so the update starts over from the set regardless of mode.
 */
const resolveStartingState = (
  { update, originalResults, userSaves, pathFilterState }: ResultsUpdateInputs,
  source: ResultSet,
): StartingState => {
  const canonical = update.mode === 'rebuild' ? [] : originalResults;
  // Only a sort carries path filter state forward; filtering regenerates it.
  const carried = update.mode === 'sort' && pathFilterState ? cloneDeep(pathFilterState) : {};
  const fresh = canonical.length === 0;
  const formatted = fresh ? source.data.results : canonical;
  const original = fresh ? cloneDeep(formatted) : canonical;
  const [summary, taggedFormatted, taggedOriginal] = injectDynamicFilters(source, formatted, original, userSaves);
  return {
    summary,
    formatted: taggedFormatted,
    original: taggedOriginal,
    pathFilterState: fresh ? genPathFilterState(summary) : carried,
  };
};

/**
 * The pure core of a result-list update: resolves the starting state, then
 * filters and sorts (rebuild/refilter) or re-orders the visible results (sort).
 * Returns null when there is no result set to work from.
 */
export const computeResultsUpdate = (inputs: ResultsUpdateInputs): ResultsUpdateOutput | null => {
  const { update, rawResults, activeFilters, sortType, isPathfinder, visibleResultIds, sortResults } = inputs;
  const source = update.mode === 'rebuild' ? update.summary : rawResults;
  if (!source) return null;

  const { summary, formatted, original, pathFilterState } = resolveStartingState(inputs, source);

  if (update.mode === 'sort') {
    // Sort the canonical list, then keep what is currently visible (avoids re-running applyFilters)
    const sortedOriginal = sortResults(summary, original, sortType, isPathfinder);
    return {
      summary,
      formattedResults: sortedOriginal.filter(r => visibleResultIds.has(r.id)),
      pathFilterState,
    };
  }

  const filters = update.mode === 'refilter' ? update.filters : activeFilters;
  const { results, updatedEntityFilters, updatedPathFilterState, facetCounts, shouldResetPage } =
    applyFilters(filters, formatted, original, summary, pathFilterState);
  const availableFilters = calculateFacetCounts(
    facetCounts.results,
    summary,
    facetCounts.negatedResults,
    facetCounts.resultFacets,
    facetCounts.negatedResultFacets,
  );

  return {
    summary,
    formattedResults: sortResults(summary, results, sortType, isPathfinder),
    pathFilterState: updatedPathFilterState,
    filtering: {
      originalResults: original,
      entityFilters: updatedEntityFilters,
      availableFilters,
      shouldResetPage,
    },
  };
};
