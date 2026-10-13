import { useState, useRef, useCallback, useEffect, Dispatch, SetStateAction, RefObject } from 'react';
import { getSaves, SaveGroup } from '@/features/UserAuth/utils/userApi';
import { ResultSet } from '@/features/ResultList/types/results.d';
import { HandleUpdateResultsFn } from '@/features/ResultList/hooks/useResultFiltering';
import { User } from '@/features/UserAuth/types/user';
import { afterNextPaint } from '@/features/Core/utils/domHelpers';

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
  prevRawResults: RefObject<ResultSet | null>;
  handleUpdateResultsRef: RefObject<HandleUpdateResultsFn | null>;
}

const useUserBookmarks = ({
  user,
  currentQueryID,
  prevRawResults,
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

  // Update results after bookmark to reflect new user saves in bookmark/note filter.
  // Rebuild from prevRawResults (the pristine prepared set) rather than rawResults,
  // whose injected bookmark/note tags would otherwise linger after a bookmark is removed.
  // Re-filtering walks the whole result set, and React flushes click-triggered
  // effects before paint, so wait a frame to let the optimistic icon change show first.
  // userSaves is the trigger; the handler reads the latest saves from ResultList's ref.
  useEffect(() => {
    if (!shouldUpdateResultsAfterBookmark.current)
      return;

    shouldUpdateResultsAfterBookmark.current = false;
    afterNextPaint().then(() => {
      handleUpdateResultsRef.current?.({ mode: 'rebuild', summary: prevRawResults.current });
    });
  }, [userSaves, prevRawResults, handleUpdateResultsRef]);

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
