import { createSlice } from '@reduxjs/toolkit'

let savedState = JSON.parse(localStorage.getItem('reduxState'))

const state = 
  (localStorage.getItem('reduxState') 
  && savedState.history !== undefined && savedState.history !== null
  && savedState.history.pastQueries !== undefined && savedState.history.pastQueries !== null) 
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
    removeItemAtIndex: (state, action) => {
      let newState = state;
      console.log(action.payload)
      newState.pastQueries.splice(action.payload, 1);
      return newState;
    },
    setHistory: (state, action) => {
      return {pastQueries: action.payload};
    }
  }
})

export const { removeItemAtIndex, clearHistory, incrementHistory, setHistory } = historySlice.actions

export const pastQueryCount = state => state.history.pastQueries.length;
export const pastQueryState = state => state.history.pastQueries;

export default historySlice.reducer;