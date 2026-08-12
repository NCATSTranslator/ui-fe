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
  BackendCanvasGraph,
  BackendUserCanvas,
  CanvasLayout,
  CreateCanvasAnnotationRequest,
  GraphSelection,
  GraphSubmission,
  SaveStatus,
} from '@/features/Canvas/types/canvas';
import {
  listCanvases,
  updateCanvasMetadata,
  getCanvasGraph,
  mergeCanvasGraph,
  trashCanvasElements,
  restoreCanvasElements,
  createCanvasAnnotation,
} from '@/features/Canvas/utils/canvasApi';
import {
  backendCanvasListToCanvasList,
  backendCanvasToCanvas,
} from '@/features/Canvas/utils/canvasMappers';
import { canvasSaveErrorToast } from '@/features/Core/utils/toastMessages';
import { currentUser } from '@/features/UserAuth/slices/userSlice';
import useCanvasGeometryWrites from '@/features/Canvas/hooks/useCanvasGeometryWrites';
import useCanvasAnnotationTextWrites from '@/features/Canvas/hooks/useCanvasAnnotationTextWrites';

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

const selectionFromSubmission = (
  submission: GraphSubmission,
  graph: BackendCanvasGraph,
): GraphSelection | null => {
  const nodeRefs = new Set(Object.keys(submission.nodes ?? {}));
  const edgeRefs = new Set(Object.keys(submission.edges ?? {}));
  const nodes = graph.nodes
    .filter(node => !node.time_deleted && nodeRefs.has(node.ref))
    .map(node => node.data_id);
  const edges = graph.edges
    .filter(edge => !edge.time_deleted && edgeRefs.has(edge.ref))
    .map(edge => edge.data_id);
  if (nodes.length === 0 && edges.length === 0) return null;
  return {
    ...(nodes.length > 0 && { nodes }),
    ...(edges.length > 0 && { edges }),
  };
};

const applyGraphChange = async (
  canvasId: number,
  apiFn: () => Promise<Awaited<ReturnType<typeof mergeCanvasGraph>>>,
  dispatch: AppDispatch,
  isStale?: () => boolean,
  onStale?: (graph: BackendCanvasGraph) => Promise<void>,
) => {
  const graph = await apiFn();
  if (isStale?.()) {
    await onStale?.(graph);
    return;
  }
  const metas = await listCanvases();
  if (isStale?.()) {
    await onStale?.(graph);
    return;
  }
  const meta = metas.find(m => m.id === canvasId);
  if (meta) {
    dispatch(replaceCanvas(backendCanvasToCanvas(meta, graph)));
  }
};

/** Serialize graph trash/restore/merge per canvas so in-flight deletes can't beat undo restores. */
const createCanvasGraphOpQueue = () => {
  const tails = new Map<number, Promise<void>>();

  return (canvasId: number, op: () => Promise<void>): Promise<void> => {
    const previous = tails.get(canvasId) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(op)
      .finally(() => {
        if (tails.get(canvasId) === next) {
          tails.delete(canvasId);
        }
      });
    tails.set(canvasId, next);
    return next;
  };
};

type GraphOpQueue = ReturnType<typeof createCanvasGraphOpQueue>;
type WrapFn = <T>(fn: () => Promise<T>) => Promise<T | null>;

type QueuedGraphApplyArgs = {
  enqueue: GraphOpQueue;
  wrap: WrapFn;
  dispatch: AppDispatch;
  generationRef: { current: number };
  canvasId: number;
  generation: number;
  apiFn: () => Promise<Awaited<ReturnType<typeof mergeCanvasGraph>>>;
  onStale?: (graph: BackendCanvasGraph) => Promise<void>;
};

