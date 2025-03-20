import { configureStore } from '@reduxjs/toolkit'
import historyReducer from './historySlice';
import queryReducer from './querySlice';
import resultsReducer from './resultsSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    history: historyReducer,
    query: queryReducer,
    resultSets: resultsReducer,
    user: userReducer
  },
})

// Utility functions/variables for store.subscribe() callback function handleStoreUpdate
const getHistory = (state) => state.history.pastQueries;
const getCurrentQuery = (state) => state.query.currentQuery;
 
let currentHistoryValue;
let currentQueryValue;
 
// Callback that logs state changes to console through store.subscribe() 
const handleStoreUpdate = () => {
  // Query History
  let previousHistoryValue = currentHistoryValue;
  currentHistoryValue = getHistory(store.getState());
  if (previousHistoryValue !== currentHistoryValue
    && previousHistoryValue !== undefined) {
    console.log('Query history has changed from ', previousHistoryValue, 'to', currentHistoryValue);
    localStorage.setItem('queryHistoryState', JSON.stringify(getHistory(store.getState())));
  }

  // Current Query
  let previousQueryValue = currentQueryValue;
  currentQueryValue = getCurrentQuery(store.getState());
  if (previousQueryValue !== currentQueryValue
    && previousQueryValue !== undefined) {
    console.log('Current query has changed from ', previousQueryValue, 'to', currentQueryValue);
  }
} 

store.subscribe(() => handleStoreUpdate());