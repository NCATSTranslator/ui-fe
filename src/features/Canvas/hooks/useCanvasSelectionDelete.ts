import { useCallback } from 'react';
import type { DeleteSelection } from 'translator-graph-view';
import type { Canvas } from '@/features/Canvas/types/canvas';
import { getIncidentEdgeIds } from '@/features/Canvas/utils/canvasGraphFunctions';
import { finalizeCanvasElementRemoval } from '@/features/Canvas/utils/canvasRemovalUi';

interface UseCanvasSelectionDeleteOptions {
  activeCanvas: Canvas;
  removeElements: (nodeIds: string[], edgeIds: string[]) => void;
  clearHover: () => void;
  setSelectedNodeIds: (ids: string[]) => void;
}

/**
 * Handle the graph's Delete/Backspace gesture. The graph reports what the keypress
 * covered but removes nothing itself, so the canvas store performs the removal — as one
 * undoable step, however many elements the selection held.
 */
const useCanvasSelectionDelete = ({
  activeCanvas,
  removeElements,
  clearHover,
  setSelectedNodeIds,
}: UseCanvasSelectionDeleteOptions) => useCallback((selection: DeleteSelection) => {
  const nodeIds = selection.nodes.filter(nodeId => activeCanvas.nodes[nodeId]);
  const edgeIds = selection.edges.filter(edgeId => activeCanvas.edges[edgeId]);
  if (nodeIds.length === 0 && edgeIds.length === 0) return;

  /*
   * Edges connected to a deleted node arrive in the payload even when the user never
   * selected them, so the count reports only what was picked directly.
   */
  const incidentEdgeIds = new Set(getIncidentEdgeIds(activeCanvas.edges, nodeIds));
  const pickedEdgeCount = edgeIds.filter(edgeId => !incidentEdgeIds.has(edgeId)).length;
  const pickedCount = nodeIds.length + pickedEdgeCount;
  const singleEntityName = pickedCount === 1 && nodeIds.length === 1
    ? (activeCanvas.nodes[nodeIds[0]].names[0] || nodeIds[0])
    : undefined;

  removeElements(nodeIds, edgeIds);
  finalizeCanvasElementRemoval({
    clearHover,
    setSelectedNodeIds,
    pickedCount,
    singleEntityName,
  });
}, [activeCanvas, removeElements, clearHover, setSelectedNodeIds]);

export default useCanvasSelectionDelete;
