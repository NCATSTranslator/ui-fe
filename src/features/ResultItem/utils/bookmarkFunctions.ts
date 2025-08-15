import { RefObject, Dispatch, SetStateAction } from 'react';
import { cloneDeep } from 'lodash';
import { createUserSave, deleteUserSave, generateSafeResultSet, getFormattedBookmarkObject, Save, SaveGroup } from '@/features/UserAuth/utils/userApi';
import { Result, ResultBookmark, ResultSet } from '@/features/ResultList/types/results';
import { QueryType } from '@/features/Query/types/querySubmission';
import type { User } from '@/features/UserAuth/types/user.d.ts';

export interface BookmarkFunctionParams {
  result: Result | ResultBookmark;
  resultSet: ResultSet;
  queryNodeID: string | null;
  queryNodeLabel: string | null;
  queryNodeDescription: string | null;
  queryType: QueryType | null;
  currentQueryID: string | null;
  user: User | null;
  itemBookmarkID: RefObject<string | null>;
  setIsBookmarked: Dispatch<SetStateAction<boolean>>;
  setItemHasNotes: Dispatch<SetStateAction<boolean>>;
  bookmarkRemovedToast: () => void;
  bookmarkAddedToast: () => void;
  handleBookmarkError: () => void;
  updateUserSaves?: Dispatch<SetStateAction<SaveGroup | null>>;
  shouldUpdateResultsAfterBookmark?: RefObject<boolean>;
}

/**
 * Updates the user saves state by adding or removing a bookmark
 */
export const updateUserSavesState = (
  saveOperation: 'add' | 'remove' | 'updateNote',
  updateUserSaves: Dispatch<SetStateAction<SaveGroup | null>> | undefined,
  itemBookmarkID: RefObject<string | null>,
  saveItem?: Save
) => {
  updateUserSaves?.((prev) => {
    if (!prev) {
      console.warn("No user saves found, unable to update userSaves");
      return null;
    }
    
    const updatedSaves = cloneDeep(prev.saves);
    
    if (saveOperation === 'add' && saveItem) {
      updatedSaves.add(saveItem);
    } else if (saveOperation === 'remove') {
      const saveToDelete = Array.from(updatedSaves).find(
        (save) => save.id?.toString() === itemBookmarkID.current
      );
      if (!saveToDelete) {
        console.warn("No save found to delete, unable to update userSaves");
        return null;
      }
      updatedSaves.delete(saveToDelete);
    } else if (saveOperation === 'updateNote' && saveItem) {
      for(const save of updatedSaves) {
        if(save.id?.toString() === itemBookmarkID.current) {
          save.notes = saveItem.notes;
          break;
        }
      }
    }
    
    return { ...prev, saves: updatedSaves };
  });
};

/**
 * Creates a formatted bookmark object with all necessary data
 */
export const createBookmarkObject = (params: {
  result: Result | ResultBookmark;
  resultSet: ResultSet;
  queryNodeID: string | null;
  queryNodeLabel: string | null;
  queryNodeDescription: string | null;
  queryType: QueryType | null;
  currentQueryID: string | null;
  user: User | null;
}) => {
  const {
    result,
    resultSet,
    queryNodeID,
    queryNodeLabel,
    queryNodeDescription,
    queryType,
    currentQueryID,
    user
  } = params;

  const bookmarkResult: ResultBookmark = cloneDeep(result);
  const safeResultSet: ResultSet = generateSafeResultSet(resultSet, bookmarkResult);
  
  const bookmarkObject = getFormattedBookmarkObject(
    "result",
    bookmarkResult.drug_name,
    "",
    queryNodeID || "",
    queryNodeLabel || "",
    queryNodeDescription || "",
    queryType,
    result,
    currentQueryID || "",
    safeResultSet
  );
  
  bookmarkObject.user_id = user?.id || null;
  const currentDate = new Date().toDateString();
  bookmarkObject.time_created = currentDate;
  bookmarkObject.time_updated = currentDate;
  
  return bookmarkObject;
};

/**
 * Handles the removal of a bookmark
 */
export const handleBookmarkRemoval = async (params: BookmarkFunctionParams): Promise<string | false> => {
  const {
    itemBookmarkID,
    setIsBookmarked,
    setItemHasNotes,
    bookmarkRemovedToast,
    updateUserSaves,
    shouldUpdateResultsAfterBookmark
  } = params;

  if (!itemBookmarkID.current) return false;
  
  const deleted = await deleteUserSave(itemBookmarkID.current);
  if (!deleted) {
    console.warn("Unable to delete bookmark, unable to update userSaves");
    return false;
  }
  
  setIsBookmarked(false);
  setItemHasNotes(false);
  bookmarkRemovedToast();
  updateUserSavesState('remove', updateUserSaves, itemBookmarkID);
  itemBookmarkID.current = null;
  
  if (shouldUpdateResultsAfterBookmark)
    shouldUpdateResultsAfterBookmark.current = true;
  
  return false; // Bookmark removal doesn't return an ID
};

/**
 * Handles the creation of a new bookmark
 */
export const handleBookmarkCreation = async (params: BookmarkFunctionParams): Promise<string | false> => {
  const {
    result,
    resultSet,
    queryNodeID,
    queryNodeLabel,
    queryNodeDescription,
    queryType,
    currentQueryID,
    user,
    itemBookmarkID,
    setIsBookmarked,
    bookmarkAddedToast,
    handleBookmarkError,
    updateUserSaves,
    shouldUpdateResultsAfterBookmark
  } = params;

  if (!resultSet) {
    console.warn("Unable to create bookmark, no resultSet available");
    return false;
  }
  
  const bookmarkObject = createBookmarkObject({
    result,
    resultSet,
    queryNodeID,
    queryNodeLabel,
    queryNodeDescription,
    queryType,
    currentQueryID,
    user
  });

  const bookmarkedItem = await createUserSave(bookmarkObject, handleBookmarkError, handleBookmarkError);
  
  if (!bookmarkedItem) return false;
  
  const newBookmarkedItem = bookmarkedItem as unknown as Save;
  setIsBookmarked(true);
  itemBookmarkID.current = newBookmarkedItem.id?.toString() || null;
  bookmarkAddedToast();
  updateUserSavesState('add', updateUserSaves, itemBookmarkID, newBookmarkedItem);
  
  if (shouldUpdateResultsAfterBookmark)
    shouldUpdateResultsAfterBookmark.current = true;
  
  return newBookmarkedItem.id?.toString() || false;
};

/**
 * Main bookmark click handler that decides whether to add or remove a bookmark
 */
export const handleBookmarkClick = async (
  isBookmarked: boolean,
  bookmarkRemovalApproved: RefObject<boolean>,
  setBookmarkRemovalConfirmationModalOpen: Dispatch<SetStateAction<boolean>>,
  params: BookmarkFunctionParams
): Promise<string | false> => {
  if (isBookmarked) {
    if (bookmarkRemovalApproved.current && params.itemBookmarkID.current) {
      return await handleBookmarkRemoval(params);
    } else if (!bookmarkRemovalApproved.current) {
      setBookmarkRemovalConfirmationModalOpen(true);
    }
    return false;
  }
  
  return await handleBookmarkCreation(params);
};

/**
 * Handles notes click by creating a bookmark if needed and activating notes
 */
export const handleNotesClick = async (
  isBookmarked: boolean,
  itemBookmarkID: RefObject<string | null>,
  nameString: string,
  activateNotes: (nameString: string, id: string) => void,
  setItemHasNotes: Dispatch<SetStateAction<boolean>>,
  handleBookmarkClickFn: () => Promise<string | false>
): Promise<void> => {
  let tempBookmarkID: string | null = itemBookmarkID.current;
  
  if (!isBookmarked) {
    console.log("no bookmark exists for this item, creating one...");
    const replacementID = await handleBookmarkClickFn();
    console.log("new id: ", replacementID);
    tempBookmarkID = replacementID ? replacementID.toString() : tempBookmarkID;
  }
  
  if (tempBookmarkID) {
    activateNotes(nameString, tempBookmarkID);
    setItemHasNotes(true);
  }
};
