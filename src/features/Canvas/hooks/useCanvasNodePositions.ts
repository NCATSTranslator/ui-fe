import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { LayoutType, NodePositionMap } from 'translator-graph-view';
import type { AppDispatch } from '@/redux/store';
import type { Canvas, CanvasLayout, GraphGeometry, SaveGeometryOptions } from '@/features/Canvas/types/canvas';
import {
  updateCanvasLayout,
  updateCanvasNodePositions,
} from '@/features/Canvas/slices/canvasSlice';
import {
  canvasLayoutToGraphLayout,
  graphLayoutToCanvasLayout,
  isCustomCanvasLayout,
} from '@/features/Canvas/utils/canvasLayoutUtils';
import {
  canvasNodesToNodePositions,
  nodePositionMapToStoreUpdates,
  nodePositionsAreAllOrigin,
} from '@/features/Canvas/utils/canvasGraphFunctions';
import { canvasAnnotationsToGeometryPayload } from '@/features/Canvas/utils/canvasAnnotationUtils';

type UseCanvasNodePositionsOptions = {
  canvas: Canvas | null;
  saveGeometry: (
    canvasId: number,
    geometry: GraphGeometry,
    options?: SaveGeometryOptions,
  ) => Promise<void>;
  saveLayout: (canvasId: number, layout: CanvasLayout) => Promise<void>;
};

const buildPositionPersistence = (
  canvas: Canvas,
  positions: NodePositionMap,
) => {
  const positionUpdates = nodePositionMapToStoreUpdates(positions);

  const moves = Object.entries(positions).flatMap(([nodeId, pos]) => {
    const node = canvas.nodes[nodeId];
    return node?.dataId ? [{ data_id: node.dataId, x: pos.x, y: pos.y }] : [];
  });

  return { positionUpdates, moves };
};

