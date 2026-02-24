import { useState, useRef, useCallback, useEffect, Dispatch, SetStateAction, RefObject } from 'react';
import { cloneDeep } from 'lodash';
import { getSaves, SaveGroup } from '@/features/UserAuth/utils/userApi';
import { ResultSet } from '@/features/ResultList/types/results.d';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { HandleUpdateResultsFn } from '@/features/ResultList/hooks/useResultFiltering';
import { User } from '@/features/UserAuth/types/user';

export interface UseUserBookmarksReturn {
  userSaves: SaveGroup | null;
  setUserSaves: Dispatch<SetStateAction<SaveGroup | null>>;
  showHiddenPaths: boolean;
  setShowHiddenPaths: Dispatch<SetStateAction<boolean>>;
  shouldUpdateResultsAfterBookmark: RefObject<boolean>;
  resetBookmarks: () => void;
}

interface UseUserBookmarksArgs {
  user: User | null;
  currentQueryID: string | null;
  activeFilters: Filter[];
  activeEntityFilters: string[];
  prevRawResults: RefObject<ResultSet | null>;
  currentSortString: RefObject<string>;
  isPathfinder: boolean;
  handleUpdateResultsRef: RefObject<HandleUpdateResultsFn | null>;
}

const useUserBookmarks = ({
  user,
  currentQueryID,
  activeFilters,
  activeEntityFilters,
  prevRawResults,
  currentSortString,
  isPathfinder,
  handleUpdateResultsRef,
}: UseUserBookmarksArgs): UseUserBookmarksReturn => {
  const [userSaves, setUserSaves] = useState<SaveGroup | null>(null);
  const [showHiddenPaths, setShowHiddenPaths] = useState(false);
  const shouldUpdateResultsAfterBookmark = useRef(false);

  const getUserSaves = useCallback(async () => {
    let temp = await getSaves();
    for (const queryID of Object.keys(temp)) {
      if (queryID === currentQueryID) {
        setUserSaves(temp[queryID]);
      }
    }
  }, [currentQueryID]);

  useEffect(() => {
    if (!user)
      return;

    getUserSaves();
  }, [user, getUserSaves]);

  // Keep refs for values needed in the bookmark update effect to avoid over-firing
  const activeFiltersRef = useRef(activeFilters);
  activeFiltersRef.current = activeFilters;
  const activeEntityFiltersRef = useRef(activeEntityFilters);
  activeEntityFiltersRef.current = activeEntityFilters;
  const isPathfinderRef = useRef(isPathfinder);
  isPathfinderRef.current = isPathfinder;

  // Update results after bookmark to reflect new user saves in bookmark/note filter
  useEffect(() => {
    if (!shouldUpdateResultsAfterBookmark.current)
      return;

    shouldUpdateResultsAfterBookmark.current = false;
    const tempUserSaves = cloneDeep(userSaves);
    handleUpdateResultsRef.current?.(activeFiltersRef.current, activeEntityFiltersRef.current, prevRawResults.current, [], false, currentSortString.current, isPathfinderRef.current, tempUserSaves);
  }, [userSaves]);

  const resetBookmarks = useCallback(() => {
    setUserSaves(null);
    setShowHiddenPaths(false);
  }, []);

  return {
    userSaves,
    setUserSaves,
    showHiddenPaths,
    setShowHiddenPaths,
    shouldUpdateResultsAfterBookmark,
    resetBookmarks,
  };
};

export default useUserBookmarks;
