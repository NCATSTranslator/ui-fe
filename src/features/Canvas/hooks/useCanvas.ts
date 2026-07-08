import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '@/redux/store';
import {
  selectActiveCanvas,
  addCanvasNode,
  addCanvasEdge,
  removeCanvasNode,
  removeCanvasEdge,
  renameCanvas,
  replaceCanvas,
} from '@/features/Canvas/slices/canvasSlice';
import type { CanvasNode, CanvasEdge, CanvasSource } from '@/features/Canvas/types/canvas';
import { mergeEntityIntoCanvas } from '@/features/Canvas/utils/canvasGraphFunctions';
import useCanvasHistory from './useCanvasHistory';
import useCanvasResultActions from './useCanvasResultActions';
import { canvasEntityAddedToast, canvasEntityAlreadyAddedToast } from '@/features/Core/utils/toastMessages';

const useCanvas = () => {
  const dispatch = useDispatch<AppDispatch>();
  const activeCanvas = useSelector(selectActiveCanvas);
  const { pushUndo, undo, redo, canUndo, canRedo } = useCanvasHistory(activeCanvas);

  const addNode = useCallback((node: CanvasNode) => {
    if (!activeCanvas) return;
    pushUndo();
    dispatch(addCanvasNode({ canvasId: activeCanvas.id, node }));
  }, [activeCanvas, dispatch, pushUndo]);

  const addEdge = useCallback((edge: CanvasEdge) => {
    if (!activeCanvas) return;
    pushUndo();
    dispatch(addCanvasEdge({ canvasId: activeCanvas.id, edge }));
  }, [activeCanvas, dispatch, pushUndo]);

  const removeNode = useCallback((nodeId: string) => {
    if (!activeCanvas) return;
    pushUndo();
    dispatch(removeCanvasNode({ canvasId: activeCanvas.id, nodeId }));
  }, [activeCanvas, dispatch, pushUndo]);

  const removeEdge = useCallback((edgeId: string) => {
    if (!activeCanvas) return;
    pushUndo();
    dispatch(removeCanvasEdge({ canvasId: activeCanvas.id, edgeId }));
  }, [activeCanvas, dispatch, pushUndo]);

  const mergeEntities = useCallback((nodes: CanvasNode[], edges: CanvasEdge[], source: CanvasSource) => {
    if (!activeCanvas) return;
    pushUndo();
    const merged = mergeEntityIntoCanvas(activeCanvas, nodes, edges, source);
    dispatch(replaceCanvas(merged));
  }, [activeCanvas, dispatch, pushUndo]);

  const rename = useCallback((title: string) => {
    if (!activeCanvas) return;
    dispatch(renameCanvas({ id: activeCanvas.id, title }));
  }, [activeCanvas, dispatch]);

  const addObject = useCallback((id: string, name: string, types: string[]) => {
    if (!activeCanvas) return;
    if (activeCanvas.nodes[id]) {
      canvasEntityAlreadyAddedToast(name);
      return;
    }
    const node: CanvasNode = { id, names: [name], types, curies: [id], sources: ['manual'] };
    const source: CanvasSource = { id: 'manual', type: 'manual', label: 'Manual' };
    mergeEntities([node], [], source);
    canvasEntityAddedToast(name, activeCanvas.title);
  }, [activeCanvas, mergeEntities]);

  const resultActions = useCanvasResultActions(activeCanvas, mergeEntities);

  return {
    activeCanvas,
    addNode,
    addEdge,
    removeNode,
    removeEdge,
    mergeEntities,
    rename,
    undo,
    redo,
    canUndo,
    canRedo,
    addObject,
    ...resultActions,
  };
};

export default useCanvas;
