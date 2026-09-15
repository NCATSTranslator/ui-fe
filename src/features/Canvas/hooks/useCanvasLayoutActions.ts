import { useCallback, useEffect, useRef } from 'react';
import type { LayoutType, NodePositionMap } from 'translator-graph-view';
import type { Canvas, CanvasLayout } from '@/features/Canvas/types/canvas';
import useCanvasLayoutMutations from '@/features/Canvas/hooks/useCanvasLayoutMutations';
import type { MutableRefObject, Dispatch, SetStateAction } from 'react';
import { trackEvent } from '@/features/Analytics/utils/dataLayer';

type SyncFn = (
  positions: NodePositionMap,
  options?: { immediate?: boolean; expectedGeneration?: number },
) => Promise<void>;

type UseCanvasLayoutActionsOptions = {
  canvas: Canvas | null;
  graphLayout: LayoutType;
  setGraphLayout: Dispatch<SetStateAction<LayoutType>>;
  graphLayoutRef: MutableRefObject<LayoutType>;
  setFrozenNodePositions: Dispatch<SetStateAction<NodePositionMap | null>>;
  layoutSaveGenerationRef: MutableRefObject<number>;
  bumpLayoutGeneration: () => number;
  pushUndo: () => void;
  saveLayout: (canvasId: number, layout: CanvasLayout) => Promise<void>;
  syncPositionsToStore: SyncFn;
};

const useCanvasLayoutActions = (options: UseCanvasLayoutActionsOptions) => {
  const { canvas, graphLayout, layoutSaveGenerationRef, graphLayoutRef, syncPositionsToStore } = options;
  const layoutSavePendingRef = useRef<{ layout: LayoutType; generation: number } | null>(null);
  const lastAutoLayoutPositionsRef = useRef<NodePositionMap>({});

  const { applyLayoutChange, handleGraphNodeDragStop } = useCanvasLayoutMutations({
    ...options,
    lastAutoLayoutPositionsRef,
    layoutSavePendingRef,
  });

  useEffect(() => {
    layoutSavePendingRef.current = null;
  }, [canvas?.id]);

  const handleLayoutComplete = useCallback(async (positions: NodePositionMap) => {
    lastAutoLayoutPositionsRef.current = positions;
    const pending = layoutSavePendingRef.current;
    if (!canvas || !pending) return;
    if (pending.generation !== layoutSaveGenerationRef.current
      || pending.layout !== graphLayoutRef.current) {
      layoutSavePendingRef.current = null;
      return;
    }
    layoutSavePendingRef.current = null;
    await syncPositionsToStore(positions, {
      immediate: true,
      expectedGeneration: pending.generation,
    });
  }, [canvas, graphLayoutRef, layoutSaveGenerationRef, syncPositionsToStore]);

  const requestLayoutChange = useCallback((targetLayout: LayoutType) => {
    if (!canvas || targetLayout === graphLayout) return;
    trackEvent('canvas_layout_applied', { layout_name: targetLayout });
    applyLayoutChange(targetLayout);
  }, [applyLayoutChange, canvas, graphLayout]);

  return {
    handleGraphNodeDragStop,
    handleLayoutComplete,
    requestLayoutChange,
  };
};

export default useCanvasLayoutActions;
