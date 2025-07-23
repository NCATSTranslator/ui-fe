import { Dispatch, SetStateAction, useContext, useMemo } from "react";
import { LastViewedPathIDContext, SupportPathDepthContext } from "@/features/ResultItem/components/PathView/PathView";
import { ExpandedPredicateContext } from "@/features/ResultItem/components/PathContainer/PathContainer";
import { SupportPathKeyContext } from "@/features/ResultItem/components/SupportPathGroup/SupportPathGroup";
import { markEdgeSeen, markEdgeUnseen, resetSeenStatus } from "@/features/ResultList/slices/seenStatusSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";

export type LastViewedPathIDContextType = {
  lastViewedPathID: string | null;
  setLastViewedPathID: Dispatch<SetStateAction<string | null>>;
};
export const useLastViewedPath = (): LastViewedPathIDContextType => {
  const context = useContext(LastViewedPathIDContext);
  if (!context) {
    console.warn("useLastViewedPath must be used within a LastViewedPathIDContext.Provider");
    return { lastViewedPathID: null, setLastViewedPathID: () => {} };
  }
  return context;
};

/**
 * Custom hook to get the current depth level in the path hierarchy.
 * @returns {number} The current depth level.
 */
export const useSupportPathDepth = (): number => {
  return useContext(SupportPathDepthContext);
};

/**
 * Custom hook to get the current key of a support path in the path hierarchy.
 * @returns {string} The key expressed as a string (1, 1.a, 1.a.i, etc.)
 */
export const useSupportPathKey = (): string => {
  return useContext(SupportPathKeyContext);
};

/**
 * Custom hook to manage which predicate is expanded within a path.
 * Ensures only one predicate can be expanded at a time within each path.
 * @returns {Object} Object containing expandedPredicateId and setExpandedPredicateId function
 */
export const useExpandedPredicate = () => {
  const context = useContext(ExpandedPredicateContext);
  if (!context) {
    console.warn("useExpandedPredicate must be used within an ExpandedPredicateContext.Provider");
    return { expandedPredicateId: null, setExpandedPredicateId: () => {} };
  }
  return context;
};

/**
 * Custom hook to handle seen/unseen status on edges and paths
 */
export const useSeenStatus = (pk: string) => {
  const dispatch: AppDispatch = useDispatch();

  const seenStatus = useSelector((state: RootState) =>
    state.seenStatus[pk] || { seenEdges: [], seenPaths: [] }
  );

  const isEdgeSeen = (edgeId: string): boolean => seenStatus.seenEdges.includes(edgeId);
  const seenEdges = useSelector((state: RootState) => state.seenStatus[pk]?.seenEdges || []);
  const seenEdgeSet = useMemo(() => new Set(seenEdges), [seenEdges]);
  const isPathSeen = (edgeIds: string[]): boolean => edgeIds.every((id) => seenEdgeSet.has(id));
  const handleMarkEdgeSeen = (edgeId: string) => dispatch(markEdgeSeen({ pk, edgeId }));
  const handleMarkEdgeUnseen = (edgeId: string) => dispatch(markEdgeUnseen({ pk, edgeId }));
  const resetStatus = () => dispatch(resetSeenStatus({ pk }));

  return {
    seenEdges: seenStatus.seenEdges,
    isEdgeSeen,
    isPathSeen,
    markEdgeSeen: handleMarkEdgeSeen,
    markEdgeUnseen: handleMarkEdgeUnseen,
    resetStatus,
  };
};