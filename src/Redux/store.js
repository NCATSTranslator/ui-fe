import { createSlice, configureStore } from '@reduxjs/toolkit'

const persistedState = localStorage.getItem('reduxState') 
  ? JSON.parse(localStorage.getItem('reduxState'))
  : {
    queries: []
  }

const historySlice = createSlice({
  name: 'history',
  initialState: {
    queries: []
  }, 
  reducers: {
    incrementHistory: (state, action) => {
      state.queries.push(action.payload);
      return state;
    },
    clearHistory: (state) => {
      state.queries = [];
      return state;
    },
    removeItemAtIndex: (state, action) => {
      let newState = state;
      console.log(action.payload);
      newState.queries.splice(action.payload, 1);
      return newState;
    }
  }
})

export const { incrementHistory, clearHistory, removeItemAtIndex } = historySlice.actions;

export const store = configureStore({
  reducer: historySlice.reducer,
  preloadedState: persistedState
})

export const queryCount = state => state.queries.length;
export const queryState = state => state.queries;


store.subscribe(() =>  
  {
    console.log(store.getState())
    localStorage.setItem('reduxState', JSON.stringify(store.getState()))
  }
)

// store.dispatch(incremented())
