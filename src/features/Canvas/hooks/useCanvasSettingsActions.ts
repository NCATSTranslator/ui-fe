import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectActiveCanvas } from '@/features/Canvas/slices/canvasSlice';
import { exportCanvasToCSVFile } from '@/features/Canvas/utils/canvasExportUtils';
import { exportCanvasToPNGFile } from '@/features/Canvas/utils/canvasImageExportUtils';
import { canvasHasExportableGraph } from '@/features/Canvas/utils/canvasFunctions';
import { useCanvasDeleteConfirmation } from '@/features/Canvas/hooks/useCanvasDeleteConfirmation';
import { useCanvasGraphAreaRef } from '@/features/Canvas/components/CanvasGraph/CanvasGraphAreaContext';
import { canvasImageExportErrorToast } from '@/features/Core/utils/toastMessages';

const useCanvasSettingsActions = () => {
  const activeCanvas = useSelector(selectActiveCanvas);
  const { requestDeleteCanvas } = useCanvasDeleteConfirmation();
  const graphAreaRef = useCanvasGraphAreaRef();
  const [isExportingImage, setIsExportingImage] = useState(false);

  const hasMountedViewport = !!graphAreaRef?.current?.querySelector('.react-flow__viewport');
  const canExportImage = !!activeCanvas
    && canvasHasExportableGraph(activeCanvas)
    && hasMountedViewport
    && !isExportingImage;

  const exportCanvasCSV = useCallback(() => {
    if (!activeCanvas) return;
    exportCanvasToCSVFile(activeCanvas);
  }, [activeCanvas]);

  const exportCanvasImage = useCallback(async () => {
    const graphArea = graphAreaRef?.current;
    if (!activeCanvas || !graphArea?.querySelector('.react-flow__viewport')) return;

    setIsExportingImage(true);
    try {
      await exportCanvasToPNGFile(graphArea, activeCanvas.label);
    } catch (error) {
      console.error('Canvas image export failed', error);
      canvasImageExportErrorToast();
    } finally {
      setIsExportingImage(false);
    }
  }, [activeCanvas, graphAreaRef]);

  const requestDeleteActiveCanvas = useCallback(() => {
    if (!activeCanvas) return;
    requestDeleteCanvas(activeCanvas.id);
  }, [activeCanvas, requestDeleteCanvas]);

  return {
    exportCanvasCSV,
    exportCanvasImage,
    canExportImage,
    requestDeleteActiveCanvas,
    hasActiveCanvas: !!activeCanvas,
  };
};

export default useCanvasSettingsActions;
