import { Path, ResultSet, ResultEdge, ResultNode } from '@/features/ResultList/types/results.d';
import { getEdgeById, getEdgesByIds, getNodeById, getPathById, getRawEdgeById } from '@/features/ResultList/slices/resultsSlice';
import { isNodeIndex } from '@/features/ResultList/utils/resultsInteractionFunctions';

const DEFAULT_EDGE_METADATA = {
  edge_bindings: [],
  inverted_id: null,
  is_root: false,
};

const EMPTY_EDGE: ResultEdge = {
  aras: [],
  id: "",
  is_root: false,
  compressed_edges: [],
  knowledge_level: "unknown",
  metadata: DEFAULT_EDGE_METADATA,
  object: "",
  predicate: "",
  predicate_url: "",
  description: "",
  provenance: [],
  publications: {},
  signature: "",
  source_time: "",
  subject: "",
  trials: [],
  tags: {},
};

const EMPTY_ANNOTATIONS: ResultNode['annotations'] = {
  chemical: {
    approval: null,
    clinical_trials: null,
    descriptions: null,
    indications: null,
    otc_status: null,
    roles: null,
    synonyms: null,
  },
  disease: {
    clinical_trials: null,
    curies: null,
    descriptions: null,
    synonyms: null,
  },
  gene: {
    descriptions: null,
    name: null,
    species: null,
    tdl: null,
  },
};

const cloneEmptyAnnotations = (): ResultNode['annotations'] => ({
  chemical: { ...EMPTY_ANNOTATIONS.chemical },
  disease: { ...EMPTY_ANNOTATIONS.disease },
  gene: { ...EMPTY_ANNOTATIONS.gene },
});

const EMPTY_NODE: ResultNode = {
  annotations: EMPTY_ANNOTATIONS,
  aras: [],
  curies: [],
  descriptions: [],
  id: "",
  names: [],
  other_names: {},
  provenance: [],
  signature: "",
  source_time: "",
  synonyms: [],
  tags: {},
  types: [],
};

export const getDefaultEdge = (edge: ResultEdge | undefined): ResultEdge => {
  if (!edge) return { ...EMPTY_EDGE, metadata: { ...DEFAULT_EDGE_METADATA } };
  return { ...EMPTY_EDGE, ...edge };
};

export const getDefaultNode = (node: ResultNode | undefined): ResultNode => {
  if (!node) {
    return {
      ...EMPTY_NODE,
      annotations: cloneEmptyAnnotations(),
      other_names: {},
      tags: {},
    };
  }
  return {
    ...EMPTY_NODE,
    ...node,
    annotations: node.annotations ?? cloneEmptyAnnotations(),
    other_names: node.other_names ?? {},
    tags: node.tags ?? {},
  };
};

/**
 * Reduces a subgraph to its node sequence. Paths sharing a node sequence are
 * interchangeable for display and get compressed into a single group.
 */
export const extractPathSequence = (subgraph: string[]): string[] => {
  return subgraph.filter((_, i) => isNodeIndex(i));
};

export const getPathSequenceKey = (resultSet: ResultSet, path: string | Path): string | null => {
  const resolved = (typeof path === "string") ? getPathById(resultSet, path) : path;
  if (!resolved) return null;
  return JSON.stringify(extractPathSequence(resolved.subgraph));
};

export const getPathCount = (resultSet: ResultSet, paths: (string | Path)[]): number => {
  const sequences = new Set<string>();
  for (const p of paths) {
    const key = getPathSequenceKey(resultSet, p);
    if (key) {
      sequences.add(key);
    }
  }
  return sequences.size;
};

const mergeArrays = <T,>(arr1: T[], arr2: T[]): T[] => Array.from(new Set([...arr1, ...arr2]));

const mergePublications = (target: ResultEdge, source: ResultEdge) => {
  for (const [key, value] of Object.entries(source.publications)) {
    if (!target.publications[key]) {
      target.publications = {
        ...target.publications,
        [key]: value,
      };
    } else {
      target.publications = {
        ...target.publications,
        [key]: mergeArrays(target.publications[key], value),
      };
    }
  }
};

const mergeEdgeIntoBase = (baseEdge: ResultEdge, currentEdge: ResultEdge): void => {
  if (currentEdge.predicate === baseEdge.predicate) {
    baseEdge.aras = mergeArrays(baseEdge.aras, currentEdge.aras);
    baseEdge.provenance = mergeArrays(baseEdge.provenance, currentEdge.provenance);
    mergePublications(baseEdge, currentEdge);
    return;
  }
  const compressedEdge = baseEdge.compressed_edges?.find(e => e.predicate === currentEdge.predicate);
  if (compressedEdge) {
    compressedEdge.aras = mergeArrays(compressedEdge.aras, currentEdge.aras);
    compressedEdge.provenance = mergeArrays(compressedEdge.provenance, currentEdge.provenance);
    mergePublications(compressedEdge, currentEdge);
  } else {
    baseEdge.compressed_edges?.push({ ...currentEdge, compressed_edges: [] });
  }
};

