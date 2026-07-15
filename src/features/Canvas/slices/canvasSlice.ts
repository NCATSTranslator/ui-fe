import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/redux/store';
import { Canvas, CanvasNode, CanvasEdge } from '@/features/Canvas/types/canvas';

export interface CanvasState {
  canvases: Canvas[];
  activeCanvasId: number | null;
  paneOpen: boolean;
}

const initialState: CanvasState = {
  canvases: [],
  activeCanvasId: null,
  paneOpen: false,
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
        state.activeCanvasId = state.canvases.length > 0 ? state.canvases[0].id : null;
        if (!state.activeCanvasId) state.paneOpen = false;
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
    },
    openPane: (state) => {
      state.paneOpen = true;
    },
    closePane: (state) => {
      state.paneOpen = false;
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
    restoreCanvas: (state, action: PayloadAction<Canvas>) => {
      if (!state.canvases.some(c => c.id === action.payload.id)) {
        state.canvases.push(action.payload);
      }
    },
    setCanvases: (state, action: PayloadAction<Canvas[]>) => {
      state.canvases = action.payload;
      if (state.activeCanvasId && !action.payload.some(c => c.id === state.activeCanvasId)) {
        state.activeCanvasId = action.payload.length > 0 ? action.payload[0].id : null;
        if (!state.activeCanvasId) state.paneOpen = false;
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
  addCanvasNode,
  addCanvasEdge,
  removeCanvasNode,
  removeCanvasEdge,
  replaceCanvas,
  restoreCanvas,
  setCanvases,
} = canvasSlice.actions;

export { getNextCanvasLabel };

// Selectors
export const selectCanvases = (state: RootState) => state.canvas.canvases;
export const selectActiveCanvasId = (state: RootState) => state.canvas.activeCanvasId;
export const selectPaneOpen = (state: RootState) => state.canvas.paneOpen;
export const selectActiveCanvas = (state: RootState) =>
  state.canvas.canvases.find(c => c.id === state.canvas.activeCanvasId) ?? null;

export default canvasSlice.reducer;
