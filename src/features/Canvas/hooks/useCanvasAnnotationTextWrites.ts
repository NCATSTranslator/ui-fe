import { useCallback, useEffect, useRef } from 'react';
import { updateCanvasAnnotationText } from '@/features/Canvas/utils/canvasApi';

const ANNOTATION_TEXT_DEBOUNCE_MS = 500;

type WrapFn = <T>(fn: () => Promise<T>) => Promise<T | null>;

const useCanvasAnnotationTextWrites = (wrap: WrapFn) => {
  const wrapRef = useRef(wrap);
  wrapRef.current = wrap;
  const annotationTextWriteGenerationRef = useRef(0);
  const pendingTextUpdatesRef = useRef<Map<number, { canvasId: number; annotationId: number; text: string }>>(
    new Map(),
  );
  const textDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingAnnotationText = useCallback(() => {
    annotationTextWriteGenerationRef.current += 1;
    if (textDebounceRef.current) {
      clearTimeout(textDebounceRef.current);
      textDebounceRef.current = null;
    }
    pendingTextUpdatesRef.current.clear();
  }, []);

  const flushPendingTextUpdates = useCallback(async () => {
    if (textDebounceRef.current) {
      clearTimeout(textDebounceRef.current);
      textDebounceRef.current = null;
    }
    const updates = Array.from(pendingTextUpdatesRef.current.values());
    pendingTextUpdatesRef.current.clear();
    if (updates.length === 0) return;
    const generation = annotationTextWriteGenerationRef.current;
    await wrapRef.current(async () => {
      if (generation !== annotationTextWriteGenerationRef.current) return;
      await Promise.all(
        updates.map(({ canvasId, annotationId, text }) =>
          updateCanvasAnnotationText(canvasId, annotationId, { content: text }),
        ),
      );
    });
  }, []);

  useEffect(() => () => {
    if (textDebounceRef.current) clearTimeout(textDebounceRef.current);
    void flushPendingTextUpdates();
  }, [flushPendingTextUpdates]);

  const saveUpdateAnnotationText = useCallback((
    canvasId: number,
    annotationId: number,
    text: string,
  ) => {
    pendingTextUpdatesRef.current.set(annotationId, { canvasId, annotationId, text });
    if (textDebounceRef.current) clearTimeout(textDebounceRef.current);
    textDebounceRef.current = setTimeout(() => {
      textDebounceRef.current = null;
      void flushPendingTextUpdates();
    }, ANNOTATION_TEXT_DEBOUNCE_MS);
  }, [flushPendingTextUpdates]);

  const saveAnnotationText = useCallback(async (
    canvasId: number,
    annotationId: number,
    text: string,
  ) => {
    const generation = annotationTextWriteGenerationRef.current;
    await wrap(async () => {
      if (generation !== annotationTextWriteGenerationRef.current) return;
      await updateCanvasAnnotationText(canvasId, annotationId, { content: text });
    });
  }, [wrap]);

  return {
    saveUpdateAnnotationText,
    saveAnnotationText,
    clearPendingAnnotationText,
  };
};

export default useCanvasAnnotationTextWrites;
