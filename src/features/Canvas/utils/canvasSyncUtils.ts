import isEqual from 'lodash/isEqual';
import type { BackendUserCanvas, Canvas } from '@/features/Canvas/types/canvas';

// ---------------------------------------------------------------------------
// Pending write tracking
// ---------------------------------------------------------------------------

/*
 * Sync must never overwrite a canvas while the user's own edits are still in flight or still
 * sitting in a debounce buffer, or a poll landing mid-drag would throw away work that has not
 * reached the server yet. Writes start in useCanvasPersistence (mounted in the canvas pane) while
 * the reconcile runs in CanvasSync (mounted at the app root), so the two cannot share component
 * state and this registry is module-level instead.
 *
 * "In flight" counts requests that have been sent. "Buffered" covers the debounced geometry and
 * annotation-text writes, which are real pending edits before any request exists — during a node
 * drag the geometry buffer refills faster than its 500ms debounce drains, so a buffered canvas is
 * also a reliable signal that the user is mid-interaction.
 */

type Listener = () => void;

const inFlightWrites = new Map<number, number>();
/* Canvases this tab has written since the last time sync reconciled them. A local write bumps the
 * server's time_updated too, so without this the canvas would look remotely changed to its own
 * author and every save would trigger a pointless graph refetch. */
const locallyWritten = new Set<number>();
/* Keyed by source ("geometry", "annotation-text") because each debounced writer owns its own
 * buffer; a single shared flag would let one writer clear a canvas another still has edits for. */
const bufferedWrites = new Map<string, Set<number>>();
const listeners = new Set<Listener>();

const notify = () => {
  for (const listener of listeners) listener();
};

/** Subscribe to pending-write changes. Returns an unsubscribe function. */
export const subscribeToCanvasWrites = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export const beginCanvasWrite = (canvasId: number) => {
  inFlightWrites.set(canvasId, (inFlightWrites.get(canvasId) ?? 0) + 1);
  notify();
};

export const endCanvasWrite = (canvasId: number) => {
  const next = (inFlightWrites.get(canvasId) ?? 0) - 1;
  if (next > 0) inFlightWrites.set(canvasId, next);
  else inFlightWrites.delete(canvasId);
  notify();
};

/** Marks a canvas as holding debounced edits from one writer that have not been sent yet. */
export const setCanvasWriteBuffered = (source: string, canvasId: number, buffered: boolean) => {
  const ids = bufferedWrites.get(source);
  if (buffered) {
    if (ids?.has(canvasId)) return;
    if (ids) ids.add(canvasId);
    else bufferedWrites.set(source, new Set([canvasId]));
  } else {
    if (!ids?.has(canvasId)) return;
    ids.delete(canvasId);
    if (ids.size === 0) bufferedWrites.delete(source);
  }
  notify();
};

const isCanvasWriteBuffered = (canvasId: number): boolean => {
  for (const ids of bufferedWrites.values()) {
    if (ids.has(canvasId)) return true;
  }
  return false;
};

export const hasPendingCanvasWrites = (canvasId: number): boolean =>
  (inFlightWrites.get(canvasId) ?? 0) > 0 || isCanvasWriteBuffered(canvasId);

export const hasAnyPendingCanvasWrites = (): boolean =>
  inFlightWrites.size > 0 || bufferedWrites.size > 0;

/** Runs a write while its canvases are marked in flight, clearing them however it settles. */
export const trackCanvasWrite = async <T>(
  canvasIds: Iterable<number>,
  run: () => Promise<T>,
): Promise<T> => {
  const ids = Array.from(new Set(canvasIds));
  for (const id of ids) beginCanvasWrite(id);
  try {
    return await run();
  } finally {
    // Marked however the write settled: a request that failed may still have reached the server.
    for (const id of ids) locallyWritten.add(id);
    for (const id of ids) endCanvasWrite(id);
  }
};

export const wasCanvasLocallyWritten = (canvasId: number): boolean =>
  locallyWritten.has(canvasId);

/*
 * Canvases that were found stale while a local write was still pending. At that moment the change
 * cannot be attributed — it may be this tab's write or another tab's — so the canvas is pinned to
 * a real graph fetch once writes settle, rather than being adopted on the strength of the local
 * write flag. This is what makes the deferral banner's promise true.
 */
const needsRefetch = new Set<number>();

export const markCanvasNeedsRefetch = (canvasId: number) => {
  needsRefetch.add(canvasId);
};

export const canvasNeedsRefetch = (canvasId: number): boolean => needsRefetch.has(canvasId);

export const clearCanvasNeedsRefetch = (canvasId: number) => {
  needsRefetch.delete(canvasId);
};

