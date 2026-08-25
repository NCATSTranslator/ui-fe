import { createSelector } from '@reduxjs/toolkit';
import { EMPTY_STRING_ARRAY } from '@/features/Core/utils/constants';
import type { RootState } from './store';

/**
 * Returns the seen edge ids for a query. The shared empty fallback keeps the
 * reference stable for queries with nothing seen yet, so subscribers don't
 * re-render on every dispatched action.
 */
export const selectSeenEdgesByPk = (state: RootState, pk: string): string[] =>
  state.seenStatus[pk]?.seenEdges ?? EMPTY_STRING_ARRAY;

/**
 * Lookup Set for the seen edge ids of a query. Memoized here rather than in the
 * consuming hook because a path list calls that hook once per row, and each call
 * would otherwise rebuild the same Set.
 */
export const selectSeenEdgeSetByPk = createSelector(
  [selectSeenEdgesByPk],
  (seenEdges) => new Set(seenEdges)
);
