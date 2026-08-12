import { useCallback, type MutableRefObject, type Dispatch, type SetStateAction } from 'react';
import { useDispatch } from 'react-redux';
import type { LayoutType, NodePositionMap } from 'translator-graph-view';
import type { AppDispatch } from '@/redux/store';
import type { Canvas, CanvasLayout } from '@/features/Canvas/types/canvas';
import { updateCanvasLayout } from '@/features/Canvas/slices/canvasSlice';
import {
  graphLayoutToCanvasLayout,
  isCustomCanvasLayout,
} from '@/features/Canvas/utils/canvasLayoutUtils';

type SyncFn = (
  positions: NodePositionMap,
  options?: { immediate?: boolean; expectedGeneration?: number },
) => Promise<void>;

type UseCanvasLayoutMutationsOptions = {
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
  lastAutoLayoutPositionsRef: MutableRefObject<NodePositionMap>;
  layoutSavePendingRef: MutableRefObject<{ layout: LayoutType; generation: number } | null>;
};

const useCanvasLayoutMutations = ({
  canvas,
  graphLayout,
  setGraphLayout,
  graphLayoutRef,
  setFrozenNodePositions,
  layoutSaveGenerationRef,
  bumpLayoutGeneration,
  pushUndo,
  saveLayout,
  syncPositionsToStore,
  lastAutoLayoutPositionsRef,
  layoutSavePendingRef,
}: UseCanvasLayoutMutationsOptions) => {
  const dispatch = useDispatch<AppDispatch>();

  const enterCustomLayout = useCallback(async (positions: NodePositionMap) => {
    if (!canvas) return;
    const generation = layoutSaveGenerationRef.current;
    pushUndo();
    setFrozenNodePositions(positions);
    setGraphLayout('custom');
    graphLayoutRef.current = 'custom';
    dispatch(updateCanvasLayout({ canvasId: canvas.id, layout: 'custom' }));
    await saveLayout(canvas.id, 'custom');
    if (generation !== layoutSaveGenerationRef.current) return;
    await syncPositionsToStore(positions, { immediate: true, expectedGeneration: generation });
  }, [
    canvas, dispatch, graphLayoutRef, layoutSaveGenerationRef,
    pushUndo, saveLayout, setFrozenNodePositions, setGraphLayout, syncPositionsToStore,
  ]);

  const applyLayoutChange = useCallback((targetLayout: LayoutType) => {
    if (!canvas || targetLayout === graphLayout) return;
    if (targetLayout === 'custom') {
      void enterCustomLayout({ ...lastAutoLayoutPositionsRef.current });
      return;
    }

    pushUndo();
    const generation = bumpLayoutGeneration();
    layoutSavePendingRef.current = { layout: targetLayout, generation };
    setGraphLayout(targetLayout);
    graphLayoutRef.current = targetLayout;
    setFrozenNodePositions(null);
    const canvasLayout = graphLayoutToCanvasLayout(targetLayout);
    dispatch(updateCanvasLayout({ canvasId: canvas.id, layout: canvasLayout }));
    void saveLayout(canvas.id, canvasLayout);
  }, [
    bumpLayoutGeneration, canvas, dispatch, enterCustomLayout, graphLayout,
    graphLayoutRef, lastAutoLayoutPositionsRef, layoutSavePendingRef,
    pushUndo, saveLayout, setFrozenNodePositions, setGraphLayout,
  ]);

  return { enterCustomLayout, applyLayoutChange, handleGraphNodeDragStop: useCallback(async (
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
    if (node.x === position.x && node.y === position.y) return;
    pushUndo();
    setFrozenNodePositions(allPositions);
    await syncPositionsToStore({ [nodeId]: position }, { immediate: false });
  }, [canvas, enterCustomLayout, pushUndo, setFrozenNodePositions, syncPositionsToStore]) };
};

export default useCanvasLayoutMutations;
