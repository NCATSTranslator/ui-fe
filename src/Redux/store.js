import { createSlice, configureStore } from '@reduxjs/toolkit'

const persistedState = localStorage.getItem('reduxState') 
  ? JSON.parse(localStorage.getItem('reduxState'))
  : {
    pastQueries: [],
    currentQuery: [], 
    currentResults: {}
  }

const historySlice = createSlice({
  name: 'history',
  initialState: {
    pastQueries: [],
    currentQuery: [], 
    currentResults: {}
  }, 
  reducers: {
    incrementHistory: (state, action) => {
      state.pastQueries.push(action.payload);
      return state;
    },
    clearHistory: (state) => {
      state.pastQueries = [];
      return state;
    },
    removeItemAtIndex: (state, action) => {
      let newState = state;
      newState.pastQueries.splice(action.payload, 1);
      return newState;
    },
    setCurrentQuery: (state, action) => {
      state.currentQuery = action.payload;
    }
  }
})

export const { incrementHistory, clearHistory, removeItemAtIndex, setCurrentQuery } = historySlice.actions;

export const store = configureStore({
  reducer: historySlice.reducer,
  preloadedState: persistedState
})

export const pastQueryCount = state => state.pastQueries.length;
export const pastQueryState = state => state.pastQueries;
export const currentQuery = state => state.currentQuery;
export const currentResults = state => state.currentResults;


function selectHistory(state) {
  return state.pastQueries;
}
function selectCurrentQuery(state) {
  return state.currentQuery;
}
let currentHistoryValue;
let currentQueryValue;
const handleStoreUpdate = () => {

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

// store.dispatch(incremented())