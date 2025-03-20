import { configureStore } from '@reduxjs/toolkit'
import historyReducer from './historySlice';
import queryReducer from './querySlice';
import resultsReducer from './resultsSlice';
import rootReducer from './userSlice';

export const store = configureStore({
  reducer: {
    history: historyReducer,
    query: queryReducer,
    resultSets: resultsReducer,
    root: rootReducer
  },
})

// Utility functions/variables for store.subscribe() callback function handleStoreUpdate
const getRoot = (state) => state.root.currentRoot;
const getHistory = (state) => state.history.pastQueries;
const getCurrentQuery = (state) => state.query.currentQuery;
 
let currentRootValue;
let currentHistoryValue;
let currentQueryValue;
 
// Callback that logs state changes to console through store.subscribe() 
const handleStoreUpdate = () => {
  let previousRootValue = currentRootValue;
  currentRootValue = getRoot(store.getState());
  if (previousRootValue !== currentRootValue
    && previousRootValue !== undefined) {
    console.log(
      'Current root has changed from ',
      previousRootValue,
      'to',
      currentRootValue
    )
  }

  // Query History
  let previousHistoryValue = currentHistoryValue;
  currentHistoryValue = getHistory(store.getState());
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
  currentQueryValue = getCurrentQuery(store.getState());
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

store.subscribe(() => {
  handleStoreUpdate();
  localStorage.setItem('reduxState', JSON.stringify(store.getState()));
})