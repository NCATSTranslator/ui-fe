import { useId } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useSelector } from 'react-redux';
import { selectActiveCanvas } from '@/features/Canvas/slices/canvasSlice';
import type { DraggableData, ResultEntityDragData } from '@/features/DragAndDrop/types/types';
import type { Path } from '@/features/ResultList/types/results';

export type ResultEntityDraggableData =
  | { type: 'node'; data: ResultEntityDragData }
  | { type: 'edge'; data: ResultEntityDragData }
  | { type: 'path'; data: ResultEntityDragData & { path: Path } };

/**
 * Makes a result node/edge/path draggable onto an active canvas.
 * Disabled when there is no active canvas. Unique dnd-kit ids via useId.
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

  const dragId = data
    ? `${data.type}-${data.data.id}-${uid}`
    : `disabled-result-entity-${uid}`;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    data: (data ?? undefined) as DraggableData | undefined,
    disabled,
  });

  return {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    disabled,
    canDrag: !disabled,
  };
};
