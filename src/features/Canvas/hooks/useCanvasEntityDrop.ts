import { useCallback } from 'react';
import { useDispatch, useStore } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { addResultEntityToCanvas } from '@/features/Canvas/utils/addResultEntityToCanvas';
import type { Canvas } from '@/features/Canvas/types/canvas';
import type { DraggableData } from '@/features/DragAndDrop/types/types';
import { isResultEntityDragData } from '@/features/DragAndDrop/types/types';
import type { AppDispatch, RootState } from '@/redux/store';

/**
 * Drop handler for result / node / edge / path entities onto an existing canvas.
 */
export const useCanvasEntityDrop = (canvas: Canvas) => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const store = useStore<RootState>();

  return useCallback((draggedData: DraggableData) => {
    if (!isResultEntityDragData(draggedData)) {
      return;
    }

    const { id, pk } = draggedData.data;
    const path = draggedData.type === 'path' ? draggedData.data.path : undefined;
    const edgeIds = draggedData.type === 'edge' ? draggedData.data.edgeIds : undefined;
    const resultSet = getResultSetById(pk)(store.getState());
    if (!resultSet) return;

    void addResultEntityToCanvas({
      resultSet,
      target: { type: draggedData.type, id, pk, path, edgeIds },
      canvas,
      dispatch,
      queryClient,
    });
  }, [canvas, dispatch, queryClient, store]);
};