export const getCompressedEdge = (resultSet: ResultSet, edgeIDs: string[]): ResultEdge => {
  const edges = edgeIDs.map(edgeID => getEdgeById(resultSet, edgeID)).filter(edge => !!edge);

  if (edges.length === 0 || !edges[0]) {
    console.warn("No valid edges found for the provided edgeIDs.", edges);
    return getDefaultEdge(undefined);
  }

  const baseEdge: ResultEdge = { ...getDefaultEdge(edges[0]), compressed_edges: [] };

  for (const edge of edges.slice(1)) {
    if (!edge) continue;
    mergeEdgeIntoBase(baseEdge, getDefaultEdge(edge));
  }

  return baseEdge;
};

/**
 * One representative edge per distinct raw predicate within a compressed group.
 * Uses raw predicates so display rewrites (e.g. treat → impact) do not collapse distinct edges.
 */
export const getDistinctResultEdges = (resultSet: ResultSet, edgeIDs: string[]): ResultEdge[] => {
  const seenPredicates = new Set<string>();
  const edges: ResultEdge[] = [];
  for (const edgeID of edgeIDs) {
    const edge = getRawEdgeById(resultSet, edgeID);
    if (!edge || seenPredicates.has(edge.predicate)) continue;
    seenPredicates.add(edge.predicate);
    edges.push(edge);
  }
  return edges;
};

/** One representative edge ID per distinct raw predicate within a compressed group. */
export const getDistinctPredicateEdgeIDs = (resultSet: ResultSet, edgeIDs: string[]): string[] =>
  getDistinctResultEdges(resultSet, edgeIDs).map(edge => edge.id);

export const getCompressedEdges = (resultSet: ResultSet, edges: ResultEdge[]): ResultEdge[] => {
  const compressedEdges: ResultEdge[] = [];
  edges.sort((a,b)=> a.predicate.localeCompare(b.predicate));
  let edgeIDsToCompress: Set<string> = new Set<string>([]);
  for(let i = 0; i < edges.length; i++) {
    let edge = edges[i];
    let nextEdge: undefined | ResultEdge = edges[i+1];
    if(!!nextEdge && nextEdge.predicate === edge.predicate) {
      if(!edgeIDsToCompress.has(edge.id))
        edgeIDsToCompress.add(edge.id);
      edgeIDsToCompress.add(nextEdge.id);
    } else {
      if(edgeIDsToCompress.size > 0) {
        let compressedEdge = getCompressedEdge(resultSet, Array.from(edgeIDsToCompress));
        edgeIDsToCompress.clear();
        compressedEdges.push(compressedEdge);
      } else {
        compressedEdges.push(edge);
      }
    }
  }

  return compressedEdges.sort((a, b) =>
    Object.values(b.publications).reduce((acc, curr) => acc + curr.length, 0) - Object.values(a.publications).reduce((acc, curr) => acc + curr.length, 0)
    || b.trials.length - a.trials.length
    || b.predicate.localeCompare(a.predicate)
  );
};

export const getCompressedSubgraph = (resultSet: ResultSet, subgraph: (string | string[])[]): (ResultNode | ResultEdge | ResultEdge[])[] => {
  const compressedSubgraph: (ResultNode | ResultEdge | ResultEdge[])[] = [];
  for (const [i, ID] of subgraph.entries()) {
    if (isNodeIndex(i)) {
      if (Array.isArray(ID)) continue;
      const node = getNodeById(resultSet, ID);
      if (node) compressedSubgraph.push(node);
      continue;
    }
    if (!Array.isArray(ID)) {
      const edge = getEdgeById(resultSet, ID);
      if (edge) compressedSubgraph.push(edge);
    } else {
      compressedSubgraph.push(getCompressedEdges(resultSet, getEdgesByIds(resultSet, ID)));
    }
  }
  return compressedSubgraph;
};

export const getStringNameFromPath = (resultSet: ResultSet, path: Path): string => {
  let stringName = "";
  for(const [i, id] of path.subgraph.entries()) {
    if(isNodeIndex(i)) {
      const node = getNodeById(resultSet, id);
      stringName += node?.names[0];
    } else {
      const edge = getEdgeById(resultSet, id);
      stringName += edge?.predicate;
    }
  }
  return stringName.trimEnd();
};

export const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every(item => typeof item === "string");
};
