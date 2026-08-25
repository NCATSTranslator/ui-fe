import { useCallback, MouseEvent } from 'react';
import { useCanvasContextMenu } from '@/features/Canvas/components/CanvasContextMenu/CanvasContextMenu';
import { useResultEntityDraggable } from '@/features/DragAndDrop/hooks/useResultEntityDraggable';

/**
 * Drag + context-menu wiring for adding a full result to the active canvas.
 */
export const useResultCanvasDrag = (
  resultId: string | undefined,
  pk: string | null | undefined,
) => {
  const { openMenu } = useCanvasContextMenu();
  const resultDragData = resultId && pk
    ? { type: 'result' as const, data: { id: resultId, pk } }
    : null;
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    canDrag,
  } = useResultEntityDraggable(resultDragData);

  const onContextMenu = useCallback((e: MouseEvent) => {
    if (!resultId || !pk) return;
    e.preventDefault();
    e.stopPropagation();
    openMenu({ type: 'result', id: resultId, pk, position: { x: e.clientX, y: e.clientY } });
  }, [openMenu, pk, resultId]);

  return {
    setNodeRef,
    attributes,
    listeners,
    isDragging,
    canDrag,
    onContextMenu,
  };
};
