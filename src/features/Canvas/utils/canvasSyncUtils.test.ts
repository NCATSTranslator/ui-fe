import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  beginCanvasWrite,
  endCanvasWrite,
  hasAnyPendingCanvasWrites,
  hasPendingCanvasWrites,
  clearCanvasLocallyWritten,
  markCanvasNeedsRefetch,
  planCanvasSync,
  resetCanvasWriteTracking,
  setCanvasWriteBuffered,
  subscribeToCanvasWrites,
  trackCanvasWrite,
  wasCanvasLocallyWritten,
} from '@/features/Canvas/utils/canvasSyncUtils';
import { makeCanvas, makeMeta } from '@/features/Canvas/utils/canvasTestFixtures';

beforeEach(() => {
  resetCanvasWriteTracking();
});

describe('planCanvasSync', () => {
  const empty = { refetch: [], deferred: [], deferredRemote: [], adopt: [], settled: [] };
  /* Default every check to "quiet" so each case only states the condition it is about. */
  const checks = (overrides: Parameters<typeof planCanvasSync>[2] = {}) => ({
    hasPendingWrites: () => false,
    hadLocalWrite: () => false,
    mustRefetch: () => false,
    ...overrides,
  });

  it('leaves an unchanged canvas alone', () => {
    const plan = planCanvasSync([makeMeta()], [makeCanvas()], checks());
    expect(plan).toEqual({ ...empty, settled: [1] });
  });

  it('refetches a canvas whose server timestamp moved', () => {
    const plan = planCanvasSync(
      [makeMeta({ time_updated: '2026-01-02T00:00:00.000Z' })],
      [makeCanvas()],
      checks(),
    );
    expect(plan).toEqual({ ...empty, refetch: [1] });
  });

  it('ignores the local edit clock, which reducers stamp optimistically', () => {
    // timeUpdated has run ahead of the server, but serverTimeUpdated still matches: nothing to do.
    const plan = planCanvasSync(
      [makeMeta()],
      [makeCanvas({ timeUpdated: '2030-01-01T00:00:00.000Z' })],
      checks(),
    );
    expect(plan).toEqual({ ...empty, settled: [1] });
  });

  it('treats any difference as stale, not just a newer timestamp', () => {
    const plan = planCanvasSync(
      [makeMeta({ time_updated: '2020-01-01T00:00:00.000Z' })],
      [makeCanvas()],
      checks(),
    );
    expect(plan).toEqual({ ...empty, refetch: [1] });
  });

  it('defers a stale canvas that has local writes pending, and calls it remote', () => {
    const plan = planCanvasSync(
      [makeMeta({ time_updated: '2026-01-02T00:00:00.000Z' })],
      [makeCanvas()],
      checks({ hasPendingWrites: () => true }),
    );
    expect(plan).toEqual({ ...empty, deferred: [1], deferredRemote: [1] });
  });

  it('does not call a deferral remote when this tab has written the canvas', () => {
    // A poll landing mid-drag: the change is the user's own save, so nothing to announce.
    const plan = planCanvasSync(
      [makeMeta({ time_updated: '2026-01-02T00:00:00.000Z' })],
      [makeCanvas()],
      checks({ hasPendingWrites: () => true, hadLocalWrite: () => true }),
    );
    expect(plan).toEqual({ ...empty, deferred: [1] });
  });

  it('adopts rather than refetches a timestamp this tab produced', () => {
    const plan = planCanvasSync(
      [makeMeta({ time_updated: '2026-01-02T00:00:00.000Z' })],
      [makeCanvas()],
      checks({ hadLocalWrite: () => true }),
    );
    expect(plan).toEqual({ ...empty, adopt: [1] });
  });

  it('defers rather than adopts while the local write is still in flight', () => {
    const plan = planCanvasSync(
      [makeMeta({ time_updated: '2026-01-02T00:00:00.000Z' })],
      [makeCanvas()],
      checks({ hasPendingWrites: () => true, hadLocalWrite: () => true }),
    );
    expect(plan.deferred).toEqual([1]);
    expect(plan.adopt).toEqual([]);
  });

  it('skips canvases whose graph was never loaded', () => {
    const plan = planCanvasSync(
      [makeMeta({ time_updated: '2026-01-02T00:00:00.000Z' })],
      [makeCanvas({ graphLoaded: false })],
      checks(),
    );
    expect(plan).toEqual(empty);
  });

  it('skips canvases that are not in the store yet', () => {
    const plan = planCanvasSync(
      [makeMeta({ id: 99, time_updated: '2026-01-02T00:00:00.000Z' })],
      [makeCanvas()],
      checks(),
    );
    expect(plan).toEqual(empty);
  });

  it('skips trashed canvases', () => {
    const plan = planCanvasSync(
      [makeMeta({ time_updated: '2026-01-02T00:00:00.000Z', time_deleted: '2026-01-02T00:00:00.000Z' })],
      [makeCanvas()],
      checks(),
    );
    expect(plan).toEqual(empty);
  });

  it('sorts each canvas into the right bucket', () => {
    const plan = planCanvasSync(
      [
        makeMeta({ id: 1, time_updated: '2026-01-02T00:00:00.000Z' }),
        makeMeta({ id: 2, time_updated: '2026-01-02T00:00:00.000Z' }),
        makeMeta({ id: 3, time_updated: '2026-01-02T00:00:00.000Z' }),
        makeMeta({ id: 4 }),
      ],
      [makeCanvas({ id: 1 }), makeCanvas({ id: 2 }), makeCanvas({ id: 3 }), makeCanvas({ id: 4 })],
      checks({
        hasPendingWrites: canvasId => canvasId === 2,
        hadLocalWrite: canvasId => canvasId === 3,
      }),
    );
    expect(plan).toEqual({
      refetch: [1], deferred: [2], deferredRemote: [2], adopt: [3], settled: [4],
    });
  });

  it('consults the live registry when no predicate is supplied', () => {
    beginCanvasWrite(1);
    const plan = planCanvasSync(
      [makeMeta({ time_updated: '2026-01-02T00:00:00.000Z' })],
      [makeCanvas()],
    );
    expect(plan).toEqual({ ...empty, deferred: [1], deferredRemote: [1] });
  });

  it('adopts a completed local write through the live registry', async () => {
    await trackCanvasWrite([1], async () => {});
    const plan = planCanvasSync(
      [makeMeta({ time_updated: '2026-01-02T00:00:00.000Z' })],
      [makeCanvas()],
    );
    expect(plan).toEqual({ ...empty, adopt: [1] });
  });


  it('refetches a canvas pinned by an earlier deferral, even after a local write', () => {
    const plan = planCanvasSync(
      [makeMeta({ time_updated: '2026-01-02T00:00:00.000Z' })],
      [makeCanvas()],
      checks({ hadLocalWrite: () => true, mustRefetch: () => true }),
    );
    expect(plan).toEqual({ ...empty, refetch: [1] });
  });

  it('pins a deferred canvas to a refetch once its writes settle', async () => {
    const stale = [makeMeta({ time_updated: '2026-01-02T00:00:00.000Z' })];
    const local = [makeCanvas()];
    let planWhileWriting: ReturnType<typeof planCanvasSync> | null = null;

    // A poll landing mid-write cannot tell whose change this is, so it defers and pins.
    await trackCanvasWrite([1], async () => {
      planWhileWriting = planCanvasSync(stale, local);
      for (const canvasId of planWhileWriting.deferred) markCanvasNeedsRefetch(canvasId);
    });

    expect(planWhileWriting).toEqual({ ...empty, deferred: [1], deferredRemote: [1] });
    // The completed write set the local-write flag, which on its own would mean "adopt".
    expect(wasCanvasLocallyWritten(1)).toBe(true);
    expect(planCanvasSync(stale, local)).toEqual({ ...empty, refetch: [1] });
  });

  it('refetches once the local write has been accounted for', async () => {
    await trackCanvasWrite([1], async () => {});
    clearCanvasLocallyWritten(1);
    const plan = planCanvasSync(
      [makeMeta({ time_updated: '2026-01-02T00:00:00.000Z' })],
      [makeCanvas()],
    );
    expect(plan).toEqual({ ...empty, refetch: [1] });
  });
});

