import { useCallback, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import type { GraphAnnotation } from 'translator-graph-view';
import type { AppDispatch } from '@/redux/store';
import { setCanvasAnnotations } from '@/features/Canvas/slices/canvasSlice';
import type {
  Canvas,
  CreateCanvasAnnotationRequest,
  GraphGeometry,
  GraphSelection,
  BackendCanvasAnnotation,
  SaveGeometryOptions,
} from '@/features/Canvas/types/canvas';
import {
  backendAnnotationToCanvasAnnotation,
  canvasAnnotationsToGraphAnnotations,
  canvasAnnotationsToGeometryPayload,
  createCanvasAnnotationDraft,
  estimateAnnotationHeightFromText,
  syncGraphAnnotationsToCanvas,
} from '@/features/Canvas/utils/canvasAnnotationUtils';

interface UseCanvasAnnotationsOptions {
  activeCanvas: Canvas | null;
  pushUndo: () => void;
  saveCreateAnnotation: (
    canvasId: number,
    request: CreateCanvasAnnotationRequest,
  ) => Promise<BackendCanvasAnnotation | null>;
  saveUpdateAnnotationText: (canvasId: number, annotationId: number, text: string) => void;
  saveGeometry: (canvasId: number, geometry: GraphGeometry, options?: SaveGeometryOptions) => Promise<void>;
  saveTrashElements: (canvasId: number, selection: GraphSelection) => Promise<void>;
}

const positionsEqual = (
  a: { x: number; y: number },
  b: { x: number; y: number },
): boolean => a.x === b.x && a.y === b.y;

const useCanvasAnnotations = ({
  activeCanvas,
  pushUndo,
  saveCreateAnnotation,
  saveUpdateAnnotationText,
  saveGeometry,
  saveTrashElements,
}: UseCanvasAnnotationsOptions) => {
  const dispatch = useDispatch<AppDispatch>();
  const activeCanvasRef = useRef(activeCanvas);
  activeCanvasRef.current = activeCanvas;

  const graphAnnotations = useMemo(
    () => canvasAnnotationsToGraphAnnotations(activeCanvas?.annotations ?? []),
    [activeCanvas?.annotations],
  );

  const handleAnnotationsChange = useCallback((next: GraphAnnotation[]) => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;

    const previous = canvas.annotations;
    const previousById = new Map(previous.map(annotation => [annotation.id, annotation]));
    const synced = syncGraphAnnotationsToCanvas(previous, next);
    const nextIds = new Set(synced.map(annotation => annotation.id));
    const deleted = previous.filter(
      annotation => !nextIds.has(annotation.id) && annotation.dataId > 0,
    );

    const withHeights = synced.map(annotation => {
      const prev = previousById.get(annotation.id);
      if (!prev || prev.text === annotation.text || annotation.dataId <= 0) {
        return annotation;
      }
      const height = estimateAnnotationHeightFromText(annotation.text);
      return height !== annotation.height ? { ...annotation, height } : annotation;
    });

    pushUndo();
    dispatch(setCanvasAnnotations({
      canvasId: canvas.id,
      annotations: withHeights,
    }));

    if (deleted.length > 0) {
      void saveTrashElements(canvas.id, {
        annotations: deleted.map(annotation => annotation.dataId),
      });
    }

    const movedAnnotations = withHeights.filter(annotation => {
      const prev = previousById.get(annotation.id);
      return (
        prev
        && annotation.dataId > 0
        && !positionsEqual(prev.position, annotation.position)
      );
    });
    if (movedAnnotations.length > 0) {
      void saveGeometry(canvas.id, {
        annotations: canvasAnnotationsToGeometryPayload(movedAnnotations),
      });
    }

    for (const annotation of withHeights) {
      const prev = previousById.get(annotation.id);
      if (!prev || prev.text === annotation.text || annotation.dataId <= 0) continue;
      saveUpdateAnnotationText(canvas.id, annotation.dataId, annotation.text);
    }
  }, [
    dispatch,
    pushUndo,
    saveGeometry,
    saveTrashElements,
    saveUpdateAnnotationText,
  ]);

  const addAnnotation = useCallback(async (): Promise<string | null> => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return null;

    const draft = createCanvasAnnotationDraft(canvas.annotations, canvas.nodes);
    const created = await saveCreateAnnotation(canvas.id, draft);
    if (!created) return null;

    pushUndo();
    const annotation = backendAnnotationToCanvasAnnotation(created);
    dispatch(setCanvasAnnotations({
      canvasId: canvas.id,
      annotations: [...canvas.annotations, annotation],
    }));
    return annotation.id;
  }, [dispatch, pushUndo, saveCreateAnnotation]);

  const removeAnnotation = useCallback((annotationId: string) => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;

    const annotation = canvas.annotations.find(item => item.id === annotationId);
    if (!annotation) return;

    pushUndo();
    dispatch(setCanvasAnnotations({
      canvasId: canvas.id,
      annotations: canvas.annotations.filter(item => item.id !== annotationId),
    }));

    if (annotation.dataId > 0) {
      void saveTrashElements(canvas.id, { annotations: [annotation.dataId] });
    }
  }, [dispatch, pushUndo, saveTrashElements]);

  return {
    graphAnnotations,
    handleAnnotationsChange,
    addAnnotation,
    removeAnnotation,
  };
};

export default useCanvasAnnotations;
