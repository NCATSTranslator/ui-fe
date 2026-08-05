import { useEffect, useCallback, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppDispatch } from '@/redux/store';
import {
  selectCanvases,
  setCanvases,
  replaceCanvas,
} from '@/features/Canvas/slices/canvasSlice';
import type {
  BackendUserCanvas,
  CanvasLayout,
  CreateCanvasAnnotationRequest,
  GraphGeometry,
  GraphSelection,
  GraphSubmission,
  SaveStatus,
  SaveGeometryOptions,
} from '@/features/Canvas/types/canvas';
import {
  listCanvases,
  updateCanvasMetadata,
  getCanvasGraph,
  mergeCanvasGraph,
  trashCanvases,
  trashCanvasElements,
  updateCanvasGeometry,
  createCanvasAnnotation,
  updateCanvasAnnotationText,
} from '@/features/Canvas/utils/canvasApi';
import {
  backendCanvasListToCanvasList,
  backendCanvasToCanvas,
} from '@/features/Canvas/utils/canvasMappers';
import { canvasSaveErrorToast } from '@/features/Core/utils/toastMessages';
import { currentUser } from '@/features/UserAuth/slices/userSlice';

export const useCanvasListQuery = () => {
  const user = useSelector(currentUser);
  return useQuery({
    queryKey: ['userCanvases'],
    queryFn: () => listCanvases(),
    enabled: user !== null,
    staleTime: Infinity,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: false,
  });
};

const applyGraphChange = async (
  canvasId: number,
  apiFn: () => Promise<Awaited<ReturnType<typeof mergeCanvasGraph>>>,
  dispatch: AppDispatch,
) => {
  const graph = await apiFn();
  const metas = await listCanvases();
  const meta = metas.find(m => m.id === canvasId);
  if (meta) {
    dispatch(replaceCanvas(backendCanvasToCanvas(meta, graph)));
  }
};

const pendingGraphLoads = new Set<number>();

const canvasNeedsGraph = (canvasId: number, canvases: ReturnType<typeof selectCanvases>) => {
  const existing = canvases.find(c => c.id === canvasId);
  return !existing || !existing.graphLoaded;
};

const loadCanvasGraphIntoStore = async (
  meta: BackendUserCanvas,
  dispatch: AppDispatch,
  canvases: ReturnType<typeof selectCanvases>,
  isCancelled: () => boolean,
) => {
  if (!canvasNeedsGraph(meta.id, canvases) || pendingGraphLoads.has(meta.id)) return;

  pendingGraphLoads.add(meta.id);
  try {
    const graph = await getCanvasGraph(meta.id);
    if (isCancelled()) return;
    dispatch(replaceCanvas(backendCanvasToCanvas(meta, graph)));
  } catch {
    // graph load failed — keep metadata-only canvas
  } finally {
    pendingGraphLoads.delete(meta.id);
  }
};

export const useCanvasSync = () => {
  const dispatch = useDispatch<AppDispatch>();
  const canvases = useSelector(selectCanvases);
  const canvasesRef = useRef(canvases);
  canvasesRef.current = canvases;

  const { data: canvasMetas, isSuccess: listLoaded } = useCanvasListQuery();

  useEffect(() => {
    if (!canvasMetas) return;
    dispatch(setCanvases(backendCanvasListToCanvasList(canvasMetas)));
  }, [canvasMetas, dispatch]);

  useEffect(() => {
    if (!listLoaded || !canvasMetas?.length) return;
    let cancelled = false;
    const isCancelled = () => cancelled;

    const loadGraphs = async () => {
      const metasToLoad = canvasMetas.filter(
        meta => !meta.time_deleted && canvasNeedsGraph(meta.id, canvasesRef.current),
      );
      await Promise.all(
        metasToLoad.map(meta => loadCanvasGraphIntoStore(meta, dispatch, canvasesRef.current, isCancelled)),
      );
    };

    loadGraphs();
    return () => { cancelled = true; };
  }, [listLoaded, canvasMetas, dispatch]);

  return { listLoaded, canvases };
};

