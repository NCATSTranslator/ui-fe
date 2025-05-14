import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { QUERY_HISTORY_STORAGE_KEY } from '../storageKeys';
import type { RootState } from '../store';
import { QueryHistoryItem } from '../../Types/global';

export interface HistoryState {
  pastQueries: QueryHistoryItem[];
}

let savedState: unknown;
try {
  savedState = JSON.parse(localStorage.getItem(QUERY_HISTORY_STORAGE_KEY) || '[]');
} catch {
  savedState = [];
}

const initialState: HistoryState = {
  pastQueries: Array.isArray(savedState) ? savedState : [],
};

export const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    incrementHistory: (state, action: PayloadAction<QueryHistoryItem>) => {
      state.pastQueries.push(action.payload);
    },
    removeItemAtIndex: (state, action: PayloadAction<number>) => {
      state.pastQueries.splice(action.payload, 1);
    },
    setHistory: (state, action: PayloadAction<QueryHistoryItem[]>) => {
      state.pastQueries = action.payload;
    },
    clearHistory: (state) => {
      state.pastQueries = [];
    },
  },
});

export const {
  incrementHistory,
  removeItemAtIndex,
  setHistory,
  clearHistory,
} = historySlice.actions;

// Selectors
export const pastQueryCount = (state: RootState) => state.history.pastQueries.length;
export const pastQueryState = (state: RootState) => state.history.pastQueries;

export default historySlice.reducer;
