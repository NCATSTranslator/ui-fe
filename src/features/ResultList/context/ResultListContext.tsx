import { createContext, useContext, FC, ReactNode, RefObject, Dispatch, SetStateAction } from 'react';
import { Result, Path, PathFilterState, ScoreWeights } from '@/features/ResultList/types/results.d';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { SaveGroup } from '@/features/UserAuth/utils/userApi';
import { QueryType } from '@/features/Query/types/querySubmission';

export interface ResultListContextValue {
  activateEvidence: (item: Result, edgeIDs: string[], path: Path, pathKey: string) => void;
  activateNotes: (label: string, bookmarkId: string) => void;
  activeEntityFilters: string[];
  activeFilters: Filter[];
  availableFilters: { [key: string]: Filter };
  handleFilter: (filter: Filter) => void;
  bookmarkAddedToast: () => void;
  bookmarkRemovedToast: () => void;
  handleBookmarkError: () => void;
  isPathfinder: boolean;
  pathFilterState: PathFilterState | null;
  pk: string | null;
  queryNodeID: string | null;
  queryNodeLabel: string | null;
  queryNodeDescription: string | null;
  queryType: QueryType | null;
  resultsComplete: boolean;
  scoreWeights: ScoreWeights;
  setExpandSharedResult: (state: boolean) => void;
  setShareModalOpen: Dispatch<SetStateAction<boolean>>;
  setShareResultID: (state: string | null) => void;
  showHiddenPaths: boolean;
  setShowHiddenPaths: Dispatch<SetStateAction<boolean>>;
  shouldUpdateResultsAfterBookmark: RefObject<boolean>;
  updateUserSaves: Dispatch<SetStateAction<SaveGroup | null>>;
  zoomKeyDown: boolean;
}

const ResultListContext = createContext<ResultListContextValue | null>(null);

export const useResultListContext = (): ResultListContextValue => {
  const ctx = useContext(ResultListContext);
  if (!ctx) throw new Error('useResultListContext must be used within a ResultListProvider');
  return ctx;
};

interface ResultListProviderProps {
  children: ReactNode;
  value: ResultListContextValue;
}

export const ResultListProvider: FC<ResultListProviderProps> = ({ children, value }) => (
  <ResultListContext.Provider value={value}>
    {children}
  </ResultListContext.Provider>
);

export default ResultListContext;
