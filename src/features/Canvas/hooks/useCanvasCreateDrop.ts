import { useCallback } from 'react';
import { useDispatch, useStore } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { addResultEntityToCanvas, resultEntityTargetFromDrag } from '@/features/Canvas/utils/addResultEntityToCanvas';
import useCreateCanvas from '@/features/Canvas/hooks/useCreateCanvas';
import { canvasSaveErrorToast } from '@/features/Core/utils/toastMessages';
import type { DraggableData } from '@/features/DragAndDrop/types/types';
import type { AppDispatch, RootState } from '@/redux/store';

/**
 * Drop handler for the "Create New Canvas" button: creates a canvas, then merges the
 * dropped result / node / edge / path into it. The new canvas becomes active and the
 * pane opens via `addCanvas`, so the user lands on the canvas holding the dropped entity.
 */
export const useCanvasCreateDrop = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const store = useStore<RootState>();
  const { handleCreateCanvas } = useCreateCanvas();

  return useCallback(async (draggedData: DraggableData) => {
    const target = resultEntityTargetFromDrag(draggedData);
    if (!target) return;
    const resultSet = getResultSetById(target.pk)(store.getState());
    if (!resultSet) return;

    // Create first: a failed create already toasts, and there is nothing to add to.
    const canvas = await handleCreateCanvas();
    if (!canvas) return;

    // The drag-end handler only catches synchronous throws, so a rejection here would
    // otherwise go unhandled and leave the new canvas empty with no feedback.
    try {
      await addResultEntityToCanvas({
        resultSet,
        target,
        canvas,
        dispatch,
        queryClient,
        addMethod: 'drag',
      });
    } catch {
      canvasSaveErrorToast();
    }
  }, [dispatch, handleCreateCanvas, queryClient, store]);
};
