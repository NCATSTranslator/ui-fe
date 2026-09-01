import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/redux/store';
import { Canvas, CanvasNode, CanvasEdge } from '@/features/Canvas/types/canvas';
import { canvasGraphsEquivalent } from '@/features/Canvas/utils/canvasSyncUtils';

export interface CanvasState {
  canvases: Canvas[];
  activeCanvasId: number | null;
  paneOpen: boolean;
  paneMaximized: boolean;
  /** Canvases changed on the server that sync is holding back until local writes settle. */
  syncDeferredCanvasIds: number[];
}

const initialState: CanvasState = {
  canvases: [],
  activeCanvasId: null,
  paneOpen: false,
  paneMaximized: false,
  syncDeferredCanvasIds: [],
};

const resetPaneState = (state: CanvasState) => {
  state.paneOpen = false;
  state.paneMaximized = false;
};

const getNextCanvasLabel = (canvases: Canvas[]) => {
  const existing = canvases
    .map(c => c.label)
    .filter(t => /^New Canvas \d+$/.test(t))
    .map(t => parseInt(t.replace('New Canvas ', ''), 10));
  const max = existing.length > 0 ? Math.max(...existing) : 0;
  return `New Canvas ${max + 1}`;
};

export const canvasSlice = createSlice({
  name: 'canvas',
  initialState,
  reducers: {
    addCanvas: (state, action: PayloadAction<Canvas>) => {
      state.canvases.push(action.payload);
      state.activeCanvasId = action.payload.id;
      state.paneOpen = true;
    },
    deleteCanvas: (state, action: PayloadAction<number>) => {
      state.canvases = state.canvases.filter(c => c.id !== action.payload);
      if (state.activeCanvasId === action.payload) {
        state.activeCanvasId = null;
        resetPaneState(state);
      }
    },
    renameCanvas: (state, action: PayloadAction<{ id: number; label: string }>) => {
      const canvas = state.canvases.find(c => c.id === action.payload.id);
      if (canvas) {
        canvas.label = action.payload.label;
        canvas.timeUpdated = new Date().toISOString();
      }
    },
    setActiveCanvas: (state, action: PayloadAction<number>) => {
      if (state.canvases.some(c => c.id === action.payload)) {
        state.activeCanvasId = action.payload;
        state.paneOpen = true;
      }
    },
    togglePane: (state) => {
      state.paneOpen = !state.paneOpen;
      if (!state.paneOpen) state.paneMaximized = false;
    },
    openPane: (state) => {
      state.paneOpen = true;
    },
    closePane: (state) => {
      resetPaneState(state);
      state.activeCanvasId = null;
    },
    toggleMaximizePane: (state) => {
      state.paneOpen = true;
      state.paneMaximized = !state.paneMaximized;
    },
    addCanvasNode: (state, action: PayloadAction<{ canvasId: number; node: CanvasNode }>) => {
      const canvas = state.canvases.find(c => c.id === action.payload.canvasId);
      if (canvas) {
        const { node } = action.payload;
        canvas.nodes[node.id] = node;
        canvas.timeUpdated = new Date().toISOString();
      }
    },
    addCanvasEdge: (state, action: PayloadAction<{ canvasId: number; edge: CanvasEdge }>) => {
      const canvas = state.canvases.find(c => c.id === action.payload.canvasId);
      if (canvas) {
        const { edge } = action.payload;
        if (!canvas.edges[edge.id]) {
          canvas.edges[edge.id] = edge;
          canvas.timeUpdated = new Date().toISOString();
        }
      }
    },
    removeCanvasNode: (state, action: PayloadAction<{ canvasId: number; nodeId: string }>) => {
      const canvas = state.canvases.find(c => c.id === action.payload.canvasId);
      if (canvas) {
        delete canvas.nodes[action.payload.nodeId];
        for (const [edgeId, edge] of Object.entries(canvas.edges)) {
          if (edge.subject === action.payload.nodeId || edge.object === action.payload.nodeId) {
            delete canvas.edges[edgeId];
          }
        }
        canvas.timeUpdated = new Date().toISOString();
      }
    },
    removeCanvasEdge: (state, action: PayloadAction<{ canvasId: number; edgeId: string }>) => {
      const canvas = state.canvases.find(c => c.id === action.payload.canvasId);
      if (canvas) {
        delete canvas.edges[action.payload.edgeId];
        canvas.timeUpdated = new Date().toISOString();
      }
    },
    replaceCanvas: (state, action: PayloadAction<Canvas>) => {
      const index = state.canvases.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.canvases[index] = action.payload;
      }
    },
    setCanvasAnnotations: (state, action: PayloadAction<{ canvasId: number; annotations: Canvas['annotations'] }>) => {
      const canvas = state.canvases.find(c => c.id === action.payload.canvasId);
      if (canvas) {
        canvas.annotations = action.payload.annotations;
        canvas.timeUpdated = new Date().toISOString();
      }
    },
    updateCanvasNodePositions: (
      state,
      action: PayloadAction<{ canvasId: number; positions: Array<{ nodeId: string; x: number; y: number }> }>,
    ) => {
      const canvas = state.canvases.find(c => c.id === action.payload.canvasId);
      if (!canvas) return;
      for (const { nodeId, x, y } of action.payload.positions) {
        const node = canvas.nodes[nodeId];
        if (node) {
          node.x = x;
          node.y = y;
        }
      }
      canvas.timeUpdated = new Date().toISOString();
    },
    updateCanvasLayout: (state, action: PayloadAction<{ canvasId: number; layout: Canvas['layout'] }>) => {
      const canvas = state.canvases.find(c => c.id === action.payload.canvasId);
      if (canvas) {
        canvas.layout = action.payload.layout;
        canvas.timeUpdated = new Date().toISOString();
      }
    },
    /**
     * Replaces a canvas with server state pulled by sync, rather than by a local edit. Bumping
     * syncGeneration tells consumers holding state derived from the previous graph (undo stacks,
     * cached entity detail) to drop it: those snapshots reference nodes this canvas may no longer
     * have, so replaying them would resurrect elements deleted in another tab.
     */
    syncCanvasFromServer: (state, action: PayloadAction<Canvas>) => {
      const index = state.canvases.findIndex(c => c.id === action.payload.id);
      if (index === -1) return;
      const current = state.canvases[index];
      const incoming = action.payload;

      /* The graph came back identical — this is the echo of a write made here, not someone else's
       * change. Take the metadata and the timestamp, but leave the graph and syncGeneration alone
       * so undo history survives and memoized consumers keep their object identities. */
      if (canvasGraphsEquivalent(current, incoming)) {
        current.label = incoming.label;
        current.layout = incoming.layout;
        current.serverTimeUpdated = incoming.serverTimeUpdated;
        return;
      }

      state.canvases[index] = {
        ...incoming,
        syncGeneration: (current.syncGeneration ?? 0) + 1,
      };
    },
    /**
     * Records a server timestamp for a canvas whose graph is already up to date — the timestamp
     * this tab's own write produced. Takes the token without touching the graph, so a local save
     * does not read as a remote change on the next poll.
     */
    adoptCanvasServerTime: (
      state,
      action: PayloadAction<{ canvasId: number; serverTimeUpdated: string }>,
    ) => {
      const canvas = state.canvases.find(c => c.id === action.payload.canvasId);
      if (canvas) canvas.serverTimeUpdated = action.payload.serverTimeUpdated;
    },
    /* Skips the write when the set is unchanged, so a poll finding nothing new does not hand
     * subscribers a fresh array identity every interval. */
    setSyncDeferredCanvasIds: (state, action: PayloadAction<number[]>) => {
      const next = action.payload;
      const current = state.syncDeferredCanvasIds;
      if (current.length === next.length && current.every((id, i) => id === next[i])) return;
      state.syncDeferredCanvasIds = next;
    },
    restoreCanvas: (state, action: PayloadAction<Canvas>) => {
      if (!state.canvases.some(c => c.id === action.payload.id)) {
        state.canvases.push(action.payload);
      }
    },
    setCanvases: (state, action: PayloadAction<Canvas[]>) => {
      const existingById = new Map(state.canvases.map(c => [c.id, c]));
      const incomingIds = new Set(action.payload.map(c => c.id));
      const canvases = action.payload.map(canvas => {
        const existing = existingById.get(canvas.id);
        if (
          existing &&
          (existing.graphLoaded || Object.keys(existing.nodes).length > 0)
        ) {
          // The retained graph is the one serverTimeUpdated describes, so the incoming meta's
          // timestamp must not be adopted here — keeping the old value is exactly what marks this
          // canvas stale so the sync reconcile knows to refetch its graph.
          return {
            ...canvas,
            nodes: existing.nodes,
            edges: existing.edges,
            tags: existing.tags,
            annotations: existing.annotations,
            serverTimeUpdated: existing.serverTimeUpdated,
            syncGeneration: existing.syncGeneration,
            graphLoaded: true,
          };
        }
        return canvas;
      });
      /*
       * A canvas missing from the server's list is either one created here that the server has not
       * listed yet — this response simply predates the create — or one deleted in another tab or on
       * another machine. serverKnown is what separates the two: keep the former, drop the latter.
       */
      for (const existing of state.canvases) {
        if (incomingIds.has(existing.id)) continue;
        if (!existing.serverKnown) canvases.push(existing);
      }
      state.canvases = canvases;
      /* The open canvas was deleted elsewhere. Close the pane rather than silently swapping in an
       * unrelated canvas, which reads as the graph having been replaced under the user. */
      if (state.activeCanvasId && !canvases.some(c => c.id === state.activeCanvasId)) {
        state.activeCanvasId = null;
        resetPaneState(state);
      }
    },
  },
});

