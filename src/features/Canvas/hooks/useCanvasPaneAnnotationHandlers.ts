import { useCallback } from 'react';
import useCanvasAnnotations from '@/features/Canvas/hooks/useCanvasAnnotations';
import type { CanvasAnnotationAction } from '@/features/Canvas/constants/canvasAnnotationActions';
import type { Canvas, CanvasAnnotation } from '@/features/Canvas/types/canvas';
import type useCanvasPersistence from '@/features/Canvas/hooks/useCanvasPersistence';

type Persistence = ReturnType<typeof useCanvasPersistence>;

interface UseCanvasPaneAnnotationHandlersOptions {
  activeCanvas: Canvas;
  pushUndo: () => void;
  persistence: Persistence;
  findAnnotationOnCanvas: (id: string) => void;
}

/** Annotation CRUD handlers for the canvas pane object list / toolbar. */
export const useCanvasPaneAnnotationHandlers = ({
  activeCanvas,
  pushUndo,
  persistence,
  findAnnotationOnCanvas,
}: UseCanvasPaneAnnotationHandlersOptions) => {
  const {
    graphAnnotations,
    handleAnnotationsChange,
    addAnnotation,
    removeAnnotation,
  } = useCanvasAnnotations({
    activeCanvas,
    pushUndo,
    saveCreateAnnotation: persistence.saveCreateAnnotation,
    saveUpdateAnnotationText: persistence.saveUpdateAnnotationText,
    saveGeometry: persistence.saveGeometry,
    saveTrashElements: persistence.saveTrashElements,
  });

  const handleAddAnnotation = useCallback(async () => {
    const annotationId = await addAnnotation();
    if (annotationId) findAnnotationOnCanvas(annotationId);
  }, [addAnnotation, findAnnotationOnCanvas]);

  const handleAnnotationListAction = useCallback((
    action: CanvasAnnotationAction,
    annotation: CanvasAnnotation,
  ) => {
    if (action === 'find') findAnnotationOnCanvas(annotation.id);
    if (action === 'remove') removeAnnotation(annotation.id);
  }, [findAnnotationOnCanvas, removeAnnotation]);

  return {
    graphAnnotations,
    handleAnnotationsChange,
    handleAddAnnotation,
    handleAnnotationListAction,
  };
};
