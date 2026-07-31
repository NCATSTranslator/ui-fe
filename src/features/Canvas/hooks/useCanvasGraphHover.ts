import { useState, useMemo, useCallback, MouseEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { GraphNodeType, GraphEdgeType, HoverGeometry } from 'translator-graph-view';
import type { Canvas } from '@/features/Canvas/types/canvas';
import type { GraphHoverTarget } from '@/features/ResultGraphView/types/graphTypes';
import type { EvidenceTabName } from '@/features/Evidence/types/navigation';
import { useDelayedHoverTarget } from '@/features/ResultGraphView/hooks/useDelayedHoverTarget';
import {
  useCanvasNodeDetail,
  useCanvasEdgeDetail,
  prefetchCanvasNodeDetail,
  prefetchCanvasEdgeDetail,
} from '@/features/Canvas/hooks/useCanvasEntityDetail';
import { toGraphHoverTarget } from '@/features/ResultGraphView/utils/graphFunctions';
import {
  canvasNodeDetailToResultNode,
  canvasEdgeDetailToResultEdge,
} from '@/features/Canvas/utils/canvasEntityMappers';
import { getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import type { PredicateClickOptions } from '@/features/Core/components/Tooltips/EdgeTooltipContent';
import type { CanvasEdgeDetail, CanvasNodeDetail } from '@/features/Canvas/types/canvas';
import { useSelector } from 'react-redux';

interface HoveredEntity {
  id: string;
  dataId: number;
  geometry: HoverGeometry;
}

interface UseCanvasGraphHoverOptions {
  canvas: Canvas | null;
  navigateToEdge: (canvas: Canvas, edge: Canvas['edges'][string], tab?: EvidenceTabName) => void;
}

const resolveHoverTarget = (
  hoveredNode: HoveredEntity | null,
  hoveredEdge: HoveredEntity | null,
  nodeDetail: CanvasNodeDetail | undefined,
  edgeDetail: CanvasEdgeDetail | undefined,
): GraphHoverTarget => {
  if (hoveredNode && nodeDetail) {
    return toGraphHoverTarget(
      'node',
      hoveredNode.id,
      canvasNodeDetailToResultNode(nodeDetail),
      hoveredNode.geometry.anchor,
    );
  }
  if (hoveredEdge && edgeDetail) {
    const resultEdge = canvasEdgeDetailToResultEdge(edgeDetail);
    return toGraphHoverTarget('edge', hoveredEdge.id, resultEdge, hoveredEdge.geometry.anchor);
  }
  return null;
};

const useCanvasGraphHover = ({ canvas, navigateToEdge }: UseCanvasGraphHoverOptions) => {
  const queryClient = useQueryClient();
  const resultSet = useSelector(getResultSetById(canvas?.queryRef ?? undefined));

  const [hoveredNode, setHoveredNode] = useState<HoveredEntity | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<HoveredEntity | null>(null);
  const [tooltipHovered, setTooltipHovered] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const nodeDetailQuery = useCanvasNodeDetail(canvas?.id, hoveredNode?.dataId, !!hoveredNode && !!canvas);
  const edgeDetailQuery = useCanvasEdgeDetail(canvas?.id, hoveredEdge?.dataId, !!hoveredEdge && !!canvas);

  const pending = useMemo(
    () => resolveHoverTarget(hoveredNode, hoveredEdge, nodeDetailQuery.data, edgeDetailQuery.data),
    [hoveredNode, hoveredEdge, nodeDetailQuery.data, edgeDetailQuery.data],
  );
  const visible = useDelayedHoverTarget(pending, { hold: tooltipHovered });

  const handleGraphNodeHover = useCallback((node: GraphNodeType | null, geometry: HoverGeometry | null) => {
    if (!node || !geometry || !canvas) {
      setHoveredNode(null);
      return;
    }
    const canvasNode = canvas.nodes[node.id];
    if (!canvasNode?.dataId) {
      setHoveredNode(null);
      return;
    }
    setHoveredEdge(null);
    prefetchCanvasNodeDetail(queryClient, canvas.id, canvasNode.dataId);
    setHoveredNode({ id: node.id, dataId: canvasNode.dataId, geometry });
  }, [canvas, queryClient]);

  const handleGraphEdgeHover = useCallback((edge: GraphEdgeType | null, geometry: HoverGeometry | null) => {
    if (!edge || !geometry || !canvas) {
      setHoveredEdge(null);
      return;
    }
    const canvasEdge = canvas.edges[edge.id];
    if (!canvasEdge?.dataId) {
      setHoveredEdge(null);
      return;
    }
    setHoveredNode(null);
    prefetchCanvasEdgeDetail(queryClient, canvas.id, canvasEdge.dataId);
    setHoveredEdge({ id: edge.id, dataId: canvasEdge.dataId, geometry });
  }, [canvas, queryClient]);

  const onContainerMouseMove = useCallback((event: MouseEvent<HTMLDivElement>) => {
    setCursor({ x: event.clientX, y: event.clientY });
  }, []);

  const onPredicateClick = useCallback((
    event: MouseEvent<HTMLSpanElement>,
    edgeId: string,
    options?: PredicateClickOptions,
  ) => {
    event.stopPropagation();
    if (!canvas) return;
    const edge = canvas.edges[edgeId];
    if (edge) navigateToEdge(canvas, edge, options?.tab);
  }, [canvas, navigateToEdge]);

  const onTooltipEnter = useCallback(() => setTooltipHovered(true), []);
  const onTooltipLeave = useCallback(() => setTooltipHovered(false), []);

  return {
    visible,
    cursor,
    resultSet,
    onContainerMouseMove,
    onPredicateClick,
    handleGraphNodeHover,
    handleGraphEdgeHover,
    onTooltipEnter,
    onTooltipLeave,
  };
};

export default useCanvasGraphHover;
