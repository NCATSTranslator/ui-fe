import { useId } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useSelector } from 'react-redux';
import { currentUser, selectCanvasEnabled } from '@/features/UserAuth/slices/userSlice';
import type { DraggableData, ResultEntityDraggableData } from '@/features/DragAndDrop/types/types';

export type { ResultEntityDraggableData };

/**
 * Makes a result, node, edge, or path draggable onto a canvas drop target.
 * Enabled whenever a logged-in user has the canvas feature: the canvas pane then always
 * offers a drop target (the active canvas's zone, or the "Create New Canvas" pill when no
 * canvas is active), and the canvas sidebar panel adds per-canvas cards and its own create
 * button. Otherwise listeners/attributes are omitted so the element behaves as plain markup.
 * Unique dnd-kit ids via useId.
 */
export const useResultEntityDraggable = (
  data: ResultEntityDraggableData | null,
  options?: { disabled?: boolean },
) => {
  const uid = useId();
  // Plain selector rather than useUser(): this hook runs once per result row, node, and
  // edge, and useUser's loading state would add a second render to every one of them.
  const user = useSelector(currentUser);
  const canvasEnabled = useSelector(selectCanvasEnabled);
  const hasDropTarget = canvasEnabled && !!user;
  const extraDisabled = options?.disabled ?? false;
  const disabled = !data || !hasDropTarget || extraDisabled;
  const canDrag = !disabled;

  const dragId = data
    ? `${data.type}-${data.data.id}-${uid}`
    : `disabled-result-entity-${uid}`;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    data: (data ?? undefined) as DraggableData | undefined,
    disabled,
  });

  return {
    attributes: canDrag ? attributes : {},
    listeners: canDrag ? listeners : {},
    setNodeRef,
    isDragging: canDrag && isDragging,
    disabled,
    canDrag,
  };
};
