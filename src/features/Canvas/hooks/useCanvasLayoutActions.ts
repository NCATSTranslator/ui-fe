import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutType, NodePositionMap } from 'translator-graph-view';
import type { Canvas, CanvasLayout } from '@/features/Canvas/types/canvas';
import { isCustomCanvasLayout } from '@/features/Canvas/utils/canvasLayoutUtils';
import useCanvasLayoutMutations from '@/features/Canvas/hooks/useCanvasLayoutMutations';
import type { MutableRefObject, Dispatch, SetStateAction } from 'react';

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
  const [layoutWarningOpen, setLayoutWarningOpen] = useState(false);
  const pendingLayoutRef = useRef<LayoutType | null>(null);
  const layoutSavePendingRef = useRef<{ layout: LayoutType; generation: number } | null>(null);
  const lastAutoLayoutPositionsRef = useRef<NodePositionMap>({});

  const { applyLayoutChange, handleGraphNodeDragStop } = useCanvasLayoutMutations({
    ...options,
    lastAutoLayoutPositionsRef,
    layoutSavePendingRef,
  });

  useEffect(() => {
    pendingLayoutRef.current = null;
    layoutSavePendingRef.current = null;
    setLayoutWarningOpen(false);
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
    if (isCustomCanvasLayout(canvas.layout) && targetLayout !== 'custom') {
      pendingLayoutRef.current = targetLayout;
      setLayoutWarningOpen(true);
      return;
    }
    applyLayoutChange(targetLayout);
  }, [applyLayoutChange, canvas, graphLayout]);

  return {
    layoutWarningOpen,
    handleGraphNodeDragStop,
    handleLayoutComplete,
    requestLayoutChange,
    confirmLayoutChange: useCallback(() => {
      const pending = pendingLayoutRef.current;
      pendingLayoutRef.current = null;
      setLayoutWarningOpen(false);
      if (pending) applyLayoutChange(pending);
    }, [applyLayoutChange]),
    cancelLayoutChange: useCallback(() => {
      pendingLayoutRef.current = null;
      setLayoutWarningOpen(false);
    }, []),
  };
};

export default useCanvasLayoutActions;
