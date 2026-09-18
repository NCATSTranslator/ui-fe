import { useEffect, useMemo, useRef, RefObject } from 'react';
import { useDndMonitor } from '@dnd-kit/core';

/**
 * Tracks whether a dnd-kit drag is in progress via a ref rather than state.
 *
 * Reading drag state through `useDndContext` is not viable for large trees: its
 * context value changes on every pointer move, so every consumer re-renders for
 * the duration of the drag. The monitor only fires on lifecycle events, so
 * handlers can check the ref to opt out of work mid-drag without subscribing.
 *
 * @param onChange - Optional callback invoked when a drag starts or finishes.
 * @returns A ref that is true while a drag is active.
 */
export const useDragActiveRef = (
  onChange?: (isDragActive: boolean) => void,
): RefObject<boolean> => {
  const isDragActive = useRef(false);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const monitor = useMemo(() => {
    const update = (isActive: boolean) => {
      isDragActive.current = isActive;
      onChangeRef.current?.(isActive);
    };
    return {
      onDragStart: () => update(true),
      onDragEnd: () => update(false),
      onDragCancel: () => update(false),
    };
  }, []);

  useDndMonitor(monitor);

  return isDragActive;
};
