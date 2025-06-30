import { createListenerMiddleware } from '@reduxjs/toolkit';
import { debounce } from 'lodash';
import type { RootState, AppDispatch } from './store';
import { SEEN_STATUS_STORAGE_KEY, QUERY_HISTORY_STORAGE_KEY} from './storageKeys';

export const createAppListenerMiddleware = () => {
  const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>();

  const persistQueryHistory = debounce((pastQueries: unknown) => {
    localStorage.setItem(QUERY_HISTORY_STORAGE_KEY, JSON.stringify(pastQueries));
  }, 300);

  const persistSeenStatus = debounce((seenStatus: unknown) => {
    localStorage.setItem(SEEN_STATUS_STORAGE_KEY, JSON.stringify(seenStatus));
  }, 300);

  listenerMiddleware.startListening({
    predicate: (action, currentState, previousState) =>
      currentState.history.pastQueries !== previousState.history.pastQueries,
    effect: async (_, listenerApi) => {
      persistQueryHistory(listenerApi.getState().history.pastQueries);
    },
  });

  listenerMiddleware.startListening({
    predicate: (action, currentState, previousState) =>
      currentState.seenStatus !== previousState.seenStatus,
    effect: async (_, listenerApi) => {
      persistSeenStatus(listenerApi.getState().seenStatus);
    },
  });

  return listenerMiddleware;
};
