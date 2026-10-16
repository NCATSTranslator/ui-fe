import type {
  BackendUserCanvas,
  BackendCanvasGraph,
  BackendCanvasNode,
  BackendCanvasEdge,
  Canvas,
  CanvasNode,
  CanvasEdge,
  CanvasLayout,
  GraphSelection,
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

/**
 * An entity with only user data has no Translator ref. Give it a stable synthetic one so it still
 * gets a unique internal id and edges can resolve their endpoints through it.
 */
const backendEntityRef = (
  entity: Pick<BackendCanvasNode, 'id' | 'ref' | 'user_data_id'>,
): string => entity.ref ?? `user:${entity.user_data_id ?? entity.id}`;

const backendNodeToCanvasNode = (node: BackendCanvasNode): CanvasNode => {
  const ref = backendEntityRef(node);
  return {
    id: ref,
    entityId: node.id,
    ref,
    names: [node.label],
    types: [node.type],
    curies: node.ref ? [node.ref] : [],
    x: node.x,
    y: node.y,
    hidden: node.hidden,
    tags: node.tags,
  };
};

const backendEdgeToCanvasEdge = (
  edge: BackendCanvasEdge,
  entityIdToRef: Map<number, string>,
): CanvasEdge => ({
  id: backendEntityRef(edge),
  entityId: edge.id,
  ref: backendEntityRef(edge),
  subject: entityIdToRef.get(edge.subject_id) ?? String(edge.subject_id),
  object: entityIdToRef.get(edge.object_id) ?? String(edge.object_id),
  subjectEntityId: edge.subject_id,
  objectEntityId: edge.object_id,
  predicate: edge.label,
  hidden: edge.hidden,
  tags: edge.tags,
  signature: edge.ref ?? undefined,
  source_time: edge.time_created,
});

export const backendGraphToInternal = (
  graph: BackendCanvasGraph,
): { nodes: Record<string, CanvasNode>; edges: Record<string, CanvasEdge> } => {
  const entityIdToRef = new Map<number, string>();
  for (const node of graph.nodes) {
    entityIdToRef.set(node.id, backendEntityRef(node));
  }

  const nodes: Record<string, CanvasNode> = {};
  for (const node of graph.nodes) {
    const converted = backendNodeToCanvasNode(node);
    nodes[converted.id] = converted;
  }

  const edges: Record<string, CanvasEdge> = {};
  for (const edge of graph.edges) {
    const converted = backendEdgeToCanvasEdge(edge, entityIdToRef);
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
    serverTimeUpdated: meta.time_updated,
    graphLoaded: true,
    serverKnown: true,
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
  serverTimeUpdated: meta.time_updated,
  graphLoaded: false,
  serverKnown: true,
});

export const backendCanvasListToCanvasList = (
  metas: BackendUserCanvas[],
): Canvas[] => metas.filter(m => !m.time_deleted).map(backendMetaToCanvas);

/**
 * The canvas entities a merge created, resolved from the server's post-merge graph by the
 * Translator ids the submission carried, so a merge that landed after the user moved on can be
 * trashed again.
 */
export const selectionFromSubmission = (
  submission: GraphSubmission,
  graph: BackendCanvasGraph,
): GraphSelection | null => {
  const nodeRefs = new Set(submission.nodes.map(node => node.data.id));
  const edgeRefs = new Set(submission.edges.map(edge => edge.data.id));
  const nodes = graph.nodes
    .filter(node => !node.time_deleted && node.ref !== null && nodeRefs.has(node.ref))
    .map(node => node.id);
  const edges = graph.edges
    .filter(edge => !edge.time_deleted && edge.ref !== null && edgeRefs.has(edge.ref))
    .map(edge => edge.id);
  if (nodes.length === 0 && edges.length === 0) return null;
  return {
    ...(nodes.length > 0 && { nodes }),
    ...(edges.length > 0 && { edges }),
  };
};

// ---------------------------------------------------------------------------
// Internal → Submission
// ---------------------------------------------------------------------------

export const buildGraphSubmission = (
  signedNodes: GraphSubmissionNode[],
  signedEdges: GraphSubmissionEdge[],
  tagDescriptions?: ResultSetTags,
  source?: { query_ref: string; result_ref: string },
): GraphSubmission => ({
  nodes: signedNodes,
  edges: signedEdges,
  ...(tagDescriptions && { tag_descriptions: tagDescriptions }),
  ...(source && { source }),
});

// ---------------------------------------------------------------------------
// ResultSet → GraphSubmission (rich, for result-based additions)
// ---------------------------------------------------------------------------

const resultNodeToSubmissionNode = (
  node: ResultNode,
  position?: { x: number; y: number },
): GraphSubmissionNode => ({
  x: position?.x ?? 0,
  y: position?.y ?? 0,
  data: {
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
    signature: node.signature,
  },
});

const resultEdgeToSubmissionEdge = (edge: ResultEdge): GraphSubmissionEdge => ({
  data: {
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
  },
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
  const subNodes: GraphSubmissionNode[] = [];
  nodeIds.forEach((id, index) => {
    const node = getNodeById(resultSet, id);
    if (!node) return;
    const position = useCustomPlacement
      ? estimatePlacementNearNodes(existingNodes, index)
      : undefined;
    subNodes.push(resultNodeToSubmissionNode(node, position));
  });
  const subEdges: GraphSubmissionEdge[] = [];
  for (const id of edgeIds) {
    const edge = getRawEdgeById(resultSet, id);
    if (edge) subEdges.push(resultEdgeToSubmissionEdge(edge));
  }
  return buildGraphSubmission(subNodes, subEdges, undefined, source);
};
