import { useCallback, useEffect, useRef, type MutableRefObject, type RefObject } from 'react';
import type { GraphGeometry, SaveGeometryOptions } from '@/features/Canvas/types/canvas';
import { updateCanvasGeometry } from '@/features/Canvas/utils/canvasApi';

const GEOMETRY_DEBOUNCE_MS = 500;

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

const clearTimer = (timerRef: RefObject<ReturnType<typeof setTimeout> | null>) => {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
};

const writeGeometryNow = async (
  canvasId: number,
  geometry: GraphGeometry,
  generationRef: MutableRefObject<number>,
  wrap: WrapFn,
) => {
  if (!geometry.nodes?.length && !geometry.annotations?.length) return;
  const generation = generationRef.current;
  await wrap(async () => {
    if (generation !== generationRef.current) return;
    await updateCanvasGeometry(canvasId, geometry);
  });
};

const useCanvasGeometryWrites = (wrap: WrapFn) => {
  const wrapRef = useRef(wrap);
  wrapRef.current = wrap;
  const geometryWriteGenerationRef = useRef(0);
  const pendingGeometryRef = useRef<PendingGeometry | null>(null);
  const geometryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingGeometry = useCallback(() => {
    geometryWriteGenerationRef.current += 1;
    clearTimer(geometryDebounceRef);
    pendingGeometryRef.current = null;
  }, []);

  const flushPendingGeometry = useCallback(async () => {
    clearTimer(geometryDebounceRef);
    const pending = pendingGeometryRef.current;
    pendingGeometryRef.current = null;
    if (!pending) return;
    const payload = buildGeometryPayload(pending);
    if (payload) await writeGeometryNow(pending.canvasId, payload, geometryWriteGenerationRef, wrapRef.current);
  }, []);

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
    pendingGeometryRef.current = mergeGeometryIntoPending(pending, geometry);

    if (options?.immediate) {
      clearTimer(geometryDebounceRef);
      void flushPendingGeometry();
      return;
    }

    clearTimer(geometryDebounceRef);
    geometryDebounceRef.current = setTimeout(() => {
      geometryDebounceRef.current = null;
      void flushPendingGeometry();
    }, GEOMETRY_DEBOUNCE_MS);
  }, [flushPendingGeometry]);

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
      pendingGeometryRef.current = null;
      const stalePayload = buildGeometryPayload(pending);
      if (stalePayload) {
        await writeGeometryNow(pending.canvasId, stalePayload, geometryWriteGenerationRef, wrap);
      }
    }

    let merged = geometry;
    if (pending?.canvasId === canvasId) {
      merged = buildGeometryPayload(mergeGeometryIntoPending({ ...pending }, geometry)) ?? geometry;
      pendingGeometryRef.current = null;
    }
    await writeGeometryNow(canvasId, merged, geometryWriteGenerationRef, wrap);
  }, [queueGeometrySave, wrap]);

  return { saveGeometry, clearPendingGeometry };
};

export default useCanvasGeometryWrites;
