import { useReducer, useCallback, useRef, useEffect, RefObject } from 'react';
import { sortNameLowHigh, sortNameHighLow, sortEvidenceLowHigh, sortEvidenceHighLow, sortScoreLowHigh,
  sortScoreHighLow, sortByEntityStrings, sortPathsHighLow, sortPathsLowHigh, sortByNamePathfinderLowHigh,
  sortByNamePathfinderHighLow, sortScorePathfinderLowHigh, sortScorePathfinderHighLow } from "@/features/Common/utils/sortingFunctions";
import { ResultSet, Result, ScoreWeights } from '@/features/ResultList/types/results.d';

type SortColumn = 'name' | 'evidence' | 'paths' | 'score' | null;

interface SortState {
  activeColumn: SortColumn;
  direction: boolean | null;
  sortString: string;
}

type SortAction =
  | { type: 'SET_SORT'; column: SortColumn; direction: boolean | null; sortString: string }
  | { type: 'RESET'; sortString: string };

function sortReducer(state: SortState, action: SortAction): SortState {
  switch (action.type) {
    case 'SET_SORT':
      return {
        activeColumn: action.column,
        direction: action.direction,
        sortString: action.sortString,
      };
    case 'RESET':
      return {
        activeColumn: 'score',
        direction: false,
        sortString: action.sortString,
      };
    default:
      return state;
  }
}

function getSortColumnAndDirection(sortName: string): { column: SortColumn; direction: boolean | null } {
  switch (sortName) {
    case 'nameLowHigh': return { column: 'name', direction: true };
    case 'nameHighLow': return { column: 'name', direction: false };
    case 'evidenceLowHigh': return { column: 'evidence', direction: true };
    case 'evidenceHighLow': return { column: 'evidence', direction: false };
    case 'scoreLowHigh': return { column: 'score', direction: true };
    case 'scoreHighLow': return { column: 'score', direction: false };
    case 'pathsLowHigh': return { column: 'paths', direction: true };
    case 'pathsHighLow': return { column: 'paths', direction: false };
    case 'entityString': return { column: null, direction: null };
    default: return { column: null, direction: null };
  }
}

export interface UseSortStateReturn {
  isSortedByName: boolean | null;
  isSortedByEvidence: boolean | null;
  isSortedByPaths: boolean | null;
  isSortedByScore: boolean | null;
  currentSortString: RefObject<string>;
  activeEntityFiltersRef: RefObject<string[]>;
  getSortedResults: (summary: ResultSet, resultsToSort: Result[], sortName: string, isPathfinder?: boolean) => Result[];
  resetSort: (sortString: string) => void;
}

interface UseSortStateArgs {
  scoreWeights: ScoreWeights;
  initSortString: string;
}

const useSortState = ({ scoreWeights, initSortString }: UseSortStateArgs): UseSortStateReturn => {
  const [state, dispatch] = useReducer(sortReducer, {
    activeColumn: 'score',
    direction: false,
    sortString: initSortString,
  });

  const currentSortString = useRef(initSortString);
  // Keep the ref in sync with reducer state
  useEffect(() => {
    currentSortString.current = state.sortString;
  }, [state.sortString]);

  // Ref for activeEntityFilters — the parent syncs this after useResultFiltering provides the value.
  // This avoids a stale closure since useSortState is declared before useResultFiltering.
  const activeEntityFiltersRef = useRef<string[]>([]);

  const getSortedResults = useCallback((summary: ResultSet, resultsToSort: Result[], sortName: string, isPathfinderArg: boolean = false): Result[] => {
    if (!summary) {
      console.warn("No result set provided to getSortedResults");
      return resultsToSort;
    }

    let newSortedResults = [...resultsToSort];
    const { column, direction } = getSortColumnAndDirection(sortName);

    switch (sortName) {
      case 'nameLowHigh':
        newSortedResults = (isPathfinderArg) ? sortByNamePathfinderLowHigh(newSortedResults) as Result[] : sortNameLowHigh(newSortedResults) as Result[];
        break;
      case 'nameHighLow':
        newSortedResults = (isPathfinderArg) ? sortByNamePathfinderHighLow(newSortedResults) as Result[] : sortNameHighLow(newSortedResults) as Result[];
        break;
      case 'evidenceLowHigh':
        newSortedResults = sortEvidenceLowHigh(summary, newSortedResults);
        break;
      case 'evidenceHighLow':
        newSortedResults = sortEvidenceHighLow(summary, newSortedResults);
        break;
      case 'scoreLowHigh':
        newSortedResults = (isPathfinderArg) ? sortScorePathfinderLowHigh(summary, newSortedResults) : sortScoreLowHigh(newSortedResults, scoreWeights);
        break;
      case 'scoreHighLow':
        newSortedResults = (isPathfinderArg) ? sortScorePathfinderHighLow(summary, newSortedResults) : sortScoreHighLow(newSortedResults, scoreWeights);
        break;
      case 'pathsLowHigh':
        newSortedResults = sortPathsLowHigh(summary, newSortedResults);
        break;
      case 'pathsHighLow':
        newSortedResults = sortPathsHighLow(summary, newSortedResults);
        break;
      case 'entityString':
        newSortedResults = sortByEntityStrings(newSortedResults, activeEntityFiltersRef.current);
        break;
      default:
        break;
    }

    dispatch({ type: 'SET_SORT', column, direction, sortString: sortName });

    return newSortedResults;
  }, [scoreWeights]);

  const resetSort = useCallback((sortString: string) => {
    currentSortString.current = sortString;
    dispatch({ type: 'RESET', sortString });
  }, []);

  // Derive individual sort booleans from reducer state for backward compat
  const isSortedByName = state.activeColumn === 'name' ? state.direction : null;
  const isSortedByEvidence = state.activeColumn === 'evidence' ? state.direction : null;
  const isSortedByPaths = state.activeColumn === 'paths' ? state.direction : null;
  const isSortedByScore = state.activeColumn === 'score' ? state.direction : null;

  return {
    isSortedByName,
    isSortedByEvidence,
    isSortedByPaths,
    isSortedByScore,
    currentSortString,
    activeEntityFiltersRef,
    getSortedResults,
    resetSort,
  };
};

export default useSortState;
