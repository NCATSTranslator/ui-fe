import type {
  BackendUserCanvas,
  BackendCanvasGraph,
  BackendCanvasNode,
  BackendCanvasEdge,
  Canvas,
  CanvasNode,
  CanvasEdge,
  CanvasLayout,
  GraphSubmission,
  GraphSubmissionNode,
  GraphSubmissionEdge,
} from '@/features/Canvas/types/canvas';
import type { ResultSet, ResultNode, ResultEdge, ResultSetTags } from '@/features/ResultList/types/results.d';
import { getNodeById, getRawEdgeById } from '@/features/ResultList/slices/resultsSlice';
import {
  backendAnnotationsToCanvasAnnotations,
  estimatePlacementNearNodes,
} from '@/features/Canvas/utils/canvasAnnotationUtils';
import { isCustomCanvasLayout } from '@/features/Canvas/utils/canvasLayoutUtils';

// ---------------------------------------------------------------------------
// Backend → Internal
// ---------------------------------------------------------------------------

const backendNodeToCanvasNode = (node: BackendCanvasNode): CanvasNode => ({
  id: node.ref,
  dataId: node.data_id,
  ref: node.ref,
  names: [node.label],
  types: [node.type],
  curies: [node.ref],
  x: node.x,
  y: node.y,
  hidden: node.hidden,
  tags: node.tags,
});

const backendEdgeToCanvasEdge = (
  edge: BackendCanvasEdge,
  dataIdToRef: Map<number, string>,
): CanvasEdge => ({
  id: edge.ref,
  dataId: edge.data_id,
  ref: edge.ref,
  subject: dataIdToRef.get(edge.subject_id) ?? String(edge.subject_id),
  object: dataIdToRef.get(edge.object_id) ?? String(edge.object_id),
  subjectDataId: edge.subject_id,
  objectDataId: edge.object_id,
  predicate: edge.label,
  hidden: edge.hidden,
  tags: edge.tags,
  signature: edge.ref,
  source_time: edge.time_created,
});

export const backendGraphToInternal = (
  graph: BackendCanvasGraph,
): { nodes: Record<string, CanvasNode>; edges: Record<string, CanvasEdge> } => {
  const dataIdToRef = new Map<number, string>();
  for (const node of graph.nodes) {
    dataIdToRef.set(node.data_id, node.ref);
  }

  const nodes: Record<string, CanvasNode> = {};
  for (const node of graph.nodes) {
    const converted = backendNodeToCanvasNode(node);
    nodes[converted.id] = converted;
  }

  const edges: Record<string, CanvasEdge> = {};
  for (const edge of graph.edges) {
    const converted = backendEdgeToCanvasEdge(edge, dataIdToRef);
    edges[converted.id] = converted;
  }

  return { nodes, edges };
};

export const backendCanvasToCanvas = (
  meta: BackendUserCanvas,
  graph: BackendCanvasGraph,
): Canvas => {
  const { nodes, edges } = backendGraphToInternal(graph);
  return {
    id: meta.id,
    label: meta.label,
    layout: meta.layout,
    nodes,
    edges,
    tags: graph.tags ?? meta.data.tags,
    queryRef: meta.data.query_ref,
    resultRef: meta.data.result_ref,
    annotations: backendAnnotationsToCanvasAnnotations(graph.annotations),
    timeCreated: meta.time_created,
    timeUpdated: meta.time_updated,
    graphLoaded: true,
  };
};

export const backendMetaToCanvas = (meta: BackendUserCanvas): Canvas => ({
  id: meta.id,
  label: meta.label,
  layout: meta.layout,
  nodes: {},
  edges: {},
  tags: meta.data.tags,
  queryRef: meta.data.query_ref,
  resultRef: meta.data.result_ref,
  annotations: [],
  timeCreated: meta.time_created,
  timeUpdated: meta.time_updated,
  graphLoaded: false,
});

export const backendCanvasListToCanvasList = (
  metas: BackendUserCanvas[],
): Canvas[] => metas.filter(m => !m.time_deleted).map(backendMetaToCanvas);

// ---------------------------------------------------------------------------
// Internal → Submission
// ---------------------------------------------------------------------------

export const buildGraphSubmission = (
  signedNodes: Record<string, GraphSubmissionNode>,
  signedEdges: Record<string, GraphSubmissionEdge>,
  tagDescriptions?: ResultSetTags,
  source?: { query_ref: string; result_ref: string },
): GraphSubmission => ({
  nodes: signedNodes,
  edges: signedEdges,
  ...(tagDescriptions && { tag_descriptions: tagDescriptions }),
  ...(source && { source }),
});

