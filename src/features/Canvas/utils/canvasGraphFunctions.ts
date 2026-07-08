import type { GraphData, GraphNodeType, GraphEdgeType } from 'translator-graph-view';
import type { Canvas, CanvasNode, CanvasEdge, CanvasSource } from '@/features/Canvas/types/canvas';
import type { ResultSet, Result, Path, ResultNode, ResultEdge } from '@/features/ResultList/types/results.d';
import { getNodeById, getEdgeById, getPathsByIds } from '@/features/ResultList/slices/resultsSlice';
import { isStringArray } from '@/features/Core/utils/resultHelpers';
import { mergeCanvasNode } from '@/features/Canvas/utils/canvasFunctions';

export const canvasToGraphData = (canvas: Canvas): GraphData => {
  const nodes: Record<string, GraphNodeType> = {};
  for (const [id, node] of Object.entries(canvas.nodes)) {
    nodes[id] = {
      id: node.id,
      names: node.names,
      types: node.types,
      curies: node.curies,
    };
  }

  const edges: Record<string, GraphEdgeType> = {};
  for (const [id, edge] of Object.entries(canvas.edges)) {
    edges[id] = {
      id: edge.id,
      subject: edge.subject,
      object: edge.object,
      predicate: edge.predicate,
      inferred: edge.inferred,
    };
  }

  return { nodes, edges };
};

export const mergeEntityIntoCanvas = (
  canvas: Canvas,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  source: CanvasSource,
): Canvas => {
  const mergedNodes = { ...canvas.nodes };
  const mergedEdges = { ...canvas.edges };
  const mergedSources = canvas.sources.some(s => s.id === source.id)
    ? canvas.sources
    : [...canvas.sources, source];

  for (const node of nodes) {
    const existing = mergedNodes[node.id];
    mergedNodes[node.id] = existing ? mergeCanvasNode(existing, node) : node;
  }

  for (const edge of edges) {
    const existing = mergedEdges[edge.id];
    if (existing) {
      const mergedSourceIds = Array.from(new Set([...existing.sources, ...edge.sources]));
      mergedEdges[edge.id] = { ...existing, sources: mergedSourceIds };
    } else {
      mergedEdges[edge.id] = edge;
    }
  }

  return {
    ...canvas,
    nodes: mergedNodes,
    edges: mergedEdges,
    sources: mergedSources,
    timeUpdated: new Date().toISOString(),
  };
};

const resultNodeToCanvasNode = (node: ResultNode, sourceId: string): CanvasNode => ({
  id: node.id,
  names: [...node.names],
  types: [...node.types],
  curies: [...node.curies],
  sources: [sourceId],
});

const resultEdgeToCanvasEdge = (edge: ResultEdge, sourceId: string): CanvasEdge => ({
  id: edge.id,
  subject: edge.subject,
  object: edge.object,
  predicate: edge.predicate,
  inferred: edge.inferred || undefined,
  sources: [sourceId],
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
  sourceId: string,
): { nodes: CanvasNode[]; edges: CanvasEdge[] } => {
  const nodes: CanvasNode[] = [];
  const edges: CanvasEdge[] = [];

  for (let i = 0; i < path.subgraph.length; i++) {
    const id = path.subgraph[i] as string;
    if (i % 2 === 0) {
      const node = getNodeById(resultSet, id);
      if (node) nodes.push(resultNodeToCanvasNode(node, sourceId));
    } else {
      const edge = getEdgeById(resultSet, id);
      if (edge) edges.push(resultEdgeToCanvasEdge(edge, sourceId));
    }
  }

  return { nodes, edges };
};

export const extractNodesAndEdgesFromResult = (
  resultSet: ResultSet,
  result: Result,
  sourceId: string,
): { nodes: CanvasNode[]; edges: CanvasEdge[] } => {
  const allNodes: CanvasNode[] = [];
  const allEdges: CanvasEdge[] = [];
  const seenNodes = new Set<string>();
  const seenEdges = new Set<string>();

  const subjectNode = getNodeById(resultSet, result.subject);
  if (subjectNode) collectUnique(allNodes, seenNodes, [resultNodeToCanvasNode(subjectNode, sourceId)]);
  const objectNode = getNodeById(resultSet, result.object);
  if (objectNode) collectUnique(allNodes, seenNodes, [resultNodeToCanvasNode(objectNode, sourceId)]);

  if (isStringArray(result.paths)) {
    const paths = getPathsByIds(resultSet, result.paths as string[]);
    for (const path of paths) {
      const { nodes, edges } = extractNodesAndEdgesFromPath(resultSet, path, sourceId);
      collectUnique(allNodes, seenNodes, nodes);
      collectUnique(allEdges, seenEdges, edges);
    }
  }

  return { nodes: allNodes, edges: allEdges };
};

export const extractNodesAndEdgesFromAllResults = (
  resultSet: ResultSet,
  sourceId: string,
): { nodes: CanvasNode[]; edges: CanvasEdge[] } => {
  const allNodes: CanvasNode[] = [];
  const allEdges: CanvasEdge[] = [];
  const seenNodes = new Set<string>();
  const seenEdges = new Set<string>();

  for (const result of resultSet.data.results) {
    const { nodes, edges } = extractNodesAndEdgesFromResult(resultSet, result, sourceId);
    collectUnique(allNodes, seenNodes, nodes);
    collectUnique(allEdges, seenEdges, edges);
  }

  return { nodes: allNodes, edges: allEdges };
};

export const extractNodeFromResultSet = (
  resultSet: ResultSet,
  nodeId: string,
  sourceId: string,
): CanvasNode | null => {
  const node = getNodeById(resultSet, nodeId);
  if (!node) return null;
  return resultNodeToCanvasNode(node, sourceId);
};
