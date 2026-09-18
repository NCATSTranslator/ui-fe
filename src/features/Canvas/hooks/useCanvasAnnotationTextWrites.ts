import { useCallback, useEffect, useRef } from 'react';
import { updateCanvasAnnotationText } from '@/features/Canvas/utils/canvasApi';
import {
  CANVAS_WRITE_DEBOUNCE_MS,
  createBufferedWriteTracker,
} from '@/features/Canvas/utils/canvasBufferedWriteUtils';
import { trackCanvasWrite } from '@/features/Canvas/utils/canvasSyncUtils';

const ANNOTATION_TEXT_WRITE_SOURCE = 'annotation-text';

type PendingTextUpdate = { canvasId: number; annotationId: number; text: string };

/* Sends a batch of annotation text edits, marking every canvas it touches as written so sync
 * holds off while the requests are in flight. */
const writeAnnotationTexts = (updates: PendingTextUpdate[]) =>
  trackCanvasWrite(updates.map(update => update.canvasId), () => Promise.all(
    updates.map(({ canvasId, annotationId, text }) =>
      updateCanvasAnnotationText(canvasId, annotationId, { content: text })),
  ));

type WrapFn = <T>(fn: () => Promise<T>) => Promise<T | null>;

const useCanvasAnnotationTextWrites = (wrap: WrapFn) => {
  const wrapRef = useRef(wrap);
  wrapRef.current = wrap;
  const annotationTextWriteGenerationRef = useRef(0);
  const pendingTextUpdatesRef = useRef<Map<number, PendingTextUpdate>>(new Map());
  const textDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufferedTrackerRef = useRef(createBufferedWriteTracker(ANNOTATION_TEXT_WRITE_SOURCE));

  /*
   * Unsent annotation text is an unsaved edit sync must not overwrite. The pending map can hold
   * edits for more than one canvas, so the buffered flags are recomputed from the map rather than
   * toggled per update, keeping them exact as entries are added and flushed.
   */
  const syncBufferedCanvases = useCallback(() => {
    const next = new Set<number>();
    for (const { canvasId } of pendingTextUpdatesRef.current.values()) next.add(canvasId);
    bufferedTrackerRef.current.sync(next);
  }, []);

  const clearPendingAnnotationText = useCallback(() => {
    annotationTextWriteGenerationRef.current += 1;
    if (textDebounceRef.current) {
      clearTimeout(textDebounceRef.current);
      textDebounceRef.current = null;
    }
    pendingTextUpdatesRef.current.clear();
    syncBufferedCanvases();
  }, [syncBufferedCanvases]);

  const flushPendingTextUpdates = useCallback(async () => {
    if (textDebounceRef.current) {
      clearTimeout(textDebounceRef.current);
      textDebounceRef.current = null;
    }
    const updates = Array.from(pendingTextUpdatesRef.current.values());
    pendingTextUpdatesRef.current.clear();
    syncBufferedCanvases();
    if (updates.length === 0) return;
    const generation = annotationTextWriteGenerationRef.current;
    await wrapRef.current(async () => {
      if (generation !== annotationTextWriteGenerationRef.current) return;
      await writeAnnotationTexts(updates);
    });
  }, [syncBufferedCanvases]);

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
    syncBufferedCanvases();
    if (textDebounceRef.current) clearTimeout(textDebounceRef.current);
    textDebounceRef.current = setTimeout(() => {
      textDebounceRef.current = null;
      void flushPendingTextUpdates();
    }, CANVAS_WRITE_DEBOUNCE_MS);
  }, [flushPendingTextUpdates, syncBufferedCanvases]);

  const saveAnnotationText = useCallback(async (
    canvasId: number,
    annotationId: number,
    text: string,
  ) => {
    const generation = annotationTextWriteGenerationRef.current;
    await wrap(async () => {
      if (generation !== annotationTextWriteGenerationRef.current) return;
      await trackCanvasWrite([canvasId], () =>
        updateCanvasAnnotationText(canvasId, annotationId, { content: text }));
    });
  }, [wrap]);

  return {
    saveUpdateAnnotationText,
    saveAnnotationText,
    clearPendingAnnotationText,
  };
};

export default useCanvasAnnotationTextWrites;
