import { createSlice, configureStore } from '@reduxjs/toolkit'

const historySlice = createSlice({
  name: 'history',
  initialState: {
    queries: []
  }, 
  reducers: {
    increment: (state, action) => {
      console.log(action.payload);
      state.queries.push(action.payload);
    }
  }
})

export const { incrementHistory } = historySlice.actions;

export const store = configureStore({
  reducer: historySlice.reducer
})

export const queryCount = state => state.queries.length;
export const queryState = state => state.queries;

// Can still subscribe to the store
store.subscribe(() => console.log(store.getState()))

// store.dispatch(incremented())