export const {
  addCanvas,
  deleteCanvas,
  renameCanvas,
  setActiveCanvas,
  togglePane,
  openPane,
  closePane,
  toggleMaximizePane,
  addCanvasNode,
  addCanvasEdge,
  removeCanvasNode,
  removeCanvasEdge,
  replaceCanvas,
  syncCanvasFromServer,
  adoptCanvasServerTime,
  setSyncDeferredCanvasIds,
  restoreCanvas,
  setCanvases,
  setCanvasAnnotations,
  updateCanvasNodePositions,
  updateCanvasLayout,
} = canvasSlice.actions;

export { getNextCanvasLabel };

// Selectors
export const selectCanvases = (state: RootState) => state.canvas.canvases;
export const selectActiveCanvasId = (state: RootState) => state.canvas.activeCanvasId;
export const selectPaneOpen = (state: RootState) => state.canvas.paneOpen;
export const selectSyncDeferredCanvasIds = (state: RootState) => state.canvas.syncDeferredCanvasIds;
export const selectPaneMaximized = (state: RootState) => state.canvas.paneMaximized;
export const selectActiveCanvas = (state: RootState) =>
  state.canvas.canvases.find(c => c.id === state.canvas.activeCanvasId) ?? null;

export default canvasSlice.reducer;
