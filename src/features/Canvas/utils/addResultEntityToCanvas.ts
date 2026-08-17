import type { QueryClient } from '@tanstack/react-query';
import type { AppDispatch } from '@/redux/store';
import { replaceCanvas } from '@/features/Canvas/slices/canvasSlice';
import { resultDataToGraphSubmission, backendGraphToInternal } from '@/features/Canvas/utils/canvasMappers';
import { extractNodeFromResultSet, extractNodesAndEdgesFromPath } from '@/features/Canvas/utils/canvasGraphFunctions';
import { mergeCanvasGraph } from '@/features/Canvas/utils/canvasApi';
import { canvasEntityAddedToast, canvasEntitiesAddedToast, canvasSaveErrorToast } from '@/features/Core/utils/toastMessages';
import type { Canvas } from '@/features/Canvas/types/canvas';
import type { Path, ResultSet } from '@/features/ResultList/types/results';

export type ResultEntityTarget = {
  type: 'node' | 'edge' | 'path';
  id: string;
  pk: string;
  path?: Path;
};

export const resolveResultEntityTarget = (
  resultSet: ResultSet,
  target: ResultEntityTarget,
): { nodeIds: string[]; edgeIds: string[]; entityName: string } | null => {
  if (target.type === 'path') {
    if (!target.path) return null;
    const { nodes, edges } = extractNodesAndEdgesFromPath(resultSet, target.path);
    if (nodes.length === 0) return null;
    return { nodeIds: nodes.map(n => n.id), edgeIds: edges.map(e => e.id), entityName: target.id };
  }
  if (target.type === 'node') {
    const node = extractNodeFromResultSet(resultSet, target.id);
    if (!node) return null;
    return { nodeIds: [target.id], edgeIds: [], entityName: node.names[0] || target.id };
  }
  const edge = resultSet.data.edges[target.id];
  if (!edge) return null;
  return { nodeIds: [edge.subject, edge.object], edgeIds: [target.id], entityName: edge.predicate };
};

type AddResultEntityParams = {
  resultSet: ResultSet;
  target: ResultEntityTarget;
  canvas: Canvas;
  dispatch: AppDispatch;
  queryClient: QueryClient;
};

/**
 * Merges a result node, edge, or path into an existing canvas.
 * Caller is responsible for ensuring `canvas` exists (drop) or creating one (context menu).
 */
export const addResultEntityToCanvas = async ({
  resultSet,
  target,
  canvas,
  dispatch,
  queryClient,
}: AddResultEntityParams): Promise<boolean> => {
  const resolved = resolveResultEntityTarget(resultSet, target);
  if (!resolved) return false;

  const { nodeIds, edgeIds, entityName } = resolved;
  const submission = resultDataToGraphSubmission(resultSet, nodeIds, edgeIds, undefined, {
    layout: canvas.layout,
    existingNodes: canvas.nodes,
  });
  try {
    const graph = await mergeCanvasGraph(canvas.id, submission);
    const { nodes, edges } = backendGraphToInternal(graph);
    dispatch(replaceCanvas({
      ...canvas,
      nodes,
      edges,
      tags: graph.tags ?? canvas.tags,
      timeUpdated: new Date().toISOString(),
    }));
    queryClient.invalidateQueries({ queryKey: ['userCanvases'] });
    if (target.type === 'path') {
      canvasEntitiesAddedToast(nodeIds.length, canvas.label);
    } else {
      canvasEntityAddedToast(entityName, canvas.label);
    }
    return true;
  } catch {
    canvasSaveErrorToast();
    return false;
  }
};
