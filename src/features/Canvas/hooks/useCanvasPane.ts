import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectActiveCanvas, selectActiveCanvasId, selectPaneOpen, togglePane, openPane, closePane, setActiveCanvas } from '@/features/Canvas/slices/canvasSlice';
import type { AppDispatch } from '@/redux/store';

const useCanvasPane = () => {
  const dispatch = useDispatch<AppDispatch>();
  const paneOpen = useSelector(selectPaneOpen);
  const activeCanvasId = useSelector(selectActiveCanvasId);
  const activeCanvas = useSelector(selectActiveCanvas);

  const handleTogglePane = useCallback(() => dispatch(togglePane()), [dispatch]);
  const handleOpenPane = useCallback(() => dispatch(openPane()), [dispatch]);
  const handleClosePane = useCallback(() => dispatch(closePane()), [dispatch]);
  const handleSetActiveCanvas = useCallback((id: number) => dispatch(setActiveCanvas(id)), [dispatch]);

  return {
    paneOpen,
    activeCanvasId,
    activeCanvas,
    togglePane: handleTogglePane,
    openPane: handleOpenPane,
    closePane: handleClosePane,
    setActiveCanvas: handleSetActiveCanvas,
  };
};

export default useCanvasPane;
