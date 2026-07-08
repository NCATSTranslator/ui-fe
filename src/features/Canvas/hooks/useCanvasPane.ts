import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectActiveCanvas, selectActiveCanvasId, selectPaneOpen, togglePane, openPane, closePane, setActiveCanvas, createCanvas } from '@/features/Canvas/slices/canvasSlice';
import type { AppDispatch } from '@/redux/store';

const useCanvasPane = () => {
  const dispatch = useDispatch<AppDispatch>();
  const paneOpen = useSelector(selectPaneOpen);
  const activeCanvasId = useSelector(selectActiveCanvasId);
  const activeCanvas = useSelector(selectActiveCanvas);

  const handleTogglePane = useCallback(() => dispatch(togglePane()), [dispatch]);
  const handleOpenPane = useCallback(() => dispatch(openPane()), [dispatch]);
  const handleClosePane = useCallback(() => dispatch(closePane()), [dispatch]);
  const handleSetActiveCanvas = useCallback((id: string) => dispatch(setActiveCanvas(id)), [dispatch]);
  const handleCreateCanvas = useCallback(() => dispatch(createCanvas()), [dispatch]);

  return {
    paneOpen,
    activeCanvasId,
    activeCanvas,
    togglePane: handleTogglePane,
    openPane: handleOpenPane,
    closePane: handleClosePane,
    setActiveCanvas: handleSetActiveCanvas,
    createCanvas: handleCreateCanvas,
  };
};

export default useCanvasPane;
