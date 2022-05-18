import { createSlice } from '@reduxjs/toolkit'


let savedState = JSON.parse(localStorage.getItem('reduxState'))

const persistedResults = (localStorage.getItem('reduxState') && savedState.results != null)
  ? savedState.results.currentResults
  : {}  
const persistedResultsID = (localStorage.getItem('reduxState') && savedState.results != null)
  ? savedState.results.currentQueryResultsID
  : ''  

export const resultsSlice = createSlice({
  name: 'results',
  initialState: {
    currentResults: persistedResults,
    currentQueryResultsID: persistedResultsID
  }, 
  reducers: {
    setCurrentQueryResultsID: (state, action) => {
      state.currentQueryResultsID = action.payload
    },
    setCurrentResults: (state, action) => {
      state.currentResults = action.payload;
    }
  }
})

export const { setCurrentQueryResultsID, setCurrentResults } = resultsSlice.actions

export const currentResults = state => state.results.currentResults;
export const currentQueryResultsID = state => state.results.currentQueryResultsID;

export default resultsSlice.reducer