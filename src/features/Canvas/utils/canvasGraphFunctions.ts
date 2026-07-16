import type { GraphData, GraphNodeType, GraphEdgeType } from 'translator-graph-view';
import type { Canvas, CanvasNode, CanvasEdge } from '@/features/Canvas/types/canvas';
import type { ResultSet, Result, Path, ResultNode, ResultEdge } from '@/features/ResultList/types/results.d';
import { getNodeById, getEdgeById, getPathsByIds } from '@/features/ResultList/slices/resultsSlice';
import { isStringArray } from '@/features/Core/utils/resultHelpers';
import { mergeCanvasNode } from '@/features/Canvas/utils/canvasFunctions';

export const canvasToGraphData = (canvas: Canvas): GraphData =>
  filteredCanvasToGraphData(canvas.nodes, canvas.edges);

export const filteredCanvasToGraphData = (
  visibleNodes: Record<string, CanvasNode>,
  visibleEdges: Record<string, CanvasEdge>,
): GraphData => {
  const nodes: Record<string, GraphNodeType> = {};
  for (const [id, node] of Object.entries(visibleNodes)) {
    nodes[id] = {
      id: node.id,
      names: node.names,
      types: node.types,
      curies: node.curies,
    };
  }

  const edges: Record<string, GraphEdgeType> = {};
  for (const [id, edge] of Object.entries(visibleEdges)) {
    edges[id] = {
      id: edge.id,
      subject: edge.subject,
      object: edge.object,
      predicate: edge.predicate,
    };
  }

  return { nodes, edges };
};

export const mergeEntityIntoCanvas = (
  canvas: Canvas,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
): Canvas => {
  const mergedNodes = { ...canvas.nodes };
  const mergedEdges = { ...canvas.edges };

  for (const node of nodes) {
    const existing = mergedNodes[node.id];
    mergedNodes[node.id] = existing ? mergeCanvasNode(existing, node) : node;
  }

  for (const edge of edges) {
    if (!mergedEdges[edge.id]) {
      mergedEdges[edge.id] = edge;
    }
  }

  return {
    ...canvas,
    nodes: mergedNodes,
    edges: mergedEdges,
    timeUpdated: new Date().toISOString(),
  };
};


const resultNodeToCanvasNode = (node: ResultNode): CanvasNode => ({
  id: node.id,
  dataId: 0,
  ref: node.id,
  names: [...node.names],
  types: [...node.types],
  curies: [...node.curies],
  x: 0,
  y: 0,
  hidden: false,
  tags: node.tags,
});

export const resultEdgeToCanvasEdge = (edge: ResultEdge): CanvasEdge => ({
  ...edge,
  dataId: 0,
  ref: edge.id,
  subjectDataId: 0,
  objectDataId: 0,
  hidden: false,
});

const collectUnique = <T extends { id: string }>(
  target: T[],
  seen: Set<string>,
  items: T[],
): void => {
  for (const item of items) {
    if (!seen.has(item.id)) {
      target.push(item);
      seen.add(item.id);
    }
  }
};

export const extractNodesAndEdgesFromPath = (
  resultSet: ResultSet,
  path: Path,
): { nodes: CanvasNode[]; edges: CanvasEdge[] } => {
  const nodes: CanvasNode[] = [];
  const edges: CanvasEdge[] = [];

  for (let i = 0; i < path.subgraph.length; i++) {
    const id = path.subgraph[i] as string;
    if (i % 2 === 0) {
      const node = getNodeById(resultSet, id);
      if (node) nodes.push(resultNodeToCanvasNode(node));
    } else {
      const edge = getEdgeById(resultSet, id);
      if (edge) edges.push(resultEdgeToCanvasEdge(edge));
    }
  }

  return { nodes, edges };
};

export const extractNodesAndEdgesFromResult = (
  resultSet: ResultSet,
  result: Result,
): { nodes: CanvasNode[]; edges: CanvasEdge[] } => {
  const allNodes: CanvasNode[] = [];
  const allEdges: CanvasEdge[] = [];
  const seenNodes = new Set<string>();
  const seenEdges = new Set<string>();

  const subjectNode = getNodeById(resultSet, result.subject);
  if (subjectNode) collectUnique(allNodes, seenNodes, [resultNodeToCanvasNode(subjectNode)]);
  const objectNode = getNodeById(resultSet, result.object);
  if (objectNode) collectUnique(allNodes, seenNodes, [resultNodeToCanvasNode(objectNode)]);

  if (isStringArray(result.paths)) {
    const paths = getPathsByIds(resultSet, result.paths as string[]);
    for (const path of paths) {
      const { nodes, edges } = extractNodesAndEdgesFromPath(resultSet, path);
      collectUnique(allNodes, seenNodes, nodes);
      collectUnique(allEdges, seenEdges, edges);
    }
  }

  return { nodes: allNodes, edges: allEdges };
};

export const extractNodesAndEdgesFromAllResults = (
  resultSet: ResultSet,
): { nodes: CanvasNode[]; edges: CanvasEdge[] } => {
  const allNodes: CanvasNode[] = [];
  const allEdges: CanvasEdge[] = [];
  const seenNodes = new Set<string>();
  const seenEdges = new Set<string>();

  for (const result of resultSet.data.results) {
    const { nodes, edges } = extractNodesAndEdgesFromResult(resultSet, result);
    collectUnique(allNodes, seenNodes, nodes);
    collectUnique(allEdges, seenEdges, edges);
  }

  return { nodes: allNodes, edges: allEdges };
};

export const extractNodeFromResultSet = (
  resultSet: ResultSet,
  nodeId: string,
): CanvasNode | null => {
  const node = getNodeById(resultSet, nodeId);
  if (!node) return null;
  return resultNodeToCanvasNode(node);
};
