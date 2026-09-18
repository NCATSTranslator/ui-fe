import { describe, it, expect, vi } from 'vitest';
import { createHoverStore } from './hoverHooks';

describe('createHoverStore', () => {
  it('reports the hovered entity to subscribers', () => {
    const store = createHoverStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.setHoveredItem({ id: 'n-1', type: 'node' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getHoveredItem()).toEqual({ id: 'n-1', type: 'node' });
  });

  it('ignores a repeat of the entity already hovered', () => {
    const store = createHoverStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.setHoveredItem({ id: 'n-1', type: 'node' });
    store.setHoveredItem({ id: 'n-1', type: 'node' });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('notifies when the same id changes slot type', () => {
    const store = createHoverStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.setHoveredItem({ id: 'x-1', type: 'node' });
    store.setHoveredItem({ id: 'x-1', type: 'edge' });

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('ignores clearing when nothing is hovered', () => {
    const store = createHoverStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.setHoveredItem(null);

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops notifying once a subscriber unsubscribes', () => {
    const store = createHoverStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.setHoveredItem({ id: 'n-1', type: 'node' });

    expect(listener).not.toHaveBeenCalled();
  });
});
