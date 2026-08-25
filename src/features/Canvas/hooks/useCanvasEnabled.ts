import { useCallback, useSyncExternalStore } from 'react';
import { CANVAS_ENABLED_STORAGE_KEY } from '@/redux/storageKeys';

const DEFAULT_ENABLED = false;
const CHANGE_EVENT = 'canvas-enabled-change';

const readCanvasEnabled = (): boolean => {
  try {
    const raw = localStorage.getItem(CANVAS_ENABLED_STORAGE_KEY);
    if (raw === null) return DEFAULT_ENABLED;
    return JSON.parse(raw) === true;
  } catch {
    return DEFAULT_ENABLED;
  }
};

const subscribe = (onStoreChange: () => void) => {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === CANVAS_ENABLED_STORAGE_KEY || e.key === null) {
      onStoreChange();
    }
  };
  const handleChange = () => onStoreChange();
  window.addEventListener('storage', handleStorage);
  window.addEventListener(CHANGE_EVENT, handleChange);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(CHANGE_EVENT, handleChange);
  };
};

/**
 * Returns whether the canvas feature is enabled, persisted in localStorage (default: off).
 */
const useCanvasEnabled = (): [boolean, (enabled: boolean) => void] => {
  const canvasEnabled = useSyncExternalStore(subscribe, readCanvasEnabled, () => DEFAULT_ENABLED);

  const setCanvasEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem(CANVAS_ENABLED_STORAGE_KEY, JSON.stringify(enabled));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [canvasEnabled, setCanvasEnabled];
};

export default useCanvasEnabled;
