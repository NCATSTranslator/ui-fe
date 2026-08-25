import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectActiveCanvas, selectActiveCanvasId, selectPaneOpen, selectPaneMaximized, togglePane, openPane, closePane, toggleMaximizePane, setActiveCanvas } from '@/features/Canvas/slices/canvasSlice';
import type { AppDispatch } from '@/redux/store';

const useCanvasPane = () => {
  const dispatch = useDispatch<AppDispatch>();
  const paneOpen = useSelector(selectPaneOpen);
  const paneMaximized = useSelector(selectPaneMaximized);
  const activeCanvasId = useSelector(selectActiveCanvasId);
  const activeCanvas = useSelector(selectActiveCanvas);

  const handleTogglePane = useCallback(() => dispatch(togglePane()), [dispatch]);
  const handleOpenPane = useCallback(() => dispatch(openPane()), [dispatch]);
  const handleClosePane = useCallback(() => dispatch(closePane()), [dispatch]);
  const handleToggleMaximizePane = useCallback(() => dispatch(toggleMaximizePane()), [dispatch]);
  const handleSetActiveCanvas = useCallback((id: number) => dispatch(setActiveCanvas(id)), [dispatch]);

  return {
    paneOpen,
    paneMaximized,
    activeCanvasId,
    activeCanvas,
    togglePane: handleTogglePane,
    openPane: handleOpenPane,
    closePane: handleClosePane,
    toggleMaximizePane: handleToggleMaximizePane,
    setActiveCanvas: handleSetActiveCanvas,
  };
};

export default useCanvasPane;