const SAVED_INDICATOR_MS = 2000;
const GEOMETRY_DEBOUNCE_MS = 500;
const ANNOTATION_TEXT_DEBOUNCE_MS = 500;

type PendingGeometry = {
  canvasId: number;
  nodes: Map<number, NonNullable<GraphGeometry['nodes']>[number]>;
  annotations: Map<number, NonNullable<GraphGeometry['annotations']>[number]>;
};

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
  for (const node of geometry.nodes ?? []) {
    pending.nodes.set(node.data_id, node);
  }
  for (const annotation of geometry.annotations ?? []) {
    pending.annotations.set(annotation.id, annotation);
  }
  return pending;
};

const useSaveAction = (invalidate: () => void) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('unsaved');
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
    }
  }, []);

  const wrap = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = null;
    }
    setSaveStatus('saving');
    try {
      const result = await fn();
      invalidate();
      setSaveStatus('saved');
      savedTimeoutRef.current = setTimeout(() => {
        setSaveStatus('unsaved');
        savedTimeoutRef.current = null;
      }, SAVED_INDICATOR_MS);
      return result;
    } catch {
      setSaveStatus('error');
      canvasSaveErrorToast();
      return null;
    }
  }, [invalidate]);

  return { saveStatus, wrap };
};

const useCanvasPersistence = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const { listLoaded } = useCanvasSync();
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['userCanvases'] });
  }, [queryClient]);
  const { saveStatus, wrap } = useSaveAction(invalidate);
  const wrapRef = useRef(wrap);
  wrapRef.current = wrap;
  const pendingGeometryRef = useRef<PendingGeometry | null>(null);
  const geometryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTextUpdatesRef = useRef<Map<number, { canvasId: number; annotationId: number; text: string }>>(
    new Map(),
  );
  const textDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushPendingGeometry = useCallback(async () => {
    if (geometryDebounceRef.current) {
      clearTimeout(geometryDebounceRef.current);
      geometryDebounceRef.current = null;
    }

    const pending = pendingGeometryRef.current;
    pendingGeometryRef.current = null;
    if (!pending) return;

    const payload = buildGeometryPayload(pending);
    if (!payload) return;

    await wrapRef.current(() => updateCanvasGeometry(pending.canvasId, payload));
  }, []);

  const flushPendingTextUpdates = useCallback(async () => {
    if (textDebounceRef.current) {
      clearTimeout(textDebounceRef.current);
      textDebounceRef.current = null;
    }

    const updates = Array.from(pendingTextUpdatesRef.current.values());
    pendingTextUpdatesRef.current.clear();
    if (updates.length === 0) return;

    await wrapRef.current(async () => {
      await Promise.all(
        updates.map(({ canvasId, annotationId, text }) =>
          updateCanvasAnnotationText(canvasId, annotationId, { content: text }),
        ),
      );
    });
  }, []);

  useEffect(() => () => {
    if (geometryDebounceRef.current) {
      clearTimeout(geometryDebounceRef.current);
    }
    if (textDebounceRef.current) {
      clearTimeout(textDebounceRef.current);
    }
    void flushPendingGeometry();
    void flushPendingTextUpdates();
  }, [flushPendingGeometry, flushPendingTextUpdates]);

  const queueGeometrySave = useCallback((
    canvasId: number,
    geometry: GraphGeometry,
    options?: SaveGeometryOptions,
  ) => {
    if (
      pendingGeometryRef.current
      && pendingGeometryRef.current.canvasId !== canvasId
    ) {
      void flushPendingGeometry();
    }

    const pending = pendingGeometryRef.current?.canvasId === canvasId
      ? pendingGeometryRef.current
      : { canvasId, nodes: new Map(), annotations: new Map() };

    pendingGeometryRef.current = mergeGeometryIntoPending(pending, geometry);

    if (options?.immediate) {
      if (geometryDebounceRef.current) {
        clearTimeout(geometryDebounceRef.current);
        geometryDebounceRef.current = null;
      }
      void flushPendingGeometry();
      return;
    }

    if (geometryDebounceRef.current) {
      clearTimeout(geometryDebounceRef.current);
    }
    geometryDebounceRef.current = setTimeout(() => {
      geometryDebounceRef.current = null;
      void flushPendingGeometry();
    }, GEOMETRY_DEBOUNCE_MS);
  }, [flushPendingGeometry]);

  const queueAnnotationTextSave = useCallback((canvasId: number, annotationId: number, text: string) => {
    pendingTextUpdatesRef.current.set(annotationId, { canvasId, annotationId, text });

    if (textDebounceRef.current) {
      clearTimeout(textDebounceRef.current);
    }
    textDebounceRef.current = setTimeout(() => {
      textDebounceRef.current = null;
      void flushPendingTextUpdates();
    }, ANNOTATION_TEXT_DEBOUNCE_MS);
  }, [flushPendingTextUpdates]);

  const saveRename = useCallback(async (canvasId: number, label: string) => {
    await wrap(() => updateCanvasMetadata(canvasId, { label }));
  }, [wrap]);

  const saveLayout = useCallback(async (canvasId: number, layout: CanvasLayout) => {
    await wrap(() => updateCanvasMetadata(canvasId, { layout }));
  }, [wrap]);

  const saveMerge = useCallback(async (canvasId: number, submission: GraphSubmission) => {
    await wrap(() => applyGraphChange(canvasId, () => mergeCanvasGraph(canvasId, submission), dispatch));
  }, [dispatch, wrap]);

  const saveTrashElements = useCallback(async (canvasId: number, selection: GraphSelection) => {
    await wrap(() => applyGraphChange(canvasId, () => trashCanvasElements(canvasId, selection), dispatch));
  }, [dispatch, wrap]);

  const saveGeometry = useCallback(async (
    canvasId: number,
    geometry: GraphGeometry,
    options?: SaveGeometryOptions,
  ) => {
    if (options?.immediate) {
      const pending = pendingGeometryRef.current;
      if (geometryDebounceRef.current) {
        clearTimeout(geometryDebounceRef.current);
        geometryDebounceRef.current = null;
      }

      if (pending && pending.canvasId !== canvasId) {
        const stalePayload = buildGeometryPayload(pending);
        pendingGeometryRef.current = null;
        if (stalePayload) {
          await wrap(() => updateCanvasGeometry(pending.canvasId, stalePayload));
        }
      }

      let merged = geometry;
      if (pending?.canvasId === canvasId) {
        merged = buildGeometryPayload(mergeGeometryIntoPending({ ...pending }, geometry)) ?? geometry;
        pendingGeometryRef.current = null;
      }

      if (!merged.nodes?.length && !merged.annotations?.length) return;
      await wrap(() => updateCanvasGeometry(canvasId, merged));
      return;
    }

    queueGeometrySave(canvasId, geometry);
  }, [queueGeometrySave, wrap]);

  const saveCreateAnnotation = useCallback(async (
    canvasId: number,
    request: CreateCanvasAnnotationRequest,
  ) => wrap(() => createCanvasAnnotation(canvasId, request)), [wrap]);

  const saveUpdateAnnotationText = useCallback((
    canvasId: number,
    annotationId: number,
    text: string,
  ) => {
    queueAnnotationTextSave(canvasId, annotationId, text);
  }, [queueAnnotationTextSave]);

  const deleteFromServer = useCallback(async (canvasId: number) => {
    try { await trashCanvases([canvasId]); invalidate(); }
    catch { canvasSaveErrorToast(); }
  }, [invalidate]);

  return {
    saveStatus,
    loaded: listLoaded,
    saveRename,
    saveLayout,
    saveMerge,
    saveTrashElements,
    saveGeometry,
    saveCreateAnnotation,
    saveUpdateAnnotationText,
    deleteFromServer,
  };
};

export default useCanvasPersistence;
