import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, RefObject } from 'react';
import { HoverTarget } from '@/features/ResultList/types/results.d';

type HoverListener = () => void;

export interface HoverStore {
  getHoveredItem: () => HoverTarget;
  setHoveredItem: (target: HoverTarget) => void;
  subscribe: (listener: HoverListener) => () => void;
}

/**
 * Holds the hovered node/edge outside of React state.
 *
 * A path list renders hundreds of entities, and every one of them needs to know
 * whether it is the hovered entity. Keeping that in state (or in a context value)
 * re-renders the whole list on every pointer move between entities. With a store,
 * each entity subscribes to the one boolean it cares about, so a hover re-renders
 * only the entity being left and the one being entered.
 */
export const createHoverStore = (): HoverStore => {
  let hoveredItem: HoverTarget = null;
  const listeners = new Set<HoverListener>();

  return {
    getHoveredItem: () => hoveredItem,
    setHoveredItem: (target: HoverTarget) => {
      if (hoveredItem?.id === target?.id && hoveredItem?.type === target?.type)
        return;

      hoveredItem = target;
      for (const listener of listeners)
        listener();
    },
    subscribe: (listener: HoverListener) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
};

export interface HoverContextValue {
  store: HoverStore;
  /** True while a dnd-kit drag is in progress, during which hover updates are skipped. */
  isDragActiveRef: RefObject<boolean>;
}

// Referentially stable for the lifetime of the provider, so consuming this context
// never re-renders a component on its own.
export const HoverContext = createContext<HoverContextValue | null>(null);

const useHoverContext = (): HoverContextValue => {
  const context = useContext(HoverContext);
  if (!context)
    throw new Error('Hover hooks must be used within a PathView HoverContext provider');

  return context;
};

/**
 * Subscribes to whether one specific entity is the hovered one.
 *
 * @param id - The node or edge id to track.
 */
export const useIsEntityHovered = (id: string): boolean => {
  const { store } = useHoverContext();
  const getSnapshot = useCallback(() => store.getHoveredItem()?.id === id, [store, id]);

  return useSyncExternalStore(store.subscribe, getSnapshot);
};

/**
 * Subscribes to the hovered entity id, narrowed to the ids the caller cares about.
 * A hover outside that set resolves to null, which leaves the snapshot unchanged
 * and so doesn't re-render the caller.
 *
 * @param ids - The node or edge ids to track. Must be referentially stable.
 */
export const useHoveredEntityIdWithin = (ids: string[]): string | null => {
  const { store } = useHoverContext();
  const idSet = useMemo(() => new Set(ids), [ids]);
  const getSnapshot = useCallback(() => {
    const hoveredId = store.getHoveredItem()?.id;
    return (!!hoveredId && idSet.has(hoveredId)) ? hoveredId : null;
  }, [store, idSet]);

  return useSyncExternalStore(store.subscribe, getSnapshot);
};

/**
 * Mouse handlers that publish hover state for a single path entity. They go inert
 * during a drag so pointer movement over a large path list does no work mid-drag.
 *
 * @param isEdge - Whether the entity occupies an edge slot rather than a node slot.
 * @param id - The node or edge id the handlers report.
 */
export const useHoverHandlers = (isEdge: boolean, id: string) => {
  const { store, isDragActiveRef } = useHoverContext();

  return useMemo(() => ({
    onMouseEnter: () => {
      if (isDragActiveRef.current)
        return;

      store.setHoveredItem({ id, type: isEdge ? 'edge' : 'node' });
    },
    onMouseLeave: () => {
      if (isDragActiveRef.current)
        return;

      store.setHoveredItem(null);
    },
  }), [store, isDragActiveRef, isEdge, id]);
};
