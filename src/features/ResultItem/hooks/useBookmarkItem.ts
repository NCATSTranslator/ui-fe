import { useState, useRef, useMemo, useCallback, Dispatch, SetStateAction, RefObject } from 'react';
import { useSelector } from 'react-redux';
import { currentUser } from '@/features/UserAuth/slices/userSlice';
import { Save, SaveGroup } from '@/features/UserAuth/utils/userApi';
import { Result, ResultBookmark, ResultSet } from '@/features/ResultList/types/results';
import { QueryType } from '@/features/Query/types/querySubmission';
import { isNotesEmpty } from '@/features/ResultItem/utils/utilities';
import {
  handleBookmarkClick as handleBookmarkClickUtil,
  handleNotesClick as handleNotesClickUtil,
  BookmarkFunctionParams,
} from '@/features/ResultItem/utils/bookmarkFunctions';

export interface UseBookmarkItemParams {
  bookmarkItem: Save | null;
  result: Result | ResultBookmark;
  resultSet: ResultSet | null;
  queryNodeID: string | null;
  queryNodeLabel: string | null;
  queryNodeDescription: string | null;
  queryType: QueryType | null;
  currentQueryID: string | null;
  bookmarkAddedToast: () => void;
  bookmarkRemovedToast: () => void;
  handleBookmarkError: () => void;
  updateUserSaves?: Dispatch<SetStateAction<SaveGroup | null>>;
  shouldUpdateResultsAfterBookmark?: RefObject<boolean>;
}

export interface UseBookmarkItemReturn {
  // Derived state
  isBookmarked: boolean;
  bookmarkId: string | null;
  hasNotes: boolean;
  
  // Confirmation modal state
  confirmModalOpen: boolean;
  setConfirmModalOpen: Dispatch<SetStateAction<boolean>>;
  
  // Actions
  handleBookmarkClick: () => Promise<string | false>;
  handleNotesClick: (activateNotes: (label: string, id: string) => void, nameString: string) => Promise<void>;
  handleRemovalApproval: () => void;
  resetRemovalApproval: () => void;
}

/**
 * Hook to encapsulate individual item bookmark state and actions.
 * Use in ResultItem and UserSave components to manage bookmark functionality.
 */
export const useBookmarkItem = (params: UseBookmarkItemParams): UseBookmarkItemReturn => {
  const {
    bookmarkItem,
    result,
    resultSet,
    queryNodeID,
    queryNodeLabel,
    queryNodeDescription,
    queryType,
    currentQueryID,
    bookmarkAddedToast,
    bookmarkRemovedToast,
    handleBookmarkError,
    updateUserSaves,
    shouldUpdateResultsAfterBookmark,
  } = params;

  const user = useSelector(currentUser);

  // Derived state from bookmarkItem prop
  const isBookmarked = !!bookmarkItem;
  const bookmarkId = bookmarkItem?.id?.toString() ?? null;
  const hasNotes = !isNotesEmpty(bookmarkItem?.notes || null);

  // Confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const bookmarkRemovalApproved = useRef(false);

  // Memoized bookmark params
  const bookmarkParams: BookmarkFunctionParams = useMemo(() => ({
    result,
    resultSet: resultSet!,
    queryNodeID,
    queryNodeLabel,
    queryNodeDescription,
    queryType,
    currentQueryID,
    user: user || null,
    objectRef: result.id,
    bookmarkId,
    bookmarkRemovedToast,
    bookmarkAddedToast,
    handleBookmarkError,
    updateUserSaves,
    shouldUpdateResultsAfterBookmark,
  }), [
    result, resultSet, queryNodeID, queryNodeLabel, queryNodeDescription,
    queryType, currentQueryID, user, bookmarkId, bookmarkRemovedToast,
    bookmarkAddedToast, handleBookmarkError, updateUserSaves,
    shouldUpdateResultsAfterBookmark,
  ]);

  // Bookmark click handler
  const handleBookmarkClick = useCallback(async (): Promise<string | false> => {
    return await handleBookmarkClickUtil(
      isBookmarked,
      bookmarkRemovalApproved,
      setConfirmModalOpen,
      bookmarkParams
    );
  }, [isBookmarked, bookmarkParams]);

  // Notes click handler
  const handleNotesClick = useCallback(async (
    activateNotes: (label: string, id: string) => void,
    nameString: string
  ): Promise<void> => {
    await handleNotesClickUtil(
      isBookmarked,
      bookmarkId,
      nameString,
      activateNotes,
      handleBookmarkClick
    );
  }, [isBookmarked, bookmarkId, handleBookmarkClick]);

  // Removal approval handler
  const handleRemovalApproval = useCallback(() => {
    bookmarkRemovalApproved.current = true;
    handleBookmarkClick();
  }, [handleBookmarkClick]);

  // Reset removal approval (used when modal is closed without approving)
  const resetRemovalApproval = useCallback(() => {
    bookmarkRemovalApproved.current = false;
  }, []);

  return {
    isBookmarked,
    bookmarkId,
    hasNotes,
    confirmModalOpen,
    setConfirmModalOpen,
    handleBookmarkClick,
    handleNotesClick,
    handleRemovalApproval,
    resetRemovalApproval,
  };
};
