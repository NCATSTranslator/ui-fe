import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/redux/store';
import { Canvas, CanvasNode, CanvasEdge } from '@/features/Canvas/types/canvas';
import { mergeCanvasNode } from '@/features/Canvas/utils/canvasFunctions';

export interface CanvasState {
  canvases: Canvas[];
  activeCanvasId: string | null;
  paneOpen: boolean;
}

const initialState: CanvasState = {
  canvases: [],
  activeCanvasId: null,
  paneOpen: false,
};

const generateCanvasId = () => crypto.randomUUID().slice(0, 9);

const getNextCanvasTitle = (canvases: Canvas[]) => {
  const existing = canvases
    .map(c => c.title)
    .filter(t => /^New Canvas \d+$/.test(t))
    .map(t => parseInt(t.replace('New Canvas ', ''), 10));
  const max = existing.length > 0 ? Math.max(...existing) : 0;
  return `New Canvas ${max + 1}`;
};

export const canvasSlice = createSlice({
  name: 'canvas',
  initialState,
  reducers: {
    createCanvas: (state) => {
      const now = new Date().toISOString();
      const canvas: Canvas = {
        id: generateCanvasId(),
        title: getNextCanvasTitle(state.canvases),
        nodes: {},
        edges: {},
        annotations: [],
        nodePositions: {},
        sources: [],
        timeCreated: now,
        timeUpdated: now,
      };
      state.canvases.push(canvas);
      state.activeCanvasId = canvas.id;
      state.paneOpen = true;
    },
    deleteCanvas: (state, action: PayloadAction<string>) => {
      state.canvases = state.canvases.filter(c => c.id !== action.payload);
      if (state.activeCanvasId === action.payload) {
        state.activeCanvasId = state.canvases.length > 0 ? state.canvases[0].id : null;
        if (!state.activeCanvasId) state.paneOpen = false;
      }
    },
    renameCanvas: (state, action: PayloadAction<{ id: string; title: string }>) => {
      const canvas = state.canvases.find(c => c.id === action.payload.id);
      if (canvas) {
        canvas.title = action.payload.title;
        canvas.timeUpdated = new Date().toISOString();
      }
    },
    setActiveCanvas: (state, action: PayloadAction<string>) => {
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
    addCanvasNode: (state, action: PayloadAction<{ canvasId: string; node: CanvasNode }>) => {
      const canvas = state.canvases.find(c => c.id === action.payload.canvasId);
      if (canvas) {
        const { node } = action.payload;
        const existing = canvas.nodes[node.id];
        canvas.nodes[node.id] = existing ? mergeCanvasNode(existing, node) : node;
        canvas.timeUpdated = new Date().toISOString();
      }
    },
    addCanvasEdge: (state, action: PayloadAction<{ canvasId: string; edge: CanvasEdge }>) => {
      const canvas = state.canvases.find(c => c.id === action.payload.canvasId);
      if (canvas) {
        const { edge } = action.payload;
        if (!canvas.edges[edge.id]) {
          canvas.edges[edge.id] = edge;
          canvas.timeUpdated = new Date().toISOString();
        }
      }
    },
    removeCanvasNode: (state, action: PayloadAction<{ canvasId: string; nodeId: string }>) => {
      const canvas = state.canvases.find(c => c.id === action.payload.canvasId);
      if (canvas) {
        delete canvas.nodes[action.payload.nodeId];
        for (const [edgeId, edge] of Object.entries(canvas.edges)) {
          if (edge.subject === action.payload.nodeId || edge.object === action.payload.nodeId) {
            delete canvas.edges[edgeId];
          }
        }
        delete canvas.nodePositions[action.payload.nodeId];
        canvas.timeUpdated = new Date().toISOString();
      }
    },
    removeCanvasEdge: (state, action: PayloadAction<{ canvasId: string; edgeId: string }>) => {
      const canvas = state.canvases.find(c => c.id === action.payload.canvasId);
      if (canvas) {
        delete canvas.edges[action.payload.edgeId];
        canvas.timeUpdated = new Date().toISOString();
      }
    },
    updateNodePositions: (state, action: PayloadAction<{ canvasId: string; positions: Record<string, { x: number; y: number }> }>) => {
      const canvas = state.canvases.find(c => c.id === action.payload.canvasId);
      if (canvas) {
        canvas.nodePositions = { ...canvas.nodePositions, ...action.payload.positions };
      }
    },
    replaceCanvas: (state, action: PayloadAction<Canvas>) => {
      const index = state.canvases.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.canvases[index] = action.payload;
      }
    },
  },
});

export const {
  createCanvas,
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
  updateNodePositions,
  replaceCanvas,
} = canvasSlice.actions;

// Selectors
export const selectCanvases = (state: RootState) => state.canvas.canvases;
export const selectActiveCanvasId = (state: RootState) => state.canvas.activeCanvasId;
export const selectPaneOpen = (state: RootState) => state.canvas.paneOpen;
export const selectActiveCanvas = (state: RootState) =>
  state.canvas.canvases.find(c => c.id === state.canvas.activeCanvasId) ?? null;

export default canvasSlice.reducer;
