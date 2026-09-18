import { setCanvasWriteBuffered } from '@/features/Canvas/utils/canvasSyncUtils';

/** Shared debounce for geometry and annotation-text writes. */
export const CANVAS_WRITE_DEBOUNCE_MS = 500;

/**
 * Keeps debounced-write buffered flags in sync with pending edits for one writer source.
 * Geometry holds at most one canvas; annotation text may buffer several at once.
 */
export const createBufferedWriteTracker = (source: string) => {
  let bufferedCanvases = new Set<number>();

  const sync = (nextCanvasIds: Set<number>) => {
    for (const canvasId of bufferedCanvases) {
      if (!nextCanvasIds.has(canvasId)) setCanvasWriteBuffered(source, canvasId, false);
    }
    for (const canvasId of nextCanvasIds) {
      setCanvasWriteBuffered(source, canvasId, true);
    }
    bufferedCanvases = nextCanvasIds;
  };

  return {
    sync,
    syncSingle: (canvasId: number | null) => sync(canvasId === null ? new Set() : new Set([canvasId])),
    clear: () => sync(new Set()),
  };
};
