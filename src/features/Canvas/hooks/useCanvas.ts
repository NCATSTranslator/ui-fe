import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '@/redux/store';
import {
  selectActiveCanvas,
  addCanvasNode,
  addCanvasEdge,
  removeCanvasElements,
  renameCanvas,
  replaceCanvas,
} from '@/features/Canvas/slices/canvasSlice';
import type { CanvasNode, CanvasEdge, GraphSubmission } from '@/features/Canvas/types/canvas';
import { mergeEntityIntoCanvas, selectionForRemovedElements } from '@/features/Canvas/utils/canvasGraphFunctions';
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
    activeCanvas, addNode, addEdge, removeNode, removeElements,
    mergeEntities, rename, undo, redo, canUndo, canRedo, addObject, pushUndo,
  };
};

export default useCanvas;
