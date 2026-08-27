import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { LayoutType, NodePositionMap } from 'translator-graph-view';
import type { Canvas } from '@/features/Canvas/types/canvas';
import {
  canvasLayoutToGraphLayout,
  isCustomCanvasLayout,
} from '@/features/Canvas/utils/canvasLayoutUtils';
import {
  canvasNodesToNodePositions,
  nodePositionsAreAllOrigin,
} from '@/features/Canvas/utils/canvasGraphFunctions';

const useCanvasLayoutState = (canvas: Canvas | null) => {
  const [graphLayout, setGraphLayout] = useState<LayoutType>(
    () => (canvas ? canvasLayoutToGraphLayout(canvas.layout) : 'hierarchicalLR'),
  );
  const [frozenNodePositions, setFrozenNodePositions] = useState<NodePositionMap | null>(null);
  const layoutSaveGenerationRef = useRef(0);
  const canvasIdRef = useRef<number | undefined>(undefined);
  const graphLayoutRef = useRef(graphLayout);
  graphLayoutRef.current = graphLayout;

  const canvasLayout = canvas?.layout;
  const canvasNodes = canvas?.nodes;
  const customPositionsKey = useMemo(() => {
    if (!canvasNodes || !canvasLayout || !isCustomCanvasLayout(canvasLayout)) return '';
    return Object.entries(canvasNodes)
      .map(([id, node]) => `${id}:${node.x}:${node.y}`)
      .sort()
      .join('|');
  }, [canvasNodes, canvasLayout]);

  useLayoutEffect(() => {
    if (!canvas) return;

    if (canvasIdRef.current !== canvas.id) {
      canvasIdRef.current = canvas.id;
      layoutSaveGenerationRef.current += 1;
    }

    const nextGraphLayout = canvasLayoutToGraphLayout(canvas.layout);
    if (graphLayoutRef.current !== nextGraphLayout) {
      layoutSaveGenerationRef.current += 1;
    }

    setGraphLayout(nextGraphLayout);

    if (!isCustomCanvasLayout(canvas.layout)) {
      setFrozenNodePositions(null);
      return;
    }
    if (!canvas.graphLoaded) return;

    const nextPositions = canvasNodesToNodePositions(canvas.nodes);
    if (Object.keys(nextPositions).length === 0) return;

    setFrozenNodePositions((prev: NodePositionMap | null) => (
      nodePositionsAreAllOrigin(nextPositions) ? prev : nextPositions
    ));
  }, [canvas, customPositionsKey]);

  const bumpLayoutGeneration = useCallback(() => {
    layoutSaveGenerationRef.current += 1;
    return layoutSaveGenerationRef.current;
  }, []);

  const graphLoaded = canvas?.graphLoaded;
  const isCustomLayoutReady = useMemo(() => {
    if (graphLayout !== 'custom') return true;
    if (!graphLoaded) return false;
    if (!canvasNodes || Object.keys(canvasNodes).length === 0) return true;
    if (!frozenNodePositions || Object.keys(frozenNodePositions).length === 0) return false;
    return !nodePositionsAreAllOrigin(frozenNodePositions);
  }, [graphLayout, graphLoaded, canvasNodes, frozenNodePositions]);

  return {
    graphLayout,
    setGraphLayout,
    graphLayoutRef,
    frozenNodePositions,
    setFrozenNodePositions,
    layoutSaveGenerationRef,
    bumpLayoutGeneration,
    isCustomLayoutReady,
    nodePositions: graphLayout === 'custom' ? frozenNodePositions ?? undefined : undefined,
  };
};

export default useCanvasLayoutState;
