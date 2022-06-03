import { createSlice } from '@reduxjs/toolkit'

let savedState = JSON.parse(localStorage.getItem('reduxState'))

const state = 
  (localStorage.getItem('reduxState') 
  && savedState.history != undefined
  && savedState.history.pastQueries != undefined)
    ? savedState.history.pastQueries
    : []

export const historySlice = createSlice({
  name: 'history',
  initialState: {
    pastQueries: state
  }, 
  reducers: {
    incrementHistory: (state, action) => {
      return {pastQueries: [...state.pastQueries, action.payload]};
    },
    clearHistory: (state) => {
      state.pastQueries = [];
      return state;
    },
    removeItemAtIndex: (state, action) => {
      let newState = state;
      newState.pastQueries.splice(action.payload, 1);
      return newState;
    },
  }
})

export const { removeItemAtIndex, clearHistory, incrementHistory } = historySlice.actions

export const pastQueryCount = state => state.history.pastQueries.length;
export const pastQueryState = state => state.history.pastQueries;

export default historySlice.reducer;