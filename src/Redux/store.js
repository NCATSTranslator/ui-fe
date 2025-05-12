import { configureStore } from '@reduxjs/toolkit'
import historyReducer from './historySlice';
import resultsReducer from './resultsSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    history: historyReducer,
    resultSets: resultsReducer,
    user: userReducer
  },
})

// Utility functions/variables for store.subscribe() callback function handleStoreUpdate
const getHistory = (state) => state.history.pastQueries;
let currentHistoryValue;
 
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
} 

store.subscribe(() => handleStoreUpdate());