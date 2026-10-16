import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '@/redux/store';
import {
  selectActiveCanvas,
  removeCanvasElements,
  renameCanvas,
} from '@/features/Canvas/slices/canvasSlice';
import { selectionForRemovedElements } from '@/features/Canvas/utils/canvasGraphFunctions';
import useCanvasHistory from './useCanvasHistory';
import type { CanvasHistoryPersistence } from '@/features/Canvas/utils/canvasHistoryUtils';
import { trackEvent } from '@/features/Analytics/utils/dataLayer';

type UseCanvasOptions = CanvasHistoryPersistence & {
  saveRename?: (canvasId: number, label: string) => Promise<void>;
};

const useCanvas = (options: UseCanvasOptions = {}) => {
  const { saveTrashElements, saveRename } = options;
  const dispatch = useDispatch<AppDispatch>();
  const activeCanvas = useSelector(selectActiveCanvas);
  const { pushUndo, undo, redo, canUndo, canRedo } = useCanvasHistory(activeCanvas, options);

  /*
   * One undo entry and one trash request per gesture, however many elements it covers,
   * so a mass delete stays a single step for both undo and the server.
   */
  const removeElements = useCallback((nodeIds: string[], edgeIds: string[] = []) => {
    if (!activeCanvas) return;
    if (nodeIds.length === 0 && edgeIds.length === 0) return;
    const selection = selectionForRemovedElements(activeCanvas, nodeIds, edgeIds);
    pushUndo();
    dispatch(removeCanvasElements({ canvasId: activeCanvas.id, nodeIds, edgeIds }));
    if (selection) saveTrashElements?.(activeCanvas.id, selection);
  }, [activeCanvas, dispatch, pushUndo, saveTrashElements]);

  const removeNode = useCallback((nodeId: string) => {
    removeElements([nodeId]);
  }, [removeElements]);

  const rename = useCallback((label: string) => {
    if (!activeCanvas) return;
    trackEvent('canvas_renamed');
    dispatch(renameCanvas({ id: activeCanvas.id, label }));
    saveRename?.(activeCanvas.id, label);
  }, [activeCanvas, dispatch, saveRename]);

  return {
    activeCanvas, removeNode, removeElements, rename, undo, redo, canUndo, canRedo, pushUndo,
  };
};

export default useCanvas;
