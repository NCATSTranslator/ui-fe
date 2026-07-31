import { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import type { GraphAnnotation } from 'translator-graph-view';
import type { AppDispatch } from '@/redux/store';
import { setCanvasAnnotations } from '@/features/Canvas/slices/canvasSlice';
import type { Canvas } from '@/features/Canvas/types/canvas';
import {
  canvasAnnotationsToGraphAnnotations,
  createCanvasAnnotation,
  syncGraphAnnotationsToCanvas,
} from '@/features/Canvas/utils/canvasAnnotationUtils';

interface UseCanvasAnnotationsOptions {
  activeCanvas: Canvas | null;
  pushUndo: () => void;
}

const useCanvasAnnotations = ({ activeCanvas, pushUndo }: UseCanvasAnnotationsOptions) => {
  const dispatch = useDispatch<AppDispatch>();

  const graphAnnotations = useMemo(
    () => canvasAnnotationsToGraphAnnotations(activeCanvas?.annotations ?? []),
    [activeCanvas?.annotations],
  );

  const handleAnnotationsChange = useCallback((next: GraphAnnotation[]) => {
    if (!activeCanvas) return;
    pushUndo();
    dispatch(setCanvasAnnotations({
      canvasId: activeCanvas.id,
      annotations: syncGraphAnnotationsToCanvas(activeCanvas.annotations, next),
    }));
  }, [activeCanvas, dispatch, pushUndo]);

  const addAnnotation = useCallback((): string | null => {
    if (!activeCanvas) return null;
    pushUndo();
    const annotation = createCanvasAnnotation(activeCanvas.annotations, activeCanvas.nodes);
    dispatch(setCanvasAnnotations({
      canvasId: activeCanvas.id,
      annotations: [...activeCanvas.annotations, annotation],
    }));
    return annotation.id;
  }, [activeCanvas, dispatch, pushUndo]);

  return {
    graphAnnotations,
    handleAnnotationsChange,
    addAnnotation,
  };
};

export default useCanvasAnnotations;