/** Forgets that this tab wrote a canvas, once sync has accounted for that write. */
export const clearCanvasLocallyWritten = (canvasId: number) => {
  locallyWritten.delete(canvasId);
};

/** Test seam: drops all tracking so cases cannot leak into one another. */
export const resetCanvasWriteTracking = () => {
  inFlightWrites.clear();
  bufferedWrites.clear();
  locallyWritten.clear();
  needsRefetch.clear();
  notify();
};

// ---------------------------------------------------------------------------
// Sync planning
// ---------------------------------------------------------------------------

/**
 * Whether two copies of a canvas hold the same graph.
 *
 * A poll cannot tell this tab's own write apart from another tab's, so sync sometimes pulls a
 * graph identical to the one already on screen — the echo of a save that just completed. Detecting
 * that lets the store take the new timestamp without replacing anything, which matters because a
 * replacement invalidates undo history and hands every memoized consumer new object identities.
 *
 * Deep equality rather than a field checklist: a checklist that forgot a field would silently drop
 * a real remote change, where deep equality can only ever err towards doing the full replacement.
 */
export const canvasGraphsEquivalent = (a: Canvas, b: Canvas): boolean =>
  isEqual(a.nodes, b.nodes)
  && isEqual(a.edges, b.edges)
  && isEqual(a.annotations, b.annotations)
  && isEqual(a.tags, b.tags);

export type CanvasSyncPlan = {
  /** Canvases whose graph should be refetched from the server now. */
  refetch: number[];
  /** Canvases changed on the server that must wait for local writes to settle first. */
  deferred: number[];
  /**
   * The subset of `deferred` with no local write to explain the change, so it is genuinely someone
   * else's. Only these are worth telling the user about: a poll landing mid-drag also defers, but
   * there the "change" is the user's own save and a banner claiming otherwise would be a lie.
   */
  deferredRemote: number[];
  /** Canvases whose new timestamp is this tab's own work: take the timestamp, keep the graph. */
  adopt: number[];
  /** Canvases already in step with the server, whose local-write flag can be dropped. */
  settled: number[];
};

/**
 * Decides what a poll result means for the canvases already in the store.
 *
 * A canvas is stale when the listed time_updated differs from the serverTimeUpdated recorded when
 * its graph was loaded. The comparison is string inequality rather than date ordering on purpose:
 * the value is an opaque server token, so a skewed client clock cannot hide a real change, and a
 * server timestamp that somehow moves backwards still reads as "different, go refetch".
 *
 * A stale canvas this tab just wrote is adopted rather than refetched: the local graph already
 * holds that edit optimistically, so the only thing missing is the timestamp it produced. Without
 * this every save would read as a remote change and pull down a graph identical to the one on
 * screen. If another tab wrote inside the window between our write and this list read, adopting
 * skips their change until the next write to that canvas — the accepted cost of not making every
 * save re-fetch, and the same window applyGraphChange already lives with.
 *
 * Canvases whose graph was never loaded are left alone — the lazy loader in useCanvasSync owns
 * those, and refetching a graph the user has not opened would be wasted work.
 */
export type CanvasSyncChecks = {
  hasPendingWrites?: (canvasId: number) => boolean;
  hadLocalWrite?: (canvasId: number) => boolean;
  mustRefetch?: (canvasId: number) => boolean;
};

export const planCanvasSync = (
  metas: BackendUserCanvas[],
  canvases: Canvas[],
  checks: CanvasSyncChecks = {},
): CanvasSyncPlan => {
  const {
    hasPendingWrites = hasPendingCanvasWrites,
    hadLocalWrite = wasCanvasLocallyWritten,
    mustRefetch = canvasNeedsRefetch,
  } = checks;
  const byId = new Map(canvases.map(canvas => [canvas.id, canvas]));
  const refetch: number[] = [];
  const deferred: number[] = [];
  const deferredRemote: number[] = [];
  const adopt: number[] = [];
  const settled: number[] = [];

  for (const meta of metas) {
    if (meta.time_deleted) continue;
    const local = byId.get(meta.id);
    if (!local || !local.graphLoaded) continue;
    if (meta.time_updated === local.serverTimeUpdated) {
      settled.push(meta.id);
      continue;
    }

    // Still writing: hold the local-write flag, since the timestamp may yet be ours.
    if (hasPendingWrites(meta.id)) {
      deferred.push(meta.id);
      if (!hadLocalWrite(meta.id)) deferredRemote.push(meta.id);
    } else if (mustRefetch(meta.id) || !hadLocalWrite(meta.id)) refetch.push(meta.id);
    else adopt.push(meta.id);
  }

  return { refetch, deferred, deferredRemote, adopt, settled };
};
