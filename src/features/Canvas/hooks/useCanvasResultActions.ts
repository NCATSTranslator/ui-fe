import { useCallback, useState, startTransition } from 'react';
import type { Canvas, CanvasNode, CanvasEdge, GraphSubmission } from '@/features/Canvas/types/canvas';
import type { ResultSet, Result, Path } from '@/features/ResultList/types/results.d';
import { extractNodesAndEdgesFromResult, extractNodesAndEdgesFromPath, extractNodesAndEdgesFromAllResults, extractNodeFromResultSet} from '@/features/Canvas/utils/canvasGraphFunctions';
import { resultCountExceedsThreshold } from '@/features/Canvas/utils/canvasFunctions';
import { resultDataToGraphSubmission } from '@/features/Canvas/utils/canvasMappers';
import { canvasEntityAddedToast, canvasEntitiesAddedToast, canvasEntityAlreadyAddedToast } from '@/features/Core/utils/toastMessages';

const buildSubmission = (resultSet: ResultSet, nodes: CanvasNode[], edges: CanvasEdge[]) =>
  resultDataToGraphSubmission(resultSet, nodes.map(n => n.id), edges.map(e => e.id));

const createCanvasEdge = (edge: { id: string; subject: string; object: string; predicate: string }): CanvasEdge => ({
  id: edge.id,
  dataId: 0,
  ref: edge.id,
  subject: edge.subject,
  object: edge.object,
  subjectDataId: 0,
  objectDataId: 0,
  predicate: edge.predicate,
  hidden: false,
  tags: {},
});

const useCanvasResultActions = (
  activeCanvas: Canvas | null,
  mergeEntities: (nodes: CanvasNode[], edges: CanvasEdge[], submission?: GraphSubmission) => void,
) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const addResult = useCallback((resultSet: ResultSet, result: Result) => {
    if (!activeCanvas) return;
    const { nodes, edges } = extractNodesAndEdgesFromResult(resultSet, result);
    if (nodes.length === 0) return;
    mergeEntities(nodes, edges, buildSubmission(resultSet, nodes, edges));
    const name = result.drug_name || nodes[0]?.names[0] || result.subject;
    canvasEntityAddedToast(name, activeCanvas.label);
  }, [activeCanvas, mergeEntities]);

  const addPath = useCallback((resultSet: ResultSet, path: Path) => {
    if (!activeCanvas) return;
    const { nodes, edges } = extractNodesAndEdgesFromPath(resultSet, path);
    if (nodes.length === 0) return;
    mergeEntities(nodes, edges, buildSubmission(resultSet, nodes, edges));
    canvasEntitiesAddedToast(nodes.length, activeCanvas.label);
  }, [activeCanvas, mergeEntities]);

  const addQueryResults = useCallback((resultSet: ResultSet) => {
    if (!activeCanvas) return;
    setIsProcessing(true);
    startTransition(() => {
      const { nodes, edges } = extractNodesAndEdgesFromAllResults(resultSet);
      if (nodes.length > 0) {
        mergeEntities(nodes, edges, buildSubmission(resultSet, nodes, edges));
        canvasEntitiesAddedToast(nodes.length, activeCanvas.label);
      }
      setIsProcessing(false);
    });
  }, [activeCanvas, mergeEntities]);

  const addSingleNode = useCallback((resultSet: ResultSet, nodeId: string) => {
    if (!activeCanvas) return;
    if (activeCanvas.nodes[nodeId]) {
      const existing = activeCanvas.nodes[nodeId];
      canvasEntityAlreadyAddedToast(existing.names[0] || nodeId);
      return;
    }
    const canvasNode = extractNodeFromResultSet(resultSet, nodeId);
    if (!canvasNode) return;
    const submission = resultDataToGraphSubmission(resultSet, [nodeId], []);
    mergeEntities([canvasNode], [], submission);
    canvasEntityAddedToast(canvasNode.names[0] || nodeId, activeCanvas.label);
  }, [activeCanvas, mergeEntities]);

  const addEdgeFromEvidence = useCallback((resultSet: ResultSet, edgeId: string) => {
    if (!activeCanvas) return;
    const edge = resultSet.data.edges[edgeId];
    if (!edge) return;
    const subjectNode = extractNodeFromResultSet(resultSet, edge.subject);
    const objectNode = extractNodeFromResultSet(resultSet, edge.object);
    const nodes = [subjectNode, objectNode].filter((n): n is CanvasNode => n !== null);
    const submission = resultDataToGraphSubmission(
      resultSet,
      nodes.map(n => n.id),
      [edgeId],
    );
    mergeEntities(nodes, [createCanvasEdge(edge)], submission);
    canvasEntityAddedToast(edge.predicate, activeCanvas.label);
  }, [activeCanvas, mergeEntities]);

  return { addResult, addPath, addQueryResults, addSingleNode, addEdgeFromEvidence, resultCountExceedsThreshold, isProcessing };
};

export default useCanvasResultActions;
