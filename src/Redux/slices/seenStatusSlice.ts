import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SEEN_STATUS_STORAGE_KEY } from '../storageKeys';

export interface SeenStatus {
  seenEdges: string[];
  seenPaths: string[];
}

export interface SeenStatusState {
  [pk: string]: SeenStatus;
}

const loadInitialState = (): SeenStatusState => {
  try {
    const stored = localStorage.getItem(SEEN_STATUS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const initialState: SeenStatusState = loadInitialState();

const seenStatusSlice = createSlice({
  name: 'seenStatus',
  initialState,
  reducers: {
    markEdgeSeen: (state, action: PayloadAction<{ pk: string; edgeId: string }>): void => {
      const { pk, edgeId } = action.payload;
      if (!state[pk]) {
        state[pk] = { seenEdges: [], seenPaths: [] };
      }
      if (!state[pk].seenEdges.includes(edgeId)) {
        state[pk].seenEdges.push(edgeId);
      }
    },
    markEdgeUnseen: (state, action: PayloadAction<{ pk: string; edgeId: string }>) => {
      const { pk, edgeId } = action.payload;
      if (state[pk]) {
        state[pk].seenEdges = state[pk].seenEdges.filter(id => id !== edgeId);
      }
    },
    markPathSeen: (state, action: PayloadAction<{ pk: string; pathId: string }>) => {
      const { pk, pathId } = action.payload;
      if (!state[pk]) {
        state[pk] = { seenEdges: [], seenPaths: [] };
      }
      if (!state[pk].seenPaths.includes(pathId)) {
        state[pk].seenPaths.push(pathId);
      }
    },
    markPathUnseen: (state, action: PayloadAction<{ pk: string; pathId: string }>) => {
      const { pk, pathId } = action.payload;
      if (state[pk]) {
        state[pk].seenPaths = state[pk].seenPaths.filter(id => id !== pathId);
      }
    },
    resetSeenStatus: (state, action: PayloadAction<{ pk: string }>) => {
      const { pk } = action.payload;
      delete state[pk];
    },
  },
});

export const {
  markEdgeSeen,
  markEdgeUnseen,
  markPathSeen,
  markPathUnseen,
  resetSeenStatus,
} = seenStatusSlice.actions;

export default seenStatusSlice.reducer;
