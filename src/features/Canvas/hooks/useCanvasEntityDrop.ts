import { useCallback } from 'react';
import { useDispatch, useStore } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { addResultEntityToCanvas, resultEntityTargetFromDrag } from '@/features/Canvas/utils/addResultEntityToCanvas';
import type { Canvas } from '@/features/Canvas/types/canvas';
import type { DraggableData } from '@/features/DragAndDrop/types/types';
import type { AppDispatch, RootState } from '@/redux/store';

/**
 * Drop handler for result / node / edge / path entities onto an existing canvas.
 * Works for any canvas, not just the active one (sidebar cards drop onto inactive canvases).
 * Ignores drops while the canvas's graph is still loading: placement is estimated against the
 * existing nodes, and a metadata-only canvas would stack the new nodes on top of its real ones.
 */
export const useCanvasEntityDrop = (canvas: Canvas) => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const store = useStore<RootState>();

  return useCallback((draggedData: DraggableData) => {
    if (!canvas.graphLoaded) return;
    const target = resultEntityTargetFromDrag(draggedData);
    if (!target) return;
    const resultSet = getResultSetById(target.pk)(store.getState());
    if (!resultSet) return;

    void addResultEntityToCanvas({
      resultSet,
      target,
      canvas,
      dispatch,
      queryClient,
      addMethod: 'drag',
    });
  }, [canvas, dispatch, queryClient, store]);
};
