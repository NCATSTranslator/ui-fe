import { createSlice, configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux';
import undoable from 'redux-undo';

import historyReducer, { historySlice } from './historySlice';
import queryReducer, { querySlice } from './querySlice';

const initialState = {
  pastQueries: [],
  currentQuery: [], 
  currentResults: {},
  currentQueryResultsID: ''
} 

let savedState = JSON.parse(localStorage.getItem('reduxState'))

const persistedState = localStorage.getItem('reduxState') 
  ? JSON.parse(localStorage.getItem('reduxState'))
  : initialState

export const store = configureStore({
  reducer: {
    history: historyReducer,
    query: queryReducer
  },
})

// Utility functions/variables for store.subscribe() callback function handleStoreUpdate
function selectHistory(state) {
  return state.history.pastQueries;
}
function selectCurrentQuery(state) {
  return state.query.currentQuery;
}
let currentHistoryValue;
let currentQueryValue;

// Callback that logs state changes to console through store.subscribe() 
const handleStoreUpdate = () => {

  // Query History
  let previousHistoryValue = currentHistoryValue;
  currentHistoryValue = selectHistory(store.getState());
  if (previousHistoryValue !== currentHistoryValue
    && previousHistoryValue !== undefined) {
    console.log(
      'Query history has changed from ',
      previousHistoryValue,
      'to',
      currentHistoryValue
    )
  }

  // Current Query
  let previousQueryValue = currentQueryValue;
  currentQueryValue = selectCurrentQuery(store.getState());
  if (previousQueryValue !== currentQueryValue
    && previousQueryValue !== undefined) {
    console.log(
      'Current query has changed from ',
      previousQueryValue,
      'to',
      currentQueryValue
    )
  }
}

store.subscribe(() =>  
  {
    handleStoreUpdate()
    localStorage.setItem('reduxState', JSON.stringify(store.getState()))
  }
)
