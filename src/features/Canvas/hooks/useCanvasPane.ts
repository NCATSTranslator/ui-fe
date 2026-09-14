import { useCallback } from 'react';
import { useSelector, useDispatch, useStore } from 'react-redux';
import { selectActiveCanvas, selectActiveCanvasId, selectPaneOpen, selectPaneMaximized, togglePane, openPane, closePane, toggleMaximizePane, setActiveCanvas } from '@/features/Canvas/slices/canvasSlice';
import type { AppDispatch, RootState } from '@/redux/store';
import { trackEvent } from '@/features/Analytics/utils/dataLayer';

const useCanvasPane = () => {
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();
  const paneOpen = useSelector(selectPaneOpen);
  const paneMaximized = useSelector(selectPaneMaximized);
  const activeCanvasId = useSelector(selectActiveCanvasId);
  const activeCanvas = useSelector(selectActiveCanvas);

  // The reducers flip state, so the tracked value is what the pane is about to
  // become. Reading the store at call time rather than closing over the
  // selector values keeps these handlers stable across pane changes.
  const handleTogglePane = useCallback(() => {
    trackEvent('canvas_pane_toggled', { pane_state: selectPaneOpen(store.getState()) ? 'closed' : 'open' });
    dispatch(togglePane());
  }, [dispatch, store]);
  const handleOpenPane = useCallback(() => {
    trackEvent('canvas_pane_toggled', { pane_state: 'open' });
    dispatch(openPane());
  }, [dispatch]);
  const handleClosePane = useCallback(() => {
    trackEvent('canvas_pane_toggled', { pane_state: 'closed' });
    dispatch(closePane());
  }, [dispatch]);
  const handleToggleMaximizePane = useCallback(() => {
    trackEvent('canvas_pane_toggled', { pane_state: selectPaneMaximized(store.getState()) ? 'restored' : 'maximized' });
    dispatch(toggleMaximizePane());
  }, [dispatch, store]);
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
