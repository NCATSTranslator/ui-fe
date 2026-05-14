import { useSyncExternalStore } from 'react';

let activeHelpItemId: string | null = null;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => activeHelpItemId;

export const setActiveHelpItem = (id: string | null) => {
  activeHelpItemId = id;
  listeners.forEach(l => l());
};

/**
 * This hook is used to get the active help item id.
 * @returns The active help item id
 */
export const useActiveHelpItem = () =>
  useSyncExternalStore(subscribe, getSnapshot);
