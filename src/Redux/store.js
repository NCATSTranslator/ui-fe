import { configureStore } from '@reduxjs/toolkit'
import historyReducer from './historySlice';
import queryReducer from './querySlice';
import resultsReducer from './resultsSlice';
import rootReducer from './rootSlice';

export const store = configureStore({
  reducer: {
    history: historyReducer,
    query: queryReducer,
    resultSets: resultsReducer,
    root: rootReducer
  },
})