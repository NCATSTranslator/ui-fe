import { describe, expect, it } from 'vitest';
import canvasReducer, {
  removeCanvasElements,
  syncCanvasFromServer,
  adoptCanvasServerTime,
  setCanvases,
  setSyncDeferredCanvasIds,
} from '@/features/Canvas/slices/canvasSlice';
import type { Canvas } from '@/features/Canvas/types/canvas';
import {
  makeCanvas as makeCanvasBase,
  makeCanvasEdge,
  makeCanvasNode,
} from '@/features/Canvas/utils/canvasTestFixtures';

const makeCanvas = (overrides: Partial<Canvas> = {}): Canvas =>
  makeCanvasBase({ nodes: { a: makeCanvasNode('a') }, ...overrides });

const stateWith = (canvas: Canvas) => ({
  canvases: [canvas],
  activeCanvasId: canvas.id,
  paneOpen: true,
  paneMaximized: false,
  syncDeferredCanvasIds: [],
});

describe('syncCanvasFromServer', () => {
  it('replaces the canvas and bumps syncGeneration when the graph really changed', () => {
    const local = makeCanvas();
    const incoming = makeCanvas({
      nodes: { a: makeCanvasNode('a'), b: makeCanvasNode('b', { dataId: 2 }) },
      serverTimeUpdated: '2026-01-02T00:00:00.000Z',
    });

    const next = canvasReducer(stateWith(local), syncCanvasFromServer(incoming));

    expect(Object.keys(next.canvases[0].nodes)).toEqual(['a', 'b']);
    expect(next.canvases[0].syncGeneration).toBe(1);
    expect(next.canvases[0].serverTimeUpdated).toBe('2026-01-02T00:00:00.000Z');
  });

  it('takes the timestamp without bumping syncGeneration when the graph is identical', () => {
    // The echo of this tab's own write. Bumping here would throw away the user's undo history.
    const local = makeCanvas();
    const incoming = makeCanvas({ serverTimeUpdated: '2026-01-02T00:00:00.000Z' });

    const next = canvasReducer(stateWith(local), syncCanvasFromServer(incoming));

    expect(next.canvases[0].syncGeneration).toBeUndefined();
    expect(next.canvases[0].serverTimeUpdated).toBe('2026-01-02T00:00:00.000Z');
  });

  it('still picks up a label renamed elsewhere when the graph is identical', () => {
    const local = makeCanvas();
    const incoming = makeCanvas({ label: 'Renamed', serverTimeUpdated: '2026-01-02T00:00:00.000Z' });

    const next = canvasReducer(stateWith(local), syncCanvasFromServer(incoming));

    expect(next.canvases[0].label).toBe('Renamed');
    expect(next.canvases[0].syncGeneration).toBeUndefined();
  });

  it('notices a node that only moved', () => {
    const local = makeCanvas();
    const incoming = makeCanvas({ nodes: { a: makeCanvasNode('a', { x: 50, y: 60 }) } });

    const next = canvasReducer(stateWith(local), syncCanvasFromServer(incoming));

    expect(next.canvases[0].nodes.a.x).toBe(50);
    expect(next.canvases[0].syncGeneration).toBe(1);
  });

  it('notices an annotation whose text changed', () => {
    const annotation = {
      id: 'note-1', dataId: 1, text: 'before',
      position: { x: 0, y: 0 }, width: 10, height: 10,
      timeCreated: '2026-01-01T00:00:00.000Z',
    };
    const local = makeCanvas({ annotations: [annotation] });
    const incoming = makeCanvas({ annotations: [{ ...annotation, text: 'after' }] });

    const next = canvasReducer(stateWith(local), syncCanvasFromServer(incoming));

    expect(next.canvases[0].annotations[0].text).toBe('after');
    expect(next.canvases[0].syncGeneration).toBe(1);
  });

  it('ignores a canvas that is not in the store', () => {
    const local = makeCanvas();
    const next = canvasReducer(stateWith(local), syncCanvasFromServer(makeCanvas({ id: 99 })));
    expect(next.canvases).toHaveLength(1);
  });
});

describe('adoptCanvasServerTime', () => {
  it('records the server timestamp without touching the graph', () => {
    const local = makeCanvas();
    const next = canvasReducer(
      stateWith(local),
      adoptCanvasServerTime({ canvasId: 1, serverTimeUpdated: '2026-01-02T00:00:00.000Z' }),
    );

    expect(next.canvases[0].serverTimeUpdated).toBe('2026-01-02T00:00:00.000Z');
    expect(next.canvases[0].nodes).toEqual(local.nodes);
    expect(next.canvases[0].syncGeneration).toBeUndefined();
  });
});

