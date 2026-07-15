import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import type { AppDispatch } from '@/redux/store';
import { selectCanvases, addCanvas } from '@/features/Canvas/slices/canvasSlice';
import type { Canvas, CanvasLayout } from '@/features/Canvas/types/canvas';
import { createCanvas as createCanvasApi } from '@/features/Canvas/utils/canvasApi';
import { canvasSaveErrorToast } from '@/features/Core/utils/toastMessages';
import { getNextCanvasLabel } from '@/features/Canvas/slices/canvasSlice';

const useCreateCanvas = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const canvases = useSelector(selectCanvases);

  const handleCreateCanvas = useCallback(async (label?: string) => {
    const canvasLabel = label ?? getNextCanvasLabel(canvases);
    const layout: CanvasLayout = 'horizontal';
    try {
      const meta = await createCanvasApi(canvasLabel, layout);
      const canvas: Canvas = {
        id: meta.id,
        label: meta.label,
        layout: meta.layout,
        nodes: {},
        edges: {},
        tags: meta.data.tags,
        queryRef: meta.data.query_ref,
        resultRef: meta.data.result_ref,
        annotations: [],
        timeCreated: meta.time_created,
        timeUpdated: meta.time_updated,
      };
      dispatch(addCanvas(canvas));
      queryClient.invalidateQueries({ queryKey: ['userCanvases'] });
      return canvas;
    } catch {
      canvasSaveErrorToast();
      return null;
    }
  }, [dispatch, canvases, queryClient]);

  const createCanvas = useCallback(() => {
    handleCreateCanvas();
  }, [handleCreateCanvas]);

  return { handleCreateCanvas, createCanvas };
};

export default useCreateCanvas;
