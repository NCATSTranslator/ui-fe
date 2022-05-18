import { createSlice } from '@reduxjs/toolkit'


let savedState = JSON.parse(localStorage.getItem('reduxState'))

// const persistedQuery = localStorage.getItem('reduxState') 
//   ? savedState.query.currentQuery
//   : []
const persistedQuery = []

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

export const currentQuery = state => state.query.present.currentQuery;

export default querySlice.reducer