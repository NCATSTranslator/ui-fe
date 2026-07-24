import { createListenerMiddleware } from '@reduxjs/toolkit';
import debounce from 'lodash/debounce';
import type { RootState, AppDispatch } from './store';
import { SEEN_STATUS_STORAGE_KEY } from './storageKeys';

export const createAppListenerMiddleware = () => {
  const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>();

  const persistSeenStatus = debounce((seenStatus: unknown) => {
    localStorage.setItem(SEEN_STATUS_STORAGE_KEY, JSON.stringify(seenStatus));
  }, 300);

  listenerMiddleware.startListening({
    predicate: (action, currentState, previousState) =>
      currentState.seenStatus !== previousState.seenStatus,
    effect: async (_, listenerApi) => {
      persistSeenStatus(listenerApi.getState().seenStatus);
    },
  });

  return listenerMiddleware;
};
