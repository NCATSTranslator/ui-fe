import { useCallback, useEffect, useRef } from 'react';
import type { GraphGeometry, SaveGeometryOptions } from '@/features/Canvas/types/canvas';
import { updateCanvasGeometry } from '@/features/Canvas/utils/canvasApi';
import {
  CANVAS_WRITE_DEBOUNCE_MS,
  createBufferedWriteTracker,
} from '@/features/Canvas/utils/canvasBufferedWriteUtils';
import { trackCanvasWrite } from '@/features/Canvas/utils/canvasSyncUtils';

const GEOMETRY_WRITE_SOURCE = 'geometry';

type PendingGeometry = {
  canvasId: number;
  nodes: Map<number, NonNullable<GraphGeometry['nodes']>[number]>;
  annotations: Map<number, NonNullable<GraphGeometry['annotations']>[number]>;
};

type WrapFn = <T>(fn: () => Promise<T>) => Promise<T | null>;

const buildGeometryPayload = (pending: PendingGeometry): GraphGeometry | null => {
  const nodes = Array.from(pending.nodes.values());
  const annotations = Array.from(pending.annotations.values());
  if (nodes.length === 0 && annotations.length === 0) return null;
  return {
    ...(nodes.length > 0 && { nodes }),
    ...(annotations.length > 0 && { annotations }),
  };
};

const mergeGeometryIntoPending = (
  pending: PendingGeometry,
  geometry: GraphGeometry,
): PendingGeometry => {
  for (const node of geometry.nodes ?? []) pending.nodes.set(node.data_id, node);
  for (const annotation of geometry.annotations ?? []) {
    pending.annotations.set(annotation.id, annotation);
  }
  return pending;
};

const clearTimer = (timerRef: { current: ReturnType<typeof setTimeout> | null }) => {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
};

const writeGeometryNow = async (
  canvasId: number,
  geometry: GraphGeometry,
  generationRef: { current: number },
  wrap: WrapFn,
) => {
  if (!geometry.nodes?.length && !geometry.annotations?.length) return;
  const generation = generationRef.current;
  await wrap(async () => {
    if (generation !== generationRef.current) return;
    await trackCanvasWrite([canvasId], () => updateCanvasGeometry(canvasId, geometry));
  });
};

const useCanvasGeometryWrites = (wrap: WrapFn) => {
  const wrapRef = useRef(wrap);
  wrapRef.current = wrap;
  const geometryWriteGenerationRef = useRef(0);
  const pendingGeometryRef = useRef<PendingGeometry | null>(null);
  const geometryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufferedTrackerRef = useRef(createBufferedWriteTracker(GEOMETRY_WRITE_SOURCE));

  /* Debounced geometry is a real unsaved edit before any request exists, so sync has to see it. */
  const setPendingGeometry = useCallback((next: PendingGeometry | null) => {
    pendingGeometryRef.current = next;
    bufferedTrackerRef.current.syncSingle(next?.canvasId ?? null);
  }, []);

  const clearPendingGeometry = useCallback(() => {
    geometryWriteGenerationRef.current += 1;
    clearTimer(geometryDebounceRef);
    setPendingGeometry(null);
  }, [setPendingGeometry]);

  const flushPendingGeometry = useCallback(async () => {
    clearTimer(geometryDebounceRef);
    const pending = pendingGeometryRef.current;
    setPendingGeometry(null);
    if (!pending) return;
    const payload = buildGeometryPayload(pending);
    if (payload) await writeGeometryNow(pending.canvasId, payload, geometryWriteGenerationRef, wrapRef.current);
  }, [setPendingGeometry]);

  useEffect(() => () => {
    clearTimer(geometryDebounceRef);
    void flushPendingGeometry();
  }, [flushPendingGeometry]);

  const queueGeometrySave = useCallback((
    canvasId: number,
    geometry: GraphGeometry,
    options?: SaveGeometryOptions,
  ) => {
    if (pendingGeometryRef.current && pendingGeometryRef.current.canvasId !== canvasId) {
      void flushPendingGeometry();
    }
    const pending = pendingGeometryRef.current?.canvasId === canvasId
      ? pendingGeometryRef.current
      : { canvasId, nodes: new Map(), annotations: new Map() };
    setPendingGeometry(mergeGeometryIntoPending(pending, geometry));

    if (options?.immediate) {
      clearTimer(geometryDebounceRef);
      void flushPendingGeometry();
      return;
    }

    clearTimer(geometryDebounceRef);
    geometryDebounceRef.current = setTimeout(() => {
      geometryDebounceRef.current = null;
      void flushPendingGeometry();
    }, CANVAS_WRITE_DEBOUNCE_MS);
  }, [flushPendingGeometry, setPendingGeometry]);

  const saveGeometry = useCallback(async (
    canvasId: number,
    geometry: GraphGeometry,
    options?: SaveGeometryOptions,
  ) => {
    if (!options?.immediate) {
      queueGeometrySave(canvasId, geometry);
      return;
    }

    const pending = pendingGeometryRef.current;
    clearTimer(geometryDebounceRef);

    if (pending && pending.canvasId !== canvasId) {
      setPendingGeometry(null);
      const stalePayload = buildGeometryPayload(pending);
      if (stalePayload) {
        await writeGeometryNow(pending.canvasId, stalePayload, geometryWriteGenerationRef, wrap);
      }
    }

    let merged = geometry;
    if (pending?.canvasId === canvasId) {
      merged = buildGeometryPayload(mergeGeometryIntoPending({ ...pending }, geometry)) ?? geometry;
      setPendingGeometry(null);
    }
    await writeGeometryNow(canvasId, merged, geometryWriteGenerationRef, wrap);
  }, [queueGeometrySave, setPendingGeometry, wrap]);

  return { saveGeometry, clearPendingGeometry };
};

export default useCanvasGeometryWrites;
