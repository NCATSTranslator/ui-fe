import { createContext, Dispatch, SetStateAction, useCallback, useContext } from "react";
import { ResultItemIdContext } from "@/features/ResultItem/components/PathView/PathView";
import { markEdgeSeen, markEdgeUnseen, resetSeenStatus } from "@/features/ResultList/slices/seenStatusSlice";
import { useDispatch, useSelector } from "react-redux";
import { selectSeenEdgeSetByPk } from "@/redux/seenStatusSelectors";
import { AppDispatch, RootState } from "@/redux/store";

export type LastViewedPathIDContextType = {
  lastViewedPathID: string | null;
  setLastViewedPathID: Dispatch<SetStateAction<string | null>>;
};
export const LastViewedPathIDContext = createContext<LastViewedPathIDContextType | undefined>(undefined);
export const useLastViewedPath = (): LastViewedPathIDContextType => {
  const context = useContext(LastViewedPathIDContext);
  if (!context) {
    console.warn("useLastViewedPath must be used within a LastViewedPathIDContext.Provider");
    return { lastViewedPathID: null, setLastViewedPathID: () => {} };
  }
  return context;
};

/**
 * Custom hook to get the id of the result that the current PathView belongs to.
 * Falls back to undefined when rendered outside of a PathView.
 * @returns {string | undefined} The result id, if available.
 */
export const useResultItemId = (): string | undefined => {
  return useContext(ResultItemIdContext);
};

/**
 * Custom hook to handle seen/unseen status on edges and paths
 */
export const useSeenStatus = (pk: string) => {
  const dispatch: AppDispatch = useDispatch();

  // A path list calls this hook once per row, so it subscribes to the shared Set
  // rather than the id list, which would add a store subscription per row for a
  // value no caller reads.
  const seenEdgeSet = useSelector((state: RootState) => selectSeenEdgeSetByPk(state, pk));

  const isEdgeSeen = useCallback((edgeId: string): boolean => seenEdgeSet.has(edgeId), [seenEdgeSet]);
  const isPathSeen = useCallback(
    (edgeIds: string[]): boolean => edgeIds.every((id) => seenEdgeSet.has(id)),
    [seenEdgeSet]
  );
  const handleMarkEdgeSeen = useCallback((edgeId: string) => dispatch(markEdgeSeen({ pk, edgeId })), [dispatch, pk]);
  const handleMarkEdgeUnseen = useCallback((edgeId: string) => dispatch(markEdgeUnseen({ pk, edgeId })), [dispatch, pk]);
  const resetStatus = useCallback(() => dispatch(resetSeenStatus({ pk })), [dispatch, pk]);

  return {
    isEdgeSeen,
    isPathSeen,
    markEdgeSeen: handleMarkEdgeSeen,
    markEdgeUnseen: handleMarkEdgeUnseen,
    resetStatus,
  };
};