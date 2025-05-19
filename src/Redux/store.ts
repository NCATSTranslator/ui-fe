import { AnyAction, configureStore, ThunkDispatch } from '@reduxjs/toolkit';
import historyReducer from './slices/historySlice';
import resultsReducer from './slices/resultsSlice';
import seenStatusReducer from './slices/seenStatusSlice';
import userReducer from './slices/userSlice';
import { createAppListenerMiddleware } from './listenerMiddleware';

export type RootState = {
  history: ReturnType<typeof historyReducer>;
  resultSets: ReturnType<typeof resultsReducer>;
  seenStatus: ReturnType<typeof seenStatusReducer>;
  user: ReturnType<typeof userReducer>;
}
export type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>;

const listenerMiddleware = createAppListenerMiddleware();
export const store = configureStore({
  reducer: {
    history: historyReducer,
    resultSets: resultsReducer,
    seenStatus: seenStatusReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware),
});
