import { useMemo } from 'react';
import useCanvasOnlyMode from '@/features/Canvas/hooks/useCanvasOnlyMode';
import { useCanvasNodeDetail, useCanvasEdgeDetail } from '@/features/Canvas/hooks/useCanvasEntityDetail';
import {
  canvasNodeDetailToResultNode,
  canvasEdgeDetailToResultEdge,
} from '@/features/Canvas/utils/canvasEntityMappers';
import { getFormattedNodeName } from '@/features/Core/utils/stringFormatters';

export const useCanvasEntityRoute = () => useCanvasOnlyMode();

export const useCanvasNodeEntity = () => {
  const route = useCanvasOnlyMode();
  const query = useCanvasNodeDetail(route.canvasId, route.dataId, route.isCanvasOnlyMode);
  const resultNode = useMemo(
    () => (query.data ? canvasNodeDetailToResultNode(query.data) : null),
    [query.data],
  );
  const formattedName = useMemo(
    () => (resultNode
      ? getFormattedNodeName(resultNode.names[0] ?? undefined, resultNode.types[0] ?? null)
      : null),
    [resultNode],
  );

  return {
    ...route,
    query,
    resultNode,
    formattedName,
  };
};

export const useCanvasEdgeEntity = () => {
  const route = useCanvasOnlyMode();
  const query = useCanvasEdgeDetail(route.canvasId, route.dataId, route.isCanvasOnlyMode);
  const resultEdge = useMemo(
    () => (query.data ? canvasEdgeDetailToResultEdge(query.data) : null),
    [query.data],
  );

  return {
    ...route,
    query,
    resultEdge: resultEdge,
  };
};

export type CanvasNodeEntity = ReturnType<typeof useCanvasNodeEntity>;
export type CanvasEdgeEntity = ReturnType<typeof useCanvasEdgeEntity>;
