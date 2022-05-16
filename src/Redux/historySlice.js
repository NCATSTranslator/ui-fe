import { createSlice } from '@reduxjs/toolkit'

const initialState = []

const state = (localStorage.getItem('reduxState') && JSON.parse(localStorage.getItem('reduxState')).pastQueries != undefined)
  ? JSON.parse(localStorage.getItem('reduxState')).pastQueries
  : initialState

export const historySlice = createSlice({
  name: 'history',
  initialState: {
    pastQueries: initialState
  }, 
  reducers: {
    incrementHistory: (state, action) => {
      console.log(state);
      console.log(action.payload);
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