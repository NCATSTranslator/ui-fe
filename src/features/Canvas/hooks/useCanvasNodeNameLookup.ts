import { useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { selectCanvases } from '@/features/Canvas/slices/canvasSlice';
import { getCanvasGraph } from '@/features/Canvas/utils/canvasApi';
import { CANVAS_DETAIL_STALE_TIME } from '@/features/Canvas/hooks/useCanvasEntityDetail';
import { reuseRecordIfEqual } from '@/features/Core/utils/recordHelpers';
import useSettleTimeout from '@/features/Core/hooks/useSettleTimeout';

export const canvasGraphNamesQueryKey = (canvasId: number) =>
  ['canvasGraphNames', canvasId] as const;

export interface CanvasNodeNameLookup {
  lookup: Record<string, string>;
  // True once names are available from Redux/graph, the graph query failed, or the wait timed out.
  isSettled: boolean;
}

const useCanvasNodeNameLookup = (
  canvasId: number | undefined,
  enabled: boolean,
): CanvasNodeNameLookup => {
  const canvases = useSelector(selectCanvases);
  const reduxCanvas = useMemo(
    () => (canvasId !== undefined ? canvases.find(c => c.id === canvasId) : undefined),
    [canvases, canvasId],
  );
  const hasReduxNodes = !!reduxCanvas && Object.keys(reduxCanvas.nodes).length > 0;
  const lookupRef = useRef<Record<string, string>>({});

  const graphQuery = useQuery({
    queryKey: canvasGraphNamesQueryKey(canvasId ?? 0),
    queryFn: () => {
      if (canvasId === undefined) {
        throw new Error('canvasId is required');
      }
      return getCanvasGraph(canvasId);
    },
    enabled: enabled && canvasId !== undefined && !hasReduxNodes,
    staleTime: CANVAS_DETAIL_STALE_TIME,
    retry: false,
  });

  const lookup = useMemo(() => {
    const next: Record<string, string> = {};
    if (hasReduxNodes && reduxCanvas) {
      for (const node of Object.values(reduxCanvas.nodes)) {
        next[node.id] = node.names[0] || node.ref;
      }
    } else if (graphQuery.data) {
      for (const node of graphQuery.data.nodes) {
        next[node.ref] = node.label;
      }
    }
    lookupRef.current = reuseRecordIfEqual(lookupRef.current, next);
    return lookupRef.current;
  }, [hasReduxNodes, reduxCanvas, graphQuery.data]);

  const querySettled = !enabled || hasReduxNodes || !graphQuery.isPending;
  const timedOut = useSettleTimeout(enabled && !querySettled);

  return { lookup, isSettled: querySettled || timedOut };
};

export default useCanvasNodeNameLookup;
