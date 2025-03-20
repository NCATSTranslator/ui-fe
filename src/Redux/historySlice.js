import { createSlice } from '@reduxjs/toolkit'

let savedState = JSON.parse(localStorage.getItem('queryHistoryState'))

const initialState = (!!savedState) ? savedState : [];

export const historySlice = createSlice({
  name: 'history',
  initialState: {
    pastQueries: initialState
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