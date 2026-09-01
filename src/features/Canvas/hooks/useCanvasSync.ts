import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { AppDispatch } from '@/redux/store';
import {
  selectCanvases,
  setCanvases,
  replaceCanvas,
  syncCanvasFromServer,
  adoptCanvasServerTime,
  setSyncDeferredCanvasIds,
} from '@/features/Canvas/slices/canvasSlice';
import type { BackendUserCanvas } from '@/features/Canvas/types/canvas';
import { listCanvases, getCanvasGraph } from '@/features/Canvas/utils/canvasApi';
import {
  backendCanvasListToCanvasList,
  backendCanvasToCanvas,
} from '@/features/Canvas/utils/canvasMappers';
import {
  canvasNodeDetailQueryKeyPrefix,
  canvasEdgeDetailQueryKeyPrefix,
} from '@/features/Canvas/hooks/useCanvasEntityDetail';
import {
  planCanvasSync,
  hasPendingCanvasWrites,
  hasAnyPendingCanvasWrites,
  subscribeToCanvasWrites,
  clearCanvasLocallyWritten,
  markCanvasNeedsRefetch,
  clearCanvasNeedsRefetch,
} from '@/features/Canvas/utils/canvasSyncUtils';
import { currentUser } from '@/features/UserAuth/slices/userSlice';

/*
 * How often the canvas list is polled for edits made in another tab or on another machine. The
 * list is metadata only, so this is cheap; the graph is only refetched for canvases whose
 * time_updated actually moved. refetchIntervalInBackground is left at its default (false) so a
 * hidden tab stops polling, and refetchOnWindowFocus covers the far more common case of the user
 * coming back to a tab they left open.
 */
export const CANVAS_POLL_INTERVAL_MS = 5 * 1000; // 5s

export const useCanvasListQuery = () => {
  const user = useSelector(currentUser);
  return useQuery({
    queryKey: ['userCanvases'],
    queryFn: () => listCanvases(),
    enabled: user !== null,
    staleTime: Infinity,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: CANVAS_POLL_INTERVAL_MS,
    retry: false,
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

const pendingSyncFetches = new Set<number>();

/**
 * Pulls a canvas the server reports as changed and replaces the local copy with it.
 *
 * The pending-write check is repeated after the graph arrives because the user may have started
 * editing while it was in flight; applying server state on top of a fresh local edit would discard
 * work that has not been saved yet. Dropping this canvas's cached node and edge detail keeps the
 * inspector from showing labels belonging to the graph we just replaced.
 */
const syncCanvasGraphIntoStore = async (
  meta: BackendUserCanvas,
  dispatch: AppDispatch,
  queryClient: QueryClient,
  isCancelled: () => boolean,
) => {
  if (pendingSyncFetches.has(meta.id)) return;

  pendingSyncFetches.add(meta.id);
  try {
    const graph = await getCanvasGraph(meta.id);
    if (isCancelled() || hasPendingCanvasWrites(meta.id)) return;
    dispatch(syncCanvasFromServer(backendCanvasToCanvas(meta, graph)));
    clearCanvasLocallyWritten(meta.id);
    clearCanvasNeedsRefetch(meta.id);
    queryClient.removeQueries({ queryKey: canvasNodeDetailQueryKeyPrefix(meta.id) });
    queryClient.removeQueries({ queryKey: canvasEdgeDetailQueryKeyPrefix(meta.id) });
  } catch {
    // sync failed — keep the local copy and let the next poll retry
  } finally {
    pendingSyncFetches.delete(meta.id);
  }
};

/** Polls the canvas list and lazy-loads graphs. Mount once via CanvasSync. */
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
};

/**
 * Applies what a poll says about canvases already in the store: adopting timestamps this tab
 * produced, refetching graphs changed elsewhere, and parking canvases whose writes are still in
 * flight.
 *
 * Mounted once, by CanvasSync. Running it in several places would make it wrong, not just
 * wasteful: each copy plans against the store snapshot from its own render, so one copy adopting a
 * timestamp would leave the others still seeing a stale canvas with the local-write flag already
 * cleared — and they would each pull down a graph identical to the one on screen.
 */
export const useCanvasSyncReconcile = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const canvases = useSelector(selectCanvases);
  const canvasesRef = useRef(canvases);
  canvasesRef.current = canvases;
  const { data: canvasMetas, isSuccess: listLoaded } = useCanvasListQuery();

  /*
   * Flips whenever a local write starts or finishes, so the reconcile re-runs the moment the last
   * pending write drains — a canvas deferred because the user was mid-edit is picked up as soon as
   * they stop, rather than waiting out the rest of the poll interval.
   */
  const writesPending = useSyncExternalStore(
    subscribeToCanvasWrites,
    hasAnyPendingCanvasWrites,
    hasAnyPendingCanvasWrites,
  );

  useEffect(() => {
    if (!listLoaded || !canvasMetas?.length) return;
    let cancelled = false;
    const isCancelled = () => cancelled;

    const plan = planCanvasSync(canvasMetas, canvasesRef.current);
    // Only genuinely remote changes reach the banner; see CanvasSyncPlan.deferredRemote.
    dispatch(setSyncDeferredCanvasIds(plan.deferredRemote));

    // While a write is pending the change cannot be attributed, so pin those to a real fetch.
    for (const canvasId of plan.deferred) markCanvasNeedsRefetch(canvasId);
    // Both buckets are now accounted for, so neither can be mistaken for a local write again.
    for (const canvasId of plan.settled) {
      clearCanvasLocallyWritten(canvasId);
      clearCanvasNeedsRefetch(canvasId);
    }
    for (const canvasId of plan.adopt) {
      const meta = canvasMetas.find(item => item.id === canvasId);
      if (!meta) continue;
      clearCanvasLocallyWritten(canvasId);
      dispatch(adoptCanvasServerTime({ canvasId, serverTimeUpdated: meta.time_updated }));
    }

    const syncStaleGraphs = async () => {
      const metaById = new Map(canvasMetas.map(meta => [meta.id, meta]));
      const staleMetas = plan.refetch.map(id => metaById.get(id)).filter(meta => !!meta);
      await Promise.all(
        staleMetas.map(meta => syncCanvasGraphIntoStore(meta, dispatch, queryClient, isCancelled)),
      );
    };

    syncStaleGraphs();

    return () => { cancelled = true; };
  }, [listLoaded, canvasMetas, writesPending, dispatch, queryClient]);
};
