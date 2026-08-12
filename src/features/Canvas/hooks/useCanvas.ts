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
import { mergeEntityIntoCanvas, selectionForRemovedNode } from '@/features/Canvas/utils/canvasGraphFunctions';
import { canvasNodesToGraphSubmission } from '@/features/Canvas/utils/canvasMappers';
import { estimatePlacementNearNodes } from '@/features/Canvas/utils/canvasAnnotationUtils';
import { isCustomCanvasLayout } from '@/features/Canvas/utils/canvasLayoutUtils';
import useCanvasHistory from './useCanvasHistory';
import { canvasEntityAddedToast, canvasEntityAlreadyAddedToast } from '@/features/Core/utils/toastMessages';
import type { CanvasHistoryPersistence } from '@/features/Canvas/utils/canvasHistoryUtils';

type UseCanvasOptions = CanvasHistoryPersistence & {
  saveMerge?: (canvasId: number, submission: GraphSubmission) => Promise<void>;
  saveRename?: (canvasId: number, label: string) => Promise<void>;
};

const createCanvasNode = (
  id: string,
  name: string,
  types: string[],
  position?: { x: number; y: number },
): CanvasNode => ({
  id,
  dataId: 0,
  ref: id,
  names: [name],
  types,
  curies: [id],
  x: position?.x ?? 0,
  y: position?.y ?? 0,
  hidden: false,
  tags: {},
});

const useCanvas = (options: UseCanvasOptions = {}) => {
  const {
    saveMerge, saveTrashElements, saveRename,
  } = options;
  const dispatch = useDispatch<AppDispatch>();
  const activeCanvas = useSelector(selectActiveCanvas);
  const { pushUndo, undo, redo, canUndo, canRedo } = useCanvasHistory(activeCanvas, options);

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
    const selection = selectionForRemovedNode(activeCanvas, nodeId);
    pushUndo();
    dispatch(removeCanvasNode({ canvasId: activeCanvas.id, nodeId }));
    if (selection) saveTrashElements?.(activeCanvas.id, selection);
  }, [activeCanvas, dispatch, pushUndo, saveTrashElements]);

  const removeEdge = useCallback((edgeId: string) => {
    if (!activeCanvas) return;
    const edge = activeCanvas.edges[edgeId];
    pushUndo();
    dispatch(removeCanvasEdge({ canvasId: activeCanvas.id, edgeId }));
    if (edge?.dataId) saveTrashElements?.(activeCanvas.id, { edges: [edge.dataId] });
  }, [activeCanvas, dispatch, pushUndo, saveTrashElements]);

  const mergeEntities = useCallback((
    nodes: CanvasNode[],
    edges: CanvasEdge[],
    submission?: GraphSubmission,
  ) => {
    if (!activeCanvas) return;
    pushUndo();
    dispatch(replaceCanvas(mergeEntityIntoCanvas(activeCanvas, nodes, edges)));
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
    const position = isCustomCanvasLayout(activeCanvas.layout)
      ? estimatePlacementNearNodes(activeCanvas.nodes, Object.keys(activeCanvas.nodes).length)
      : undefined;
    mergeEntities([createCanvasNode(id, name, types, position)], []);
    canvasEntityAddedToast(name, activeCanvas.label);
  }, [activeCanvas, mergeEntities]);

  return {
    activeCanvas, addNode, addEdge, removeNode, removeEdge,
    mergeEntities, rename, undo, redo, canUndo, canRedo, addObject, pushUndo,
  };
};

export default useCanvas;
