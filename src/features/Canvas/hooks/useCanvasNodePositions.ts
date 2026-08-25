import type { Canvas, CanvasLayout, GraphGeometry, SaveGeometryOptions } from '@/features/Canvas/types/canvas';
import useCanvasLayoutState from '@/features/Canvas/hooks/useCanvasLayoutState';
import useCanvasLayoutActions from '@/features/Canvas/hooks/useCanvasLayoutActions';
import useSyncCanvasPositions from '@/features/Canvas/hooks/useSyncCanvasPositions';

type UseCanvasNodePositionsOptions = {
  canvas: Canvas | null;
  pushUndo: () => void;
  saveGeometry: (
    canvasId: number,
    geometry: GraphGeometry,
    options?: SaveGeometryOptions,
  ) => Promise<void>;
  saveLayout: (canvasId: number, layout: CanvasLayout) => Promise<void>;
};

const useCanvasNodePositions = ({
  canvas,
  pushUndo,
  saveGeometry,
  saveLayout,
}: UseCanvasNodePositionsOptions) => {
  const {
    graphLayout,
    setGraphLayout,
    graphLayoutRef,
    setFrozenNodePositions,
    layoutSaveGenerationRef,
    bumpLayoutGeneration,
    isCustomLayoutReady,
    nodePositions,
  } = useCanvasLayoutState(canvas);

  const syncPositionsToStore = useSyncCanvasPositions(
    canvas,
    layoutSaveGenerationRef,
    saveGeometry,
  );

  const actions = useCanvasLayoutActions({
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
  });

  return {
    graphLayout,
    nodePositions,
    isCustomLayoutReady,
    ...actions,
  };
};

export default useCanvasNodePositions;
