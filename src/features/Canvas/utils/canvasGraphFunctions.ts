import type { GraphData, GraphNodeType, GraphEdgeType } from 'translator-graph-view';
import type { Canvas, CanvasNode, CanvasEdge, GraphSelection } from '@/features/Canvas/types/canvas';
import type { ResultSet, Path, ResultNode, ResultEdge } from '@/features/ResultList/types/results.d';
import { getNodeById, getEdgeById } from '@/features/ResultList/slices/resultsSlice';
import { mergeCanvasNode } from '@/features/Canvas/utils/canvasFunctions';

/** Build a trash/restore selection for a node and its connected edges. */
export const selectionForRemovedNode = (
  canvas: Canvas,
  nodeId: string,
): GraphSelection | null => {
  const node = canvas.nodes[nodeId];
  const nodes = node?.dataId ? [node.dataId] : [];
  const edges = Object.values(canvas.edges)
    .filter(edge => edge.subject === nodeId || edge.object === nodeId)
    .map(edge => edge.dataId)
    .filter(id => id > 0);
  if (nodes.length === 0 && edges.length === 0) return null;
  return {
    ...(nodes.length > 0 && { nodes }),
    ...(edges.length > 0 && { edges }),
  };
};

export const canvasNodesToNodePositions = (
  nodes: Record<string, CanvasNode>,
): Record<string, { x: number; y: number }> => {
  const positions: Record<string, { x: number; y: number }> = {};
  for (const [id, node] of Object.entries(nodes)) {
    positions[id] = { x: node.x, y: node.y };
  }
  return positions;
};

export const nodePositionMapToStoreUpdates = (
  positions: Record<string, { x: number; y: number }>,
): Array<{ nodeId: string; x: number; y: number }> =>
  Object.entries(positions).map(([nodeId, pos]) => ({ nodeId, x: pos.x, y: pos.y }));

/** True when every node is at the origin — usually means coordinates have not loaded yet. */
export const nodePositionsAreAllOrigin = (
  positions: Record<string, { x: number; y: number }>,
): boolean => {
  const entries = Object.values(positions);
  return entries.length > 0 && entries.every(p => p.x === 0 && p.y === 0);
};

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

export const extractNodeFromResultSet = (
  resultSet: ResultSet,
  nodeId: string,
): CanvasNode | null => {
  const node = getNodeById(resultSet, nodeId);
  if (!node) return null;
  return resultNodeToCanvasNode(node);
};
