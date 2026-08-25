import { useId } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useSelector } from 'react-redux';
import { selectActiveCanvas } from '@/features/Canvas/slices/canvasSlice';
import type { DraggableData, ResultEntityDraggableData } from '@/features/DragAndDrop/types/types';

export type { ResultEntityDraggableData };

/**
 * Makes a result, node, edge, or path draggable onto an active canvas.
 * Disabled when there is no active canvas — listeners/attributes are omitted so
 * drag is only enabled while a canvas is active. Unique dnd-kit ids via useId.
 */
export const useResultEntityDraggable = (
  data: ResultEntityDraggableData | null,
  options?: { disabled?: boolean },
) => {
  const uid = useId();
  const activeCanvas = useSelector(selectActiveCanvas);
  const hasActiveCanvas = !!activeCanvas;
  const extraDisabled = options?.disabled ?? false;
  const disabled = !data || !hasActiveCanvas || extraDisabled;
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
