import { useCallback, type MutableRefObject } from 'react';
import { useDispatch } from 'react-redux';
import type { NodePositionMap } from 'translator-graph-view';
import type { AppDispatch } from '@/redux/store';
import type { Canvas, GraphGeometry, SaveGeometryOptions } from '@/features/Canvas/types/canvas';
import { updateCanvasNodePositions } from '@/features/Canvas/slices/canvasSlice';
import { nodePositionMapToStoreUpdates } from '@/features/Canvas/utils/canvasGraphFunctions';
import { canvasAnnotationsToGeometryPayload } from '@/features/Canvas/utils/canvasAnnotationUtils';

type SyncPositionsOptions = SaveGeometryOptions & {
  expectedGeneration?: number;
};

const buildPositionPersistence = (canvas: Canvas, positions: NodePositionMap) => {
  const positionUpdates = nodePositionMapToStoreUpdates(positions);
  const moves = positionUpdates.flatMap(({ nodeId, x, y }) => {
    const node = canvas.nodes[nodeId];
    return node?.dataId ? [{ data_id: node.dataId, x, y }] : [];
  });
  return { positionUpdates, moves };
};

const useSyncCanvasPositions = (
  canvas: Canvas | null,
  layoutSaveGenerationRef: MutableRefObject<number>,
  saveGeometry: (
    canvasId: number,
    geometry: GraphGeometry,
    options?: SaveGeometryOptions,
  ) => Promise<void>,
) => {
  const dispatch = useDispatch<AppDispatch>();

  return useCallback(async (
    positions: NodePositionMap,
    options?: SyncPositionsOptions,
  ) => {
    if (!canvas) return;
    if (
      options?.expectedGeneration !== undefined
      && options.expectedGeneration !== layoutSaveGenerationRef.current
    ) {
      return;
    }

    const { positionUpdates, moves } = buildPositionPersistence(canvas, positions);
    if (positionUpdates.length > 0) {
      dispatch(updateCanvasNodePositions({ canvasId: canvas.id, positions: positionUpdates }));
    }

    const geometry: GraphGeometry = {};
    if (moves.length > 0) geometry.nodes = moves;
    if (options?.immediate && canvas.annotations.length > 0) {
      geometry.annotations = canvasAnnotationsToGeometryPayload(canvas.annotations);
    }
    if (geometry.nodes?.length || geometry.annotations?.length) {
      await saveGeometry(canvas.id, geometry, { immediate: options?.immediate });
    }
  }, [canvas, dispatch, layoutSaveGenerationRef, saveGeometry]);
};

export default useSyncCanvasPositions;
