import { useEffect, useCallback, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppDispatch } from '@/redux/store';
import {
  selectCanvases,
  setCanvases,
  replaceCanvas,
} from '@/features/Canvas/slices/canvasSlice';
import type { BackendUserCanvas, SaveStatus, CanvasLayout, GraphSubmission } from '@/features/Canvas/types/canvas';
import {
  listCanvases,
  updateCanvasMetadata,
  getCanvasGraph,
  mergeCanvasGraph,
  trashCanvases,
  trashCanvasElements,
  moveCanvasNodes,
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

const useSaveAction = (invalidate: () => void) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  const wrap = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setSaveStatus('saving');
    try {
      const result = await fn();
      invalidate();
      setSaveStatus('saved');
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

  const saveRename = useCallback(async (canvasId: number, label: string) => {
    await wrap(() => updateCanvasMetadata(canvasId, { label }));
  }, [wrap]);

  const saveLayout = useCallback(async (canvasId: number, layout: CanvasLayout) => {
    await wrap(() => updateCanvasMetadata(canvasId, { layout }));
  }, [wrap]);

  const saveMerge = useCallback(async (canvasId: number, submission: GraphSubmission) => {
    await wrap(() => applyGraphChange(canvasId, () => mergeCanvasGraph(canvasId, submission), dispatch));
  }, [dispatch, wrap]);

  const saveTrashElements = useCallback(async (canvasId: number, selection: { nodes?: number[]; edges?: number[] }) => {
    await wrap(() => applyGraphChange(canvasId, () => trashCanvasElements(canvasId, selection), dispatch));
  }, [dispatch, wrap]);

  const saveMoveNodes = useCallback(async (canvasId: number, moves: Array<{ data_id: number; x: number; y: number }>) => {
    try { await moveCanvasNodes(canvasId, { nodes: moves }); }
    catch { canvasSaveErrorToast(); }
  }, []);

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
    saveMoveNodes,
    deleteFromServer,
  };
};

export default useCanvasPersistence;
