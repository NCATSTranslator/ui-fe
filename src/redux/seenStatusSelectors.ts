import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './store';

export const selectSeenEdgesByPk = (pk: string) =>
  (state: RootState) => state.seenStatus[pk]?.seenEdges || [];

/**
 * Creates a memoized selector to check if all edges in a path are seen.
 *
 * @param {string} pk - The primary key of the result set.
 * @param {string[]} edgeIds - An array of edge IDs that make up the path.
 * @returns {boolean} - True if all edge IDs are marked as seen.
 */
export const createIsPathSeenSelector = (pk: string, edgeIds: string[]) => {
  return createSelector([selectSeenEdgesByPk(pk)], (seenEdges) => {
    const seenSet = new Set(seenEdges);
    return edgeIds.every((id) => seenSet.has(id));
  });
}
