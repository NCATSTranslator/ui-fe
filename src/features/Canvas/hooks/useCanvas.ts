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
import type { CanvasNode, CanvasEdge, GraphSubmission } from '@/features/Canvas/types/canvas';
import { mergeEntityIntoCanvas } from '@/features/Canvas/utils/canvasGraphFunctions';
import { canvasNodesToGraphSubmission } from '@/features/Canvas/utils/canvasMappers';
import useCanvasHistory from './useCanvasHistory';
import useCanvasResultActions from './useCanvasResultActions';
import { canvasEntityAddedToast, canvasEntityAlreadyAddedToast } from '@/features/Core/utils/toastMessages';

type UseCanvasOptions = {
  saveMerge?: (canvasId: number, submission: GraphSubmission) => Promise<void>;
  saveTrashElements?: (canvasId: number, selection: { nodes?: number[]; edges?: number[] }) => Promise<void>;
  saveRename?: (canvasId: number, label: string) => Promise<void>;
};

const createCanvasNode = (id: string, name: string, types: string[]): CanvasNode => ({
  id,
  dataId: 0,
  ref: id,
  names: [name],
  types,
  curies: [id],
  x: 0,
  y: 0,
  hidden: false,
  tags: {},
});

const useCanvas = (options: UseCanvasOptions = {}) => {
  const { saveMerge, saveTrashElements, saveRename } = options;
  const dispatch = useDispatch<AppDispatch>();
  const activeCanvas = useSelector(selectActiveCanvas);
  const { pushUndo, undo, redo, canUndo, canRedo } = useCanvasHistory(activeCanvas);

  const addNode = useCallback((node: CanvasNode) => {
    if (!activeCanvas) return;
    pushUndo();
    dispatch(addCanvasNode({ canvasId: activeCanvas.id, node }));
    saveMerge?.(activeCanvas.id, canvasNodesToGraphSubmission([node], []));
  }, [activeCanvas, dispatch, pushUndo, saveMerge]);

  const addEdge = useCallback((edge: CanvasEdge) => {
    if (!activeCanvas) return;
    pushUndo();
    dispatch(addCanvasEdge({ canvasId: activeCanvas.id, edge }));
    saveMerge?.(activeCanvas.id, canvasNodesToGraphSubmission([], [edge]));
  }, [activeCanvas, dispatch, pushUndo, saveMerge]);

  const removeNode = useCallback((nodeId: string) => {
    if (!activeCanvas) return;
    const node = activeCanvas.nodes[nodeId];
    pushUndo();
    dispatch(removeCanvasNode({ canvasId: activeCanvas.id, nodeId }));
    if (node?.dataId) saveTrashElements?.(activeCanvas.id, { nodes: [node.dataId] });
  }, [activeCanvas, dispatch, pushUndo, saveTrashElements]);

  const removeEdge = useCallback((edgeId: string) => {
    if (!activeCanvas) return;
    const edge = activeCanvas.edges[edgeId];
    pushUndo();
    dispatch(removeCanvasEdge({ canvasId: activeCanvas.id, edgeId }));
    if (edge?.dataId) saveTrashElements?.(activeCanvas.id, { edges: [edge.dataId] });
  }, [activeCanvas, dispatch, pushUndo, saveTrashElements]);

  const mergeEntities = useCallback((nodes: CanvasNode[], edges: CanvasEdge[], submission?: GraphSubmission) => {
    if (!activeCanvas) return;
    pushUndo();
    const merged = mergeEntityIntoCanvas(activeCanvas, nodes, edges);
    dispatch(replaceCanvas(merged));
    saveMerge?.(activeCanvas.id, submission ?? canvasNodesToGraphSubmission(nodes, edges));
  }, [activeCanvas, dispatch, pushUndo, saveMerge]);

  const rename = useCallback((label: string) => {
    if (!activeCanvas) return;
    dispatch(renameCanvas({ id: activeCanvas.id, label }));
    saveRename?.(activeCanvas.id, label);
  }, [activeCanvas, dispatch, saveRename]);

  const addObject = useCallback((id: string, name: string, types: string[]) => {
    if (!activeCanvas) return;
    if (activeCanvas.nodes[id]) {
      canvasEntityAlreadyAddedToast(name);
      return;
    }
    mergeEntities([createCanvasNode(id, name, types)], []);
    canvasEntityAddedToast(name, activeCanvas.label);
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