describe('setCanvases', () => {
  it('keeps the server timestamp describing the graph it held on to', () => {
    // The incoming metadata is newer, but the retained graph still matches the old timestamp —
    // that mismatch is what tells the reconcile this canvas needs refetching.
    const local = makeCanvas();
    const incoming = makeCanvas({
      nodes: {},
      graphLoaded: false,
      serverTimeUpdated: '2026-01-02T00:00:00.000Z',
    });

    const next = canvasReducer(stateWith(local), setCanvases([incoming]));

    expect(next.canvases[0].serverTimeUpdated).toBe('2026-01-01T00:00:00.000Z');
    expect(next.canvases[0].nodes).toEqual(local.nodes);
    expect(next.canvases[0].graphLoaded).toBe(true);
  });
});

describe('setCanvases removal', () => {
  it('removes a canvas the server has stopped listing', () => {
    // Deleted in another tab: the server has listed this canvas before, so its absence is real.
    const local = makeCanvas({ serverKnown: true, graphLoaded: true });
    const next = canvasReducer(stateWith(local), setCanvases([]));
    expect(next.canvases).toEqual([]);
  });

  it('keeps a locally created canvas the server has not listed yet', () => {
    // The response predates the create, so absence here means nothing.
    const local = makeCanvas({ serverKnown: false, graphLoaded: true });
    const next = canvasReducer(stateWith(local), setCanvases([]));
    expect(next.canvases).toHaveLength(1);
  });

  it('closes the pane when the active canvas is deleted elsewhere', () => {
    const local = makeCanvas({ serverKnown: true, graphLoaded: true });
    const next = canvasReducer(stateWith(local), setCanvases([]));
    expect(next.activeCanvasId).toBeNull();
    expect(next.paneOpen).toBe(false);
  });

  it('leaves other canvases alone when one is deleted elsewhere', () => {
    const kept = makeCanvas({ id: 2, serverKnown: true });
    const state = {
      ...stateWith(makeCanvas({ serverKnown: true, graphLoaded: true })),
      canvases: [makeCanvas({ serverKnown: true, graphLoaded: true }), kept],
    };
    const next = canvasReducer(state, setCanvases([kept]));
    expect(next.canvases.map(c => c.id)).toEqual([2]);
  });
});

describe('setSyncDeferredCanvasIds', () => {
  it('keeps the same array identity when the set is unchanged', () => {
    const state = stateWith(makeCanvas());
    const first = canvasReducer(state, setSyncDeferredCanvasIds([1, 2]));
    const second = canvasReducer(first, setSyncDeferredCanvasIds([1, 2]));
    expect(second.canvases).toBe(first.canvases);
    expect(second.syncDeferredCanvasIds).toBe(first.syncDeferredCanvasIds);
  });

  it('updates when the set changes', () => {
    const state = stateWith(makeCanvas());
    const next = canvasReducer(state, setSyncDeferredCanvasIds([3]));
    expect(next.syncDeferredCanvasIds).toEqual([3]);
  });
});

describe('removeCanvasElements', () => {
  const populated = () => makeCanvas({
    nodes: {
      a: makeCanvasNode('a'),
      b: makeCanvasNode('b'),
      c: makeCanvasNode('c'),
    },
    edges: {
      ab: makeCanvasEdge('ab', 'a', 'b'),
      bc: makeCanvasEdge('bc', 'b', 'c'),
    },
  });

  it('removes several nodes and the edges connected to them in one step', () => {
    const next = canvasReducer(
      stateWith(populated()),
      removeCanvasElements({ canvasId: 1, nodeIds: ['a', 'b'], edgeIds: [] }),
    );

    expect(Object.keys(next.canvases[0].nodes)).toEqual(['c']);
    expect(Object.keys(next.canvases[0].edges)).toEqual([]);
  });

  it('removes an edge without touching the nodes it connects', () => {
    const next = canvasReducer(
      stateWith(populated()),
      removeCanvasElements({ canvasId: 1, nodeIds: [], edgeIds: ['ab'] }),
    );

    expect(Object.keys(next.canvases[0].nodes)).toEqual(['a', 'b', 'c']);
    expect(Object.keys(next.canvases[0].edges)).toEqual(['bc']);
  });

  it('leaves other canvases alone', () => {
    const next = canvasReducer(
      stateWith(populated()),
      removeCanvasElements({ canvasId: 99, nodeIds: ['a'], edgeIds: [] }),
    );

    expect(Object.keys(next.canvases[0].nodes)).toEqual(['a', 'b', 'c']);
  });
});