const executeQueuedGraphApply = async ({
  enqueue,
  wrap,
  dispatch,
  generationRef,
  canvasId,
  generation,
  apiFn,
  onStale,
}: QueuedGraphApplyArgs) => {
  const isStale = () => generation !== generationRef.current;
  await enqueue(canvasId, async () => {
    await wrap(async () => {
      await applyGraphChange(canvasId, apiFn, dispatch, isStale, onStale);
    });
  });
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

const useSaveAction = (invalidate: () => void) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('unsaved');
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
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

const useCanvasGraphSaves = (
  wrap: ReturnType<typeof useSaveAction>['wrap'],
) => {
  const dispatch = useDispatch<AppDispatch>();
  const graphApplyGenerationRef = useRef(0);
  const enqueueGraphOpRef = useRef(createCanvasGraphOpQueue());

  const invalidatePendingGraphApplies = useCallback(() => {
    graphApplyGenerationRef.current += 1;
  }, []);

  const runGraphApply = useCallback(async (
    canvasId: number,
    generation: number,
    apiFn: () => Promise<Awaited<ReturnType<typeof mergeCanvasGraph>>>,
    onStale?: (graph: BackendCanvasGraph) => Promise<void>,
  ) => {
    await executeQueuedGraphApply({
      enqueue: enqueueGraphOpRef.current,
      wrap,
      dispatch,
      generationRef: graphApplyGenerationRef,
      canvasId,
      generation,
      apiFn,
      onStale,
    });
  }, [dispatch, wrap]);

  const saveMerge = useCallback(async (canvasId: number, submission: GraphSubmission) => {
    const generation = graphApplyGenerationRef.current;
    await runGraphApply(
      canvasId,
      generation,
      () => mergeCanvasGraph(canvasId, submission),
      async (graph) => {
        const selection = selectionFromSubmission(submission, graph);
        if (selection) await trashCanvasElements(canvasId, selection);
      },
    );
  }, [runGraphApply]);

  const saveTrashElements = useCallback(async (canvasId: number, selection: GraphSelection) => {
    const generation = graphApplyGenerationRef.current;
    await runGraphApply(
      canvasId,
      generation,
      () => trashCanvasElements(canvasId, selection),
      async () => { await restoreCanvasElements(canvasId, selection); },
    );
  }, [runGraphApply]);

  const saveRestoreElements = useCallback(async (canvasId: number, selection: GraphSelection) => {
    const generation = graphApplyGenerationRef.current;
    await runGraphApply(
      canvasId,
      generation,
      () => restoreCanvasElements(canvasId, selection),
      async () => { await trashCanvasElements(canvasId, selection); },
    );
  }, [runGraphApply]);

  return {
    saveMerge,
    saveTrashElements,
    saveRestoreElements,
    invalidatePendingGraphApplies,
  };
};

const useCanvasPersistence = () => {
  const queryClient = useQueryClient();
  const { listLoaded } = useCanvasSync();
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['userCanvases'] });
  }, [queryClient]);
  const { saveStatus, wrap } = useSaveAction(invalidate);
  const graphSaves = useCanvasGraphSaves(wrap);
  const geometryWrites = useCanvasGeometryWrites(wrap);
  const textWrites = useCanvasAnnotationTextWrites(wrap);

  const saveRename = useCallback(async (canvasId: number, label: string) => {
    await wrap(() => updateCanvasMetadata(canvasId, { label }));
  }, [wrap]);

  const saveLayout = useCallback(async (canvasId: number, layout: CanvasLayout) => {
    await wrap(() => updateCanvasMetadata(canvasId, { layout }));
  }, [wrap]);

  const saveCreateAnnotation = useCallback(async (
    canvasId: number,
    request: CreateCanvasAnnotationRequest,
  ) => wrap(() => createCanvasAnnotation(canvasId, request)), [wrap]);

  return {
    saveStatus,
    loaded: listLoaded,
    saveRename,
    saveLayout,
    saveCreateAnnotation,
    ...graphSaves,
    ...geometryWrites,
    ...textWrites,
  };
};

export default useCanvasPersistence;
