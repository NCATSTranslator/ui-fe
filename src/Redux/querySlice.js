import { createSlice } from '@reduxjs/toolkit'


const state = {
  currentQuery: [], 
  currentResults: {},
  currentResultsQueryID: ''
} 

let savedState = JSON.parse(localStorage.getItem('reduxState'))

const persistedQuery = localStorage.getItem('reduxState') 
  ? savedState.query.currentQuery
  : []
const persistedResults = localStorage.getItem('reduxState') 
  ? savedState.query.currentResults
  : {}  
const persistedResultsID = localStorage.getItem('reduxState') 
  ? savedState.query.currentQueryResultsID
  : ''  

export const querySlice = createSlice({
  name: 'query',
  initialState: {
    currentQuery: persistedQuery, 
    currentResults: persistedResults,
    currentQueryResultsID: persistedResultsID
  }, 
  reducers: {
    setCurrentQuery: (state, action) => {
      state.currentQuery = action.payload;
    },
    setCurrentQueryResultsID: (state, action) => {
      state.currentQueryResultsID = action.payload
    },
    setCurrentResults: (state, action) => {
      state.currentResults = action.payload;
    }
  }
})

export const { setCurrentQuery, setCurrentQueryResultsID, setCurrentResults } = querySlice.actions

export const currentQuery = state => state.query.currentQuery;
export const currentResults = state => state.query.currentResults;
export const currentQueryResultsID = state => state.query.currentQueryResultsID;

export default querySlice.reducer