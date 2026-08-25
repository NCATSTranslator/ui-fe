import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { selectCanvases } from '@/features/Canvas/slices/canvasSlice';
import { getCanvasGraph } from '@/features/Canvas/utils/canvasApi';
import { CANVAS_DETAIL_STALE_TIME } from '@/features/Canvas/hooks/useCanvasEntityDetail';

export const canvasGraphNamesQueryKey = (canvasId: number) =>
  ['canvasGraphNames', canvasId] as const;

const useCanvasNodeNameLookup = (
  canvasId: number | undefined,
  enabled: boolean,
): Record<string, string> => {
  const canvases = useSelector(selectCanvases);
  const reduxCanvas = useMemo(
    () => (canvasId !== undefined ? canvases.find(c => c.id === canvasId) : undefined),
    [canvases, canvasId],
  );
  const hasReduxNodes = !!reduxCanvas && Object.keys(reduxCanvas.nodes).length > 0;

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
  });

  return useMemo(() => {
    const lookup: Record<string, string> = {};
    if (hasReduxNodes && reduxCanvas) {
      for (const node of Object.values(reduxCanvas.nodes)) {
        lookup[node.id] = node.names[0] || node.ref;
      }
      return lookup;
    }
    if (graphQuery.data) {
      for (const node of graphQuery.data.nodes) {
        lookup[node.ref] = node.label;
      }
    }
    return lookup;
  }, [hasReduxNodes, reduxCanvas, graphQuery.data]);
};

export default useCanvasNodeNameLookup;
