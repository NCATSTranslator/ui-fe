import type { GraphData, GraphNodeType, GraphEdgeType } from 'translator-graph-view';
import type { Canvas, CanvasNode, CanvasEdge, GraphSelection } from '@/features/Canvas/types/canvas';
import type { ResultSet, Path, Result, ResultNode, ResultEdge } from '@/features/ResultList/types/results.d';
import { getNodeById, getEdgeById, getPathById } from '@/features/ResultList/slices/resultsSlice';
import { isPath } from '@/features/ResultList/types/checkers';
import { isNodeIndex } from '@/features/ResultList/utils/resultsInteractionFunctions';
import { getDistinctResultEdges } from '@/features/Core/utils/resultHelpers';
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

const addDistinctEdgesForHop = (
  resultSet: ResultSet,
  edgeIds: string[],
  edgeById: Map<string, CanvasEdge>,
) => {
  for (const rawEdge of getDistinctResultEdges(resultSet, edgeIds)) {
    if (edgeById.has(rawEdge.id)) continue;
    // Prefer display-mapped edge (e.g. treat → impact) when converting for the canvas.
    const edge = getEdgeById(resultSet, rawEdge.id) ?? rawEdge;
    edgeById.set(rawEdge.id, resultEdgeToCanvasEdge(edge));
  }
};

export const extractNodesAndEdgesFromPath = (
  resultSet: ResultSet,
  path: Path,
): { nodes: CanvasNode[]; edges: CanvasEdge[] } => {
  const nodeById = new Map<string, CanvasNode>();
  const edgeById = new Map<string, CanvasEdge>();
  const subgraph = path.compressedSubgraph ?? path.subgraph;

  for (let i = 0; i < subgraph.length; i++) {
    const slot = subgraph[i];
    if (isNodeIndex(i)) {
      if (typeof slot !== 'string') continue;
      if (nodeById.has(slot)) continue;
      const node = getNodeById(resultSet, slot);
      if (node) nodeById.set(slot, resultNodeToCanvasNode(node));
      continue;
    }

    const edgeIds = Array.isArray(slot) ? slot : [slot];
    addDistinctEdgesForHop(resultSet, edgeIds, edgeById);
  }

  return {
    nodes: Array.from(nodeById.values()),
    edges: Array.from(edgeById.values()),
  };
};

/** One representative edge ID per distinct predicate for each subject/object pair. */
const dedupeEdgesByNodePairAndPredicate = (
  resultSet: ResultSet,
  edges: CanvasEdge[],
): CanvasEdge[] => {
  const byPair = new Map<string, string[]>();
  for (const edge of edges) {
    const key = `${edge.subject}|${edge.object}`;
    const existing = byPair.get(key);
    if (existing) existing.push(edge.id);
    else byPair.set(key, [edge.id]);
  }

  const edgeById = new Map(edges.map(edge => [edge.id, edge]));
  const deduped: CanvasEdge[] = [];
  for (const edgeIds of byPair.values()) {
    for (const edge of getDistinctResultEdges(resultSet, edgeIds)) {
      const canvasEdge = edgeById.get(edge.id);
      if (canvasEdge) deduped.push(canvasEdge);
    }
  }
  return deduped;
};

/** Union nodes and edges from every path in a result. */
export const extractNodesAndEdgesFromResult = (
  resultSet: ResultSet,
  result: Result,
): { nodes: CanvasNode[]; edges: CanvasEdge[] } => {
  const nodeById = new Map<string, CanvasNode>();
  const edgeById = new Map<string, CanvasEdge>();

  for (const pathRef of result.paths) {
    const path = isPath(pathRef) ? pathRef : getPathById(resultSet, pathRef);
    if (!path) continue;
    const { nodes, edges } = extractNodesAndEdgesFromPath(resultSet, path);
    for (const node of nodes) nodeById.set(node.id, node);
    for (const edge of edges) edgeById.set(edge.id, edge);
  }

  return {
    nodes: Array.from(nodeById.values()),
    edges: dedupeEdgesByNodePairAndPredicate(resultSet, Array.from(edgeById.values())),
  };
};

export const extractNodeFromResultSet = (
  resultSet: ResultSet,
  nodeId: string,
): CanvasNode | null => {
  const node = getNodeById(resultSet, nodeId);
  if (!node) return null;
  return resultNodeToCanvasNode(node);
};
