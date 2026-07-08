import { useCallback, useState, startTransition } from 'react';
import type { Canvas, CanvasNode, CanvasEdge, CanvasSource } from '@/features/Canvas/types/canvas';
import type { ResultSet, Result, Path } from '@/features/ResultList/types/results.d';
import { extractNodesAndEdgesFromResult, extractNodesAndEdgesFromPath, extractNodesAndEdgesFromAllResults, extractNodeFromResultSet} from '@/features/Canvas/utils/canvasGraphFunctions';
import { makeQuerySource, resultCountExceedsThreshold } from '@/features/Canvas/utils/canvasFunctions';
import { canvasEntityAddedToast, canvasEntitiesAddedToast, canvasEntityAlreadyAddedToast } from '@/features/Core/utils/toastMessages';

const useCanvasResultActions = (
  activeCanvas: Canvas | null,
  mergeEntities: (nodes: CanvasNode[], edges: CanvasEdge[], source: CanvasSource) => void,
) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const addResult = useCallback((resultSet: ResultSet, result: Result, sourceId: string) => {
    if (!activeCanvas) return;
    const { nodes, edges } = extractNodesAndEdgesFromResult(resultSet, result, sourceId);
    if (nodes.length === 0) return;
    mergeEntities(nodes, edges, makeQuerySource(sourceId));
    const name = result.drug_name || nodes[0]?.names[0] || result.subject;
    canvasEntityAddedToast(name, activeCanvas.title);
  }, [activeCanvas, mergeEntities]);

  const addPath = useCallback((resultSet: ResultSet, path: Path, sourceId: string) => {
    if (!activeCanvas) return;
    const { nodes, edges } = extractNodesAndEdgesFromPath(resultSet, path, sourceId);
    if (nodes.length === 0) return;
    mergeEntities(nodes, edges, makeQuerySource(sourceId));
    canvasEntitiesAddedToast(nodes.length, activeCanvas.title);
  }, [activeCanvas, mergeEntities]);

  const addQueryResults = useCallback((resultSet: ResultSet, sourceId: string) => {
    if (!activeCanvas) return;
    setIsProcessing(true);
    startTransition(() => {
      const { nodes, edges } = extractNodesAndEdgesFromAllResults(resultSet, sourceId);
      if (nodes.length > 0) {
        mergeEntities(nodes, edges, makeQuerySource(sourceId));
        canvasEntitiesAddedToast(nodes.length, activeCanvas.title);
      }
      setIsProcessing(false);
    });
  }, [activeCanvas, mergeEntities]);

  const addSingleNode = useCallback((resultSet: ResultSet, nodeId: string, sourceId: string) => {
    if (!activeCanvas) return;
    if (activeCanvas.nodes[nodeId]) {
      const existing = activeCanvas.nodes[nodeId];
      canvasEntityAlreadyAddedToast(existing.names[0] || nodeId);
      return;
    }
    const canvasNode = extractNodeFromResultSet(resultSet, nodeId, sourceId);
    if (!canvasNode) return;
    mergeEntities([canvasNode], [], makeQuerySource(sourceId));
    canvasEntityAddedToast(canvasNode.names[0] || nodeId, activeCanvas.title);
  }, [activeCanvas, mergeEntities]);

  const addEdgeFromEvidence = useCallback((resultSet: ResultSet, edgeId: string, sourceId: string) => {
    if (!activeCanvas) return;
    const edge = resultSet.data.edges[edgeId];
    if (!edge) return;
    const subjectNode = extractNodeFromResultSet(resultSet, edge.subject, sourceId);
    const objectNode = extractNodeFromResultSet(resultSet, edge.object, sourceId);
    const nodes = [subjectNode, objectNode].filter((n): n is CanvasNode => n !== null);
    const canvasEdge: CanvasEdge = {
      id: edge.id,
      subject: edge.subject,
      object: edge.object,
      predicate: edge.predicate,
      inferred: edge.inferred || undefined,
      sources: [sourceId],
    };
    mergeEntities(nodes, [canvasEdge], makeQuerySource(sourceId));
    canvasEntityAddedToast(edge.predicate, activeCanvas.title);
  }, [activeCanvas, mergeEntities]);

  return { addResult, addPath, addQueryResults, addSingleNode, addEdgeFromEvidence, resultCountExceedsThreshold, isProcessing };
};

export default useCanvasResultActions;
