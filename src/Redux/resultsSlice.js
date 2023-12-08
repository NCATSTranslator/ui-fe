import { createSlice } from '@reduxjs/toolkit'

let savedState = JSON.parse(localStorage.getItem('reduxState'))

const persistedResults = (savedState && savedState.results != null)
  ? savedState.results.currentResults
  : {}  
const persistedResultsID = (savedState && savedState.results != null)
  ? savedState.results.currentQueryResultsID
  : ''  

export const resultsSlice = createSlice({
  name: 'results',
  initialState: {
    currentResults: persistedResults,
    currentQueryResultsID: persistedResultsID, 
    currentQueryTimestamp: null
  }, 
  reducers: {
    setCurrentQueryResultsID: (state, action) => {
      state.currentQueryResultsID = action.payload
    },
    setCurrentResults: (state, action) => {
      state.currentResults = action.payload;
    },
    setCurrentQueryTimestamp: (state, action) => {
      state.currentQueryTimestamp = action.payload;
    }
  }
})

export const { setCurrentQueryResultsID, setCurrentResults, setCurrentQueryTimestamp } = resultsSlice.actions

export const currentResults = state => state.results.currentResults;
export const currentQueryResultsID = state => state.results.currentQueryResultsID;
export const currentQueryTimestamp = state => state.results.currentQueryTimestamp;

export default resultsSlice.reducer;