// ---------------------------------------------------------------------------
// CanvasNode/CanvasEdge → GraphSubmission (minimal, for manual additions)
// ---------------------------------------------------------------------------

const canvasNodeToSubmissionNode = (node: CanvasNode): GraphSubmissionNode => ({
  id: node.id,
  aras: [],
  descriptions: [],
  names: [...node.names],
  types: [...node.types],
  synonyms: [],
  curies: [...node.curies],
  provenance: [],
  tags: node.tags,
  source_time: new Date().toISOString(),
  x: node.x,
  y: node.y,
  hidden: node.hidden,
  signature: node.id,
});

const canvasEdgeToSubmissionEdge = (edge: CanvasEdge): GraphSubmissionEdge => ({
  id: edge.id,
  subject: edge.subject,
  object: edge.object,
  predicate: edge.predicate,
  aras: [...(edge.aras ?? [])],
  is_root: edge.is_root ?? false,
  knowledge_level: edge.knowledge_level ?? '',
  description: edge.description ?? null,
  predicate_url: edge.predicate_url ?? '',
  provenance: [...(edge.provenance ?? [])],
  publications: { ...(edge.publications ?? {}) },
  metadata: edge.metadata ?? null,
  trials: [...(edge.trials ?? [])],
  tags: edge.tags,
  source_time: edge.source_time ?? new Date().toISOString(),
  hidden: edge.hidden,
  signature: edge.signature ?? edge.id,
});

export const canvasNodesToGraphSubmission = (
  nodes: CanvasNode[],
  edges: CanvasEdge[],
): GraphSubmission => {
  const subNodes: Record<string, GraphSubmissionNode> = {};
  for (const node of nodes) {
    subNodes[node.id] = canvasNodeToSubmissionNode(node);
  }
  const subEdges: Record<string, GraphSubmissionEdge> = {};
  for (const edge of edges) {
    subEdges[edge.id] = canvasEdgeToSubmissionEdge(edge);
  }
  return { nodes: subNodes, edges: subEdges };
};

// ---------------------------------------------------------------------------
// ResultSet → GraphSubmission (rich, for result-based additions)
// ---------------------------------------------------------------------------

const resultNodeToSubmissionNode = (
  node: ResultNode,
  position?: { x: number; y: number },
): GraphSubmissionNode => ({
  id: node.id,
  aras: [...node.aras],
  descriptions: [...node.descriptions],
  names: [...node.names],
  types: [...node.types],
  synonyms: [...node.synonyms],
  curies: [...node.curies],
  provenance: [...node.provenance],
  tags: node.tags,
  source_time: node.source_time,
  annotations: node.annotations,
  x: position?.x ?? 0,
  y: position?.y ?? 0,
  signature: node.signature,
});

const resultEdgeToSubmissionEdge = (edge: ResultEdge): GraphSubmissionEdge => ({
  id: edge.id,
  subject: edge.subject,
  object: edge.object,
  predicate: edge.predicate,
  aras: [...edge.aras],
  is_root: edge.is_root,
  knowledge_level: edge.knowledge_level,
  description: edge.description ?? null,
  predicate_url: edge.predicate_url,
  provenance: [...edge.provenance],
  publications: { ...edge.publications },
  metadata: edge.metadata,
  trials: [...edge.trials],
  tags: edge.tags,
  source_time: edge.source_time,
  signature: edge.signature,
});

export const resultDataToGraphSubmission = (
  resultSet: ResultSet,
  nodeIds: string[],
  edgeIds: string[],
  source?: { query_ref: string; result_ref: string },
  options?: {
    layout?: CanvasLayout;
    existingNodes?: Record<string, CanvasNode>;
  },
): GraphSubmission => {
  const useCustomPlacement = options?.layout && isCustomCanvasLayout(options.layout);
  const existingNodes = options?.existingNodes ?? {};
  const subNodes: Record<string, GraphSubmissionNode> = {};
  nodeIds.forEach((id, index) => {
    const node = getNodeById(resultSet, id);
    if (!node) return;
    const position = useCustomPlacement
      ? estimatePlacementNearNodes(existingNodes, index)
      : undefined;
    subNodes[id] = resultNodeToSubmissionNode(node, position);
  });
  const subEdges: Record<string, GraphSubmissionEdge> = {};
  for (const id of edgeIds) {
    const edge = getRawEdgeById(resultSet, id);
    if (edge) subEdges[id] = resultEdgeToSubmissionEdge(edge);
  }
  return buildGraphSubmission(subNodes, subEdges, undefined, source);
};
