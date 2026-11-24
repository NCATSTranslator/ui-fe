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
    curies: null,
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
    curies: null,
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

/**
 * A subgraph alternates node, edge, node, so a single hop is exactly three
 * entries.
 */
export const isOneHopPath = (path: Path | null | undefined): boolean => {
  return path?.subgraph.length === 3;
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

/** Folds an edge into the group edge that shares its predicate, pooling their evidence and sources. */
const mergeSamePredicateEdge = (target: ResultEdge, source: ResultEdge): void => {
  target.aras = mergeArrays(target.aras, source.aras);
  target.provenance = mergeArrays(target.provenance, source.provenance);
  target.trials = mergeArrays(target.trials, source.trials);
  mergePublications(target, source);
};

const KNOWLEDGE_LEVEL_RANK: Record<string, number> = { trusted: 2, ml: 0 };

/** Curated knowledge outranks unlabelled knowledge, which outranks text-mined/ML knowledge. */
const getKnowledgeLevelRank = (edge: ResultEdge): number => KNOWLEDGE_LEVEL_RANK[edge.knowledge_level] ?? 1;

/**
 * Distinct publication entries plus clinical trials backing an edge. Publication entries are
 * everything listed under the edge's publications: PubMed and PMC articles, drug labels, and
 * other links alike.
 */
const getEvidenceCount = (edge: ResultEdge): number => {
  const pubIDs = new Set<string>();
  for (const pubs of Object.values(edge.publications))
    for (const pub of pubs) pubIDs.add(pub.id);
  return pubIDs.size + new Set(edge.trials).size;
};

const getSourceCount = (edge: ResultEdge): number => new Set(edge.provenance.map(p => p.infores)).size;

/** Edges sharing a predicate, merged into one edge, with the best knowledge level among them. */
type PredicateGroup = { edge: ResultEdge; knowledgeLevelRank: number };

/** A predicate group with its counts worked out once, ahead of sorting. */
type RankedPredicateGroup = PredicateGroup & { evidenceCount: number; sourceCount: number };

const toRankedGroup = (group: PredicateGroup): RankedPredicateGroup => ({
  ...group,
  evidenceCount: getEvidenceCount(group.edge),
  sourceCount: getSourceCount(group.edge),
});

/**
 * Orders predicate groups from most to least valuable: evidence count, knowledge level, source
 * count, ARA count, then predicate specificity. Ties fall back to predicate and ID so the order
 * is stable across renders.
 */
const comparePredicateGroups = (a: RankedPredicateGroup, b: RankedPredicateGroup): number =>
  b.evidenceCount - a.evidenceCount
  || b.knowledgeLevelRank - a.knowledgeLevelRank
  || b.sourceCount - a.sourceCount
  || b.edge.aras.length - a.edge.aras.length
  || (b.edge.predicate_rank ?? 0) - (a.edge.predicate_rank ?? 0)
  || a.edge.predicate.localeCompare(b.edge.predicate)
  || a.edge.id.localeCompare(b.edge.id);

/**
 * Compares two edges by value, most valuable first. See comparePredicateGroups for the tiers.
 *
 * Note: exported so the ranking tiers can be unit tested on their own. Nothing else calls it;
 * the app ranks edges through getCompressedEdge and getCompressedEdges.
 */
export const compareEdgeValue = (a: ResultEdge, b: ResultEdge): number =>
  comparePredicateGroups(
    toRankedGroup({ edge: a, knowledgeLevelRank: getKnowledgeLevelRank(a) }),
    toRankedGroup({ edge: b, knowledgeLevelRank: getKnowledgeLevelRank(b) }),
  );

/**
 * Merges edges that share a predicate and returns the groups most valuable first. Each group
 * keeps the ID of its first edge. A pinned edge leads its group, and that group leads the list.
 */
const getRankedPredicateGroups = (edges: ResultEdge[], pinnedEdgeId?: string): ResultEdge[] => {
  const pinnedEdge = pinnedEdgeId ? edges.find(edge => edge.id === pinnedEdgeId) : undefined;
  const ordered = pinnedEdge ? [pinnedEdge, ...edges.filter(edge => edge !== pinnedEdge)] : edges;

  const groups = new Map<string, PredicateGroup>();
  for (const edge of ordered) {
    const group = groups.get(edge.predicate);
    if (group) {
      mergeSamePredicateEdge(group.edge, edge);
      group.knowledgeLevelRank = Math.max(group.knowledgeLevelRank, getKnowledgeLevelRank(edge));
    } else {
      groups.set(edge.predicate, {
        edge: { ...getDefaultEdge(edge), compressed_edges: [] },
        knowledgeLevelRank: getKnowledgeLevelRank(edge),
      });
    }
  }

  const isPinned = (group: PredicateGroup) => !!pinnedEdge && group.edge.predicate === pinnedEdge.predicate;
  return Array.from(groups.values(), toRankedGroup)
    .sort((a, b) => Number(isPinned(b)) - Number(isPinned(a)) || comparePredicateGroups(a, b))
    .map(group => group.edge);
};

/**
 * Compresses edges between the same two nodes into one edge. Edges are grouped by predicate, and
 * the most valuable group becomes the returned edge, with the rest in compressed_edges in rank
 * order.
 *
 * @param {ResultSet} resultSet - Result Set to fetch the edges from.
 * @param {string[]} edgeIDs - IDs of the edges to compress.
 * @param {string} [pinnedEdgeId] - An edge that must be the returned edge, whatever its rank.
 */
export const getCompressedEdge = (resultSet: ResultSet, edgeIDs: string[], pinnedEdgeId?: string): ResultEdge => {
  const edges = getEdgesByIds(resultSet, edgeIDs);

  if (edges.length === 0) {
    console.warn("No valid edges found for the provided edgeIDs.", edges);
    return getDefaultEdge(undefined);
  }

  const [topEdge, ...otherEdges] = getRankedPredicateGroups(edges, pinnedEdgeId);
  return { ...topEdge, compressed_edges: otherEdges };
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

/** One merged edge per distinct predicate, most valuable first. */
export const getCompressedEdges = (edges: ResultEdge[]): ResultEdge[] => getRankedPredicateGroups(edges);

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
      compressedSubgraph.push(getCompressedEdges(getEdgesByIds(resultSet, ID)));
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
