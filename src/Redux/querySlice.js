import { createSlice } from '@reduxjs/toolkit'

let savedState = JSON.parse(localStorage.getItem('reduxState'))

const persistedQuery = (savedState 
  && savedState.query !== undefined && savedState.query !== null 
  && savedState.query !== undefined && savedState.query !== null)
  ? savedState.query.currentQuery
  : []

export const querySlice = createSlice({
  name: 'query',
  initialState: {
    currentQuery: persistedQuery
  }, 
  reducers: {
    setCurrentQuery: 
      (state, action) => {
        state.currentQuery = action.payload;
      }
  }
})

export const { setCurrentQuery } = querySlice.actions

export const currentQuery = state => state.query.currentQuery;

export default querySlice.reducer