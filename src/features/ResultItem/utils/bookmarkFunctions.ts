import { RefObject, Dispatch, SetStateAction } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { createUserSave, deleteUserSave, generateSafeResultSet, getFormattedBookmarkObject, Save, SaveGroup } from '@/features/UserAuth/utils/userApi';
import { Result, ResultBookmark, ResultSet } from '@/features/ResultList/types/results';
import { QueryType } from '@/features/Query/types/querySubmission';
import type { User } from '@/features/UserAuth/types/user.d.ts';
import { isNotesEmpty } from '@/features/ResultItem/utils/utilities';
import { afterNextPaint } from '@/features/Core/utils/domHelpers';

export interface BookmarkFunctionParams {
  result: Result | ResultBookmark;
  resultSet: ResultSet | null;
  queryNodeID: string | null;
  queryNodeLabel: string | null;
  queryNodeDescription: string | null;
  queryType: QueryType | null;
  currentQueryID: string | null;
  user: User | null;
  objectRef: string;
  bookmarkId: string | null;
  /** The existing save, kept so a failed removal can put it back. */
  bookmarkItem: Save | null;
  handleBookmarkError: (operation: BookmarkOperation) => void;
  updateUserSaves?: Dispatch<SetStateAction<SaveGroup | null>>;
  shouldUpdateResultsAfterBookmark?: RefObject<boolean>;
}

export type BookmarkOperation = 'add' | 'remove';

/**
 * Lets the API wrappers' own failure throw reach our try/catch instead of the
 * default handlers, which log a "no handler provided" line first.
 */
const rethrow = (error: Error): void => { throw error; };

/**
 * Updates the user saves state by adding or removing a bookmark.
 * Uses Map operations for O(1) lookups by objectRef (result ID).
 */
export const updateUserSavesState = (
  saveOperation: 'add' | 'remove' | 'updateNote',
  updateUserSaves: Dispatch<SetStateAction<SaveGroup | null>> | undefined,
  objectRef: string,
  saveItem?: Save
) => {
  updateUserSaves?.((prev) => {
    // Handle case where no saves exist yet (first bookmark for this query)
    if (!prev) {
      if (saveOperation === 'add' && saveItem) {
        // Create a new SaveGroup with the first bookmark
        const newSaves = new Map<string, Save>();
        newSaves.set(saveItem.object_ref, saveItem);
        return {
          saves: newSaves,
          query: saveItem.data.query,
        };
      }
      // Can't remove or update notes if no saves exist
      console.warn("No user saves found, unable to update userSaves");
      return prev;
    }

    const updatedSaves = new Map(prev.saves);

    if (saveOperation === 'add' && saveItem) {
      updatedSaves.set(saveItem.object_ref, saveItem);
    } else if (saveOperation === 'remove') {
      if (!updatedSaves.has(objectRef)) {
        console.warn("No save found to delete, unable to update userSaves");
        return prev;
      }
      updatedSaves.delete(objectRef);
    } else if (saveOperation === 'updateNote' && saveItem) {
      const existing = updatedSaves.get(objectRef);
      if (existing) {
        updatedSaves.set(objectRef, { ...existing, notes: saveItem.notes });
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
  
  const bookmarkObject = getFormattedBookmarkObject({
    bookmarkType: "result",
    bookmarkName: bookmarkResult.drug_name,
    notes: "",
    queryNodeID: queryNodeID || "",
    queryNodeLabel: queryNodeLabel || "",
    queryNodeDescription: queryNodeDescription || "",
    typeObject: queryType,
    saveItem: result,
    pk: currentQueryID || "",
    resultSet: safeResultSet
  });
  
  bookmarkObject.user_id = user?.id || null;
  const currentDate = new Date().toDateString();
  bookmarkObject.time_created = currentDate;
  bookmarkObject.time_updated = currentDate;
  
  return bookmarkObject;
};

/**
 * Writes to the saves Map and flags the result list to re-run its bookmark/notes
 * filters against the new saves. Every optimistic write and every revert goes
 * through here so the filters always track what the icons show.
 */
const applySavesUpdate = (
  params: BookmarkFunctionParams,
  saveOperation: 'add' | 'remove',
  saveItem?: Save
) => {
  if (params.shouldUpdateResultsAfterBookmark)
    params.shouldUpdateResultsAfterBookmark.current = true;
  updateUserSavesState(saveOperation, params.updateUserSaves, params.objectRef, saveItem);
};

/**
 * A pending save that is cheap to put into state and cheap for `useUserBookmarks`
 * to deep-clone. The real save carries a trimmed copy of the result set (paths,
 * nodes, edges, publications), which is too slow to build or clone before the
 * icon has had a chance to paint, so the placeholder holds an empty one.
 */
const createPlaceholderSave = (params: BookmarkFunctionParams, resultSet: ResultSet): Save => ({
  id: null,
  label: params.result.drug_name,
  user_id: params.user?.id || null,
  save_type: 'bookmark',
  notes: '',
  ars_pkey: params.currentQueryID || '',
  object_ref: params.objectRef,
  time_created: null,
  time_updated: null,
  data: {
    type: 'result',
    item: params.result,
    query: {
      type: params.queryType,
      nodeId: params.queryNodeID || '',
      nodeLabel: params.queryNodeLabel || '',
      nodeDescription: params.queryNodeDescription || '',
      pk: params.currentQueryID || '',
      submitted_time: new Date().toString(),
      resultSet: {
        status: resultSet.status,
        data: {
          edges: {}, errors: resultSet.data.errors, meta: resultSet.data.meta, nodes: {}, paths: {},
          provenance: {}, publications: {}, results: [], tags: {}, trials: {},
        },
      },
    },
  },
});

/**
 * Handles the removal of a bookmark. The save is dropped from state before the
 * request is sent so the icon empties immediately; it is restored if the delete fails.
 */
export const handleBookmarkRemoval = async (params: BookmarkFunctionParams): Promise<string | false> => {
  const { bookmarkId, bookmarkItem, handleBookmarkError } = params;

  if (!bookmarkId || !bookmarkItem) return false;

  applySavesUpdate(params, 'remove');

  try {
    await deleteUserSave(bookmarkId, rethrow, rethrow);
  } catch (error) {
    console.warn("Unable to delete bookmark, restoring it", error);
    applySavesUpdate(params, 'add', bookmarkItem);
    handleBookmarkError('remove');
    return false;
  }

  // The removed bookmark's ID, so callers can tell a completed removal from one
  // that failed or is still waiting on the confirmation modal.
  return bookmarkId;
};

/**
 * Handles the creation of a new bookmark. A placeholder save with no ID is put
 * into state before the request is sent so the icon fills immediately; it is
 * swapped for the server's save on success and removed on failure.
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
    handleBookmarkError,
  } = params;

  if (!resultSet) {
    console.warn("Unable to create bookmark, no resultSet available");
    return false;
  }

  // A null ID marks the save as pending: the icon shows it, but it can't be
  // removed or have notes opened against it until the server assigns an ID.
  applySavesUpdate(params, 'add', createPlaceholderSave(params, resultSet));

  // Building the full save payload walks every path for the result; let the
  // filled icon reach the screen first.
  await afterNextPaint();

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

  let newBookmarkedItem: Save;
  try {
    newBookmarkedItem = await createUserSave(bookmarkObject, rethrow, rethrow) as unknown as Save;
  } catch (error) {
    console.warn("Unable to create bookmark, removing placeholder", error);
    applySavesUpdate(params, 'remove');
    handleBookmarkError('add');
    return false;
  }

  applySavesUpdate(params, 'add', newBookmarkedItem);

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
    // A bookmarked item with no ID is a save still in flight; swallow the click
    // rather than offering to remove something the server hasn't created yet.
    if (!params.bookmarkId) return false;

    if (bookmarkRemovalApproved.current) {
      return await handleBookmarkRemoval(params);
    }
    setBookmarkRemovalConfirmationModalOpen(true);
    return false;
  }
  
  return await handleBookmarkCreation(params);
};

/**
 * Handles notes click by creating a bookmark if needed and activating notes
 */
export const handleNotesClick = async (
  isBookmarked: boolean,
  bookmarkId: string | null,
  nameString: string,
  activateNotes: (nameString: string, id: string) => void,
  handleBookmarkClickFn: () => Promise<string | false>
): Promise<void> => {
  let tempBookmarkID: string | null = bookmarkId;
  
  if (!isBookmarked) {
    console.log("no bookmark exists for this item, creating one...");
    const replacementID = await handleBookmarkClickFn();
    tempBookmarkID = replacementID ? replacementID.toString() : tempBookmarkID;
    console.log("replacementID: ", tempBookmarkID, replacementID);
  }
  
  if (tempBookmarkID)
    activateNotes(nameString, tempBookmarkID);
};

/**
 * Checks if the given bookmarkID exists in the bookmarks set and if it has notes attached.
 *
 * Note: This function uses O(n) iteration since the Map is keyed by object_ref (result ID),
 * not by bookmark ID. When possible, prefer using the Map directly with object_ref for O(1) lookup.
 *
 * @param {string | null} bookmarkID - The ID of the bookmark to check.
 * @param {SaveGroup | null} bookmarkSet - The set of bookmark objects to search in.
 * @returns {boolean} Returns true if the matching item is found in bookmarksSet and has notes, otherwise returns false.
 */
export const checkBookmarkIDForNotes = (bookmarkID: string | null, bookmarkSet: SaveGroup | null): boolean => {
  if (bookmarkID === null)
    return false;

  if (bookmarkSet && bookmarkSet.saves.size > 0) {
    for (const save of bookmarkSet.saves.values()) {
      if (String(save.id) === bookmarkID)
        return !isNotesEmpty(save.notes);
    }
  }
  return false;
}

/**
 * Checks if the given itemID exists in the bookmarks set and returns its bookmark ID if found.
 * Uses O(1) Map lookup by itemID (object_ref).
 *
 * @param {string} itemID - The ID of the item to check.
 * @param {SaveGroup} bookmarksSet - The Map of bookmark objects to search in.
 * @returns {string|null} Returns the bookmark ID of the matching item if found, otherwise returns null.
 */
export const checkBookmarksForItem = (itemID: string, bookmarksSet: SaveGroup): string | null => {
  const save = bookmarksSet.saves.get(itemID);
  if (!save) return null;
  return save.id !== null ? save.id.toString() : null;
}