const useCanvasNodePositions = ({
  canvas,
  saveGeometry,
  saveLayout,
}: UseCanvasNodePositionsOptions) => {
  const dispatch = useDispatch<AppDispatch>();
  const [graphLayout, setGraphLayout] = useState<LayoutType>(
    () => (canvas ? canvasLayoutToGraphLayout(canvas.layout) : 'hierarchicalLR'),
  );
  const [frozenNodePositions, setFrozenNodePositions] = useState<NodePositionMap | null>(null);
  const [layoutWarningOpen, setLayoutWarningOpen] = useState(false);
  const pendingLayoutRef = useRef<LayoutType | null>(null);
  const layoutSavePendingRef = useRef(false);
  const lastAutoLayoutPositionsRef = useRef<NodePositionMap>({});
  const canvasIdRef = useRef<number | undefined>(undefined);

  const customPositionsKey = useMemo(() => {
    if (!canvas || !isCustomCanvasLayout(canvas.layout)) return '';
    return Object.entries(canvas.nodes)
      .map(([id, node]) => `${id}:${node.x}:${node.y}`)
      .sort()
      .join('|');
  }, [canvas?.nodes, canvas?.layout]);

  useLayoutEffect(() => {
    if (!canvas) return;

    const canvasSwitched = canvasIdRef.current !== canvas.id;
    if (canvasSwitched) {
      canvasIdRef.current = canvas.id;
      pendingLayoutRef.current = null;
      layoutSavePendingRef.current = false;
    }

    setGraphLayout(canvasLayoutToGraphLayout(canvas.layout));

    if (!isCustomCanvasLayout(canvas.layout)) {
      setFrozenNodePositions(null);
      return;
    }

    if (!canvas.graphLoaded) return;

    const nextPositions = canvasNodesToNodePositions(canvas.nodes);
    if (Object.keys(nextPositions).length === 0) return;

    setFrozenNodePositions((prev) => {
      if (nodePositionsAreAllOrigin(nextPositions)) return prev;
      return nextPositions;
    });
  }, [canvas?.id, canvas?.layout, canvas?.graphLoaded, customPositionsKey]);

  const syncPositionsToStore = useCallback(async (
    positions: NodePositionMap,
    options?: SaveGeometryOptions,
  ) => {
    if (!canvas) return;

    const { positionUpdates, moves } = buildPositionPersistence(canvas, positions);

    if (positionUpdates.length > 0) {
      dispatch(updateCanvasNodePositions({ canvasId: canvas.id, positions: positionUpdates }));
    }

    const geometry: GraphGeometry = {};
    if (moves.length > 0) {
      geometry.nodes = moves;
    }
    if (options?.immediate && canvas.annotations.length > 0) {
      geometry.annotations = canvasAnnotationsToGeometryPayload(canvas.annotations);
    }

    if (geometry.nodes?.length || geometry.annotations?.length) {
      await saveGeometry(canvas.id, geometry, options);
    }
  }, [canvas, dispatch, saveGeometry]);

  const persistPositions = useCallback(async (positions: NodePositionMap) => {
    await syncPositionsToStore(positions, { immediate: true });
  }, [syncPositionsToStore]);

  const enterCustomLayout = useCallback(async (positions: NodePositionMap) => {
    if (!canvas) return;
    setFrozenNodePositions(positions);
    setGraphLayout('custom');
    dispatch(updateCanvasLayout({ canvasId: canvas.id, layout: 'custom' }));
    await saveLayout(canvas.id, 'custom');
    await persistPositions(positions);
  }, [canvas, dispatch, persistPositions, saveLayout]);

  const handleGraphNodeDragStop = useCallback(async (
    nodeId: string,
    position: { x: number; y: number },
    allPositions: NodePositionMap,
  ) => {
    if (!canvas) return;
    const node = canvas.nodes[nodeId];
    if (!node?.dataId) return;

    if (!isCustomCanvasLayout(canvas.layout)) {
      await enterCustomLayout(allPositions);
      return;
    }

    setFrozenNodePositions(allPositions);
    await syncPositionsToStore(
      { [nodeId]: position },
      { immediate: false },
    );
  }, [canvas, enterCustomLayout, syncPositionsToStore]);

  const applyLayoutChange = useCallback((targetLayout: LayoutType) => {
    if (!canvas || targetLayout === graphLayout) return;

    if (targetLayout === 'custom') {
      void enterCustomLayout({ ...lastAutoLayoutPositionsRef.current });
      return;
    }

    layoutSavePendingRef.current = true;
    setGraphLayout(targetLayout);
    setFrozenNodePositions(null);

    const canvasLayout = graphLayoutToCanvasLayout(targetLayout);
    dispatch(updateCanvasLayout({ canvasId: canvas.id, layout: canvasLayout }));
    void saveLayout(canvas.id, canvasLayout);
  }, [canvas, dispatch, enterCustomLayout, graphLayout, saveLayout]);

  const handleLayoutComplete = useCallback(async (positions: NodePositionMap) => {
    lastAutoLayoutPositionsRef.current = positions;
    if (!canvas || !layoutSavePendingRef.current) return;
    layoutSavePendingRef.current = false;
    await syncPositionsToStore(positions, { immediate: true });
  }, [canvas, syncPositionsToStore]);

  const requestLayoutChange = useCallback((targetLayout: LayoutType) => {
    if (!canvas || targetLayout === graphLayout) return;

    if (isCustomCanvasLayout(canvas.layout) && targetLayout !== 'custom') {
      pendingLayoutRef.current = targetLayout;
      setLayoutWarningOpen(true);
      return;
    }

    applyLayoutChange(targetLayout);
  }, [applyLayoutChange, canvas, graphLayout]);

  const confirmLayoutChange = useCallback(() => {
    const pending = pendingLayoutRef.current;
    pendingLayoutRef.current = null;
    setLayoutWarningOpen(false);
    if (pending) applyLayoutChange(pending);
  }, [applyLayoutChange]);

  const cancelLayoutChange = useCallback(() => {
    pendingLayoutRef.current = null;
    setLayoutWarningOpen(false);
  }, []);

  const nodePositions = graphLayout === 'custom' ? frozenNodePositions ?? undefined : undefined;

  const isCustomLayoutReady = useMemo(() => {
    if (graphLayout !== 'custom') return true;
    if (!canvas?.graphLoaded) return false;
    if (Object.keys(canvas.nodes).length === 0) return true;
    if (!frozenNodePositions || Object.keys(frozenNodePositions).length === 0) return false;
    return !nodePositionsAreAllOrigin(frozenNodePositions);
  }, [graphLayout, canvas, frozenNodePositions]);

  return {
    graphLayout,
    nodePositions,
    isCustomLayoutReady,
    layoutWarningOpen,
    handleGraphNodeDragStop,
    handleLayoutComplete,
    requestLayoutChange,
    confirmLayoutChange,
    cancelLayoutChange,
  };
};

export default useCanvasNodePositions;
