import { Path, ResultSet, ResultEdge, ResultNode } from '@/features/ResultList/types/results.d';
import { getEdgeById, getEdgesByIds, getNodeById, getPathById } from '@/features/ResultList/slices/resultsSlice';
import { isNodeIndex } from '@/features/ResultList/utils/resultsInteractionFunctions';

export const hasSupport = (item: ResultEdge | null | undefined): boolean => {
  return !!item && Array.isArray(item.support) && item.support.length > 0;
};

const DEFAULT_EDGE_METADATA = {
  edge_bindings: [],
  inverted_id: null,
  is_root: false,
};

const EMPTY_EDGE: ResultEdge = {
  aras: [],
  id: "",
  inferred: false,
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
  support: [],
  trials: [],
  tags: {},
  type: "",
};

export const getDefaultEdge = (edge: ResultEdge | undefined): ResultEdge => {
  if (!edge) return { ...EMPTY_EDGE, metadata: { ...DEFAULT_EDGE_METADATA } };
  return { ...EMPTY_EDGE, ...edge };
};

export const extractPathSequence = (resultSet: ResultSet, subgraph: string[]): string[] => {
  return subgraph.map((item, i) => {
    if(isNodeIndex(i))
      return item;
    const edge = getEdgeById(resultSet, item);
    return (edge?.inferred ?? false) ? "indirect" : "direct";
  });
};

export const getPathSequenceKey = (resultSet: ResultSet, path: string | Path): string | null => {
  const resolved = (typeof path === "string") ? getPathById(resultSet, path) : path;
  if (!resolved) return null;
  return JSON.stringify(extractPathSequence(resultSet, resolved.subgraph));
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

export const isPathIndirectEdge = (resultSet: ResultSet, path: Path): boolean => {
  if (!(path.subgraph && path.subgraph.length === 3)) return false;
  const edge = getEdgeById(resultSet, path.subgraph[1]);
  return edge?.inferred ?? false;
};

const mergeArrays = <T,>(arr1: T[], arr2: T[]): T[] => Array.from(new Set([...arr1, ...arr2]));

const mergeSupport = (baseEdge: ResultEdge, edge: ResultEdge) => {
  if (Array.isArray(baseEdge.support) && Array.isArray(edge.support))
    baseEdge.support = mergeArrays(baseEdge.support as string[], edge.support as string[]);
};

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
    mergeSupport(baseEdge, currentEdge);
    mergePublications(baseEdge, currentEdge);
    return;
  }
  const compressedEdge = baseEdge.compressed_edges?.find(e => e.predicate === currentEdge.predicate);
  if (compressedEdge) {
    compressedEdge.aras = mergeArrays(compressedEdge.aras, currentEdge.aras);
    compressedEdge.provenance = mergeArrays(compressedEdge.provenance, currentEdge.provenance);
    mergeSupport(compressedEdge, currentEdge);
    mergePublications(compressedEdge, currentEdge);
  } else {
    if (currentEdge.support.length > 0 && baseEdge.support.length > 0)
      mergeSupport(baseEdge, currentEdge);
    baseEdge.compressed_edges?.push({ ...currentEdge, inferred: hasSupport(currentEdge), compressed_edges: [] });
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

  baseEdge.inferred = hasSupport(baseEdge);
  return baseEdge;
};

export const getCompressedEdges = (resultSet: ResultSet, edges: ResultEdge[]): ResultEdge[] => {
  const compressedEdges: ResultEdge[] = [];
  edges.sort((a,b)=> a.predicate.localeCompare(b.predicate));
  let edgeIDsToCompress: Set<string> = new Set<string>([]);
  for(let i = 0; i < edges.length; i++) {
    let edge = edges[i];
    let nextEdge: undefined | ResultEdge = edges[i+1];
    if(!!nextEdge
      && nextEdge.predicate === edge.predicate
      && nextEdge.inferred === edge.inferred
    ) {
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