describe('pending write tracking', () => {
  it('reports a canvas as pending only while a write is in flight', () => {
    expect(hasPendingCanvasWrites(1)).toBe(false);
    beginCanvasWrite(1);
    expect(hasPendingCanvasWrites(1)).toBe(true);
    endCanvasWrite(1);
    expect(hasPendingCanvasWrites(1)).toBe(false);
  });

  it('stays pending until every overlapping write finishes', () => {
    beginCanvasWrite(1);
    beginCanvasWrite(1);
    endCanvasWrite(1);
    expect(hasPendingCanvasWrites(1)).toBe(true);
    endCanvasWrite(1);
    expect(hasPendingCanvasWrites(1)).toBe(false);
  });

  it('keeps each canvas independent', () => {
    beginCanvasWrite(1);
    expect(hasPendingCanvasWrites(2)).toBe(false);
  });

  it('counts buffered edits that have not been sent yet', () => {
    setCanvasWriteBuffered('geometry', 1, true);
    expect(hasPendingCanvasWrites(1)).toBe(true);
    setCanvasWriteBuffered('geometry', 1, false);
    expect(hasPendingCanvasWrites(1)).toBe(false);
  });

  it('does not let one writer clear a buffer another writer still holds', () => {
    setCanvasWriteBuffered('geometry', 1, true);
    setCanvasWriteBuffered('annotation-text', 1, true);
    setCanvasWriteBuffered('geometry', 1, false);
    expect(hasPendingCanvasWrites(1)).toBe(true);
    setCanvasWriteBuffered('annotation-text', 1, false);
    expect(hasPendingCanvasWrites(1)).toBe(false);
  });

  it('tracks a write for the duration of the promise', async () => {
    let seenDuringWrite = false;
    await trackCanvasWrite([1], async () => {
      seenDuringWrite = hasPendingCanvasWrites(1);
    });
    expect(seenDuringWrite).toBe(true);
    expect(hasPendingCanvasWrites(1)).toBe(false);
  });

  it('clears tracking when a write rejects', async () => {
    await expect(trackCanvasWrite([1], () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    expect(hasPendingCanvasWrites(1)).toBe(false);
  });

  it('remembers a failed write, which may still have reached the server', async () => {
    await expect(trackCanvasWrite([1], () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    expect(wasCanvasLocallyWritten(1)).toBe(true);
  });

  it('records which canvases this tab has written', async () => {
    expect(wasCanvasLocallyWritten(1)).toBe(false);
    await trackCanvasWrite([1], async () => {});
    expect(wasCanvasLocallyWritten(1)).toBe(true);
    clearCanvasLocallyWritten(1);
    expect(wasCanvasLocallyWritten(1)).toBe(false);
  });

  it('tracks every canvas a batched write touches, without double counting', async () => {
    let pending: boolean[] = [];
    await trackCanvasWrite([1, 2, 1], async () => {
      pending = [hasPendingCanvasWrites(1), hasPendingCanvasWrites(2)];
    });
    expect(pending).toEqual([true, true]);
    expect(hasAnyPendingCanvasWrites()).toBe(false);
  });

  it('notifies subscribers as writes start and settle', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToCanvasWrites(listener);
    await trackCanvasWrite([1], async () => {});
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    await trackCanvasWrite([1], async () => {});
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('reports whether anything at all is pending', () => {
    expect(hasAnyPendingCanvasWrites()).toBe(false);
    setCanvasWriteBuffered('geometry', 7, true);
    expect(hasAnyPendingCanvasWrites()).toBe(true);
    resetCanvasWriteTracking();
    expect(hasAnyPendingCanvasWrites()).toBe(false);
  });
});
