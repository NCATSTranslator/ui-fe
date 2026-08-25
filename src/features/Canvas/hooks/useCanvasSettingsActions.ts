import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectActiveCanvas } from '@/features/Canvas/slices/canvasSlice';
import { exportCanvasToFile } from '@/features/Canvas/utils/canvasExportUtils';
import { useCanvasDeleteConfirmation } from '@/features/Canvas/hooks/useCanvasDeleteConfirmation';

const useCanvasSettingsActions = () => {
  const activeCanvas = useSelector(selectActiveCanvas);
  const { requestDeleteCanvas } = useCanvasDeleteConfirmation();

  const exportCanvas = useCallback(() => {
    if (!activeCanvas) return;
    exportCanvasToFile(activeCanvas);
  }, [activeCanvas]);

  const requestDeleteActiveCanvas = useCallback(() => {
    if (!activeCanvas) return;
    requestDeleteCanvas(activeCanvas.id);
  }, [activeCanvas, requestDeleteCanvas]);

  return {
    exportCanvas,
    requestDeleteActiveCanvas,
    hasActiveCanvas: !!activeCanvas,
  };
};

export default useCanvasSettingsActions;
