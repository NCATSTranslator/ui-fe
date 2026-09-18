import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { ResultNode, ResultEdge, Path, ResultSet, Result, Species } from "@/features/ResultList/types/results.d";
import { PublicationObject, Provenance, ProvenanceCatalogEntry, SourceObject, TrialObject } from "@/features/Evidence/types/evidence";
import cloneDeep from "lodash/cloneDeep";
import { replaceTreatWithImpact } from '@/features/Core/utils/stringFormatters';

type ResultState = {
  [key: string]: ResultSet
};

const initialState: ResultState = {};

const resultSetsSlice = createSlice({
  name: "resultSets",
  initialState,
  reducers: {
    setResultSet: (state, action: PayloadAction<{ pk: string; resultSet: ResultSet }>) => {
      state[action.payload.pk] = action.payload.resultSet;
    },
    setResultSets: (state, action: PayloadAction<{[key:string]: ResultSet}>) => {
      Object.assign(state, action.payload);
    },
  },
});

export const { setResultSet, setResultSets } = resultSetsSlice.actions;

export const getResultById = (resultSet: ResultSet | null, id:string): Result | undefined => (resultSet === null) ? undefined : resultSet.data.results.find((result)=> result.id === id);
export const getPathById = (resultSet: ResultSet | null, id:string): Path | null => {
  if(resultSet === null)
    return null;
  if(!resultSet.data.paths[id]) {
    console.warn(`Unable to find path with id: ${id} within result set.`);
    return null;
  }
  let path = cloneDeep(resultSet.data.paths[id]);
  path.id = id;
  return path;
}
export const getPathsByIds = (resultSet: ResultSet | undefined | null, pathIDs: string[]): Path[] => {
  if(!resultSet)
    return [];

  return pathIDs.map(pathID => getPathById(resultSet, pathID)).filter((path): path is Path => path !== undefined)
}
export const getNodeById = (resultSet: ResultSet | null, id?: string): ResultNode | undefined => {
  let node: ResultNode | undefined = (resultSet === null || !id) ? undefined : resultSet.data.nodes[id];
  if(!node) {
    console.warn(`Unable to find node with id: ${id} within result set.`);
    return undefined;
  }
  return node;
}
export const getNodeSpecies = (node: ResultNode): Species => {
  return node.annotations?.gene?.species?.value ?? null;
}
export const getRawEdgeById = (resultSet: ResultSet | null, id?: string): ResultEdge | undefined => {
  const edge: ResultEdge | undefined = (resultSet === null || !id) ? undefined : resultSet.data.edges[id];
  if(!edge) {
    console.warn(`Unable to find edge with id: ${id} within result set.`);
    return undefined;
  }
  return edge;
};

export const getEdgeById = (resultSet: ResultSet | null, id?: string): ResultEdge | undefined => {
  const edge = getRawEdgeById(resultSet, id);
  if(!edge)
    return undefined;

  // Temporary fix to not display the "treats" predicate in the UI
  if(edge.predicate.includes("treat")) {
    let newEdge = cloneDeep(edge);
    newEdge.predicate = replaceTreatWithImpact(newEdge.predicate);
    newEdge.predicate_url = "";
    return newEdge;
  }

  return edge;
}
export const getEdgesByIds = (resultSet: ResultSet | null, ids:string[]): ResultEdge[] => {
  if(!resultSet)
    return [];
  const edges: ResultEdge[] = [];
  for(const edgeID of ids) {
    const edge = getEdgeById(resultSet, edgeID)
    if(!!edge)
      edges.push(edge);
  }
  return edges;
}
export const getPubById = (resultSet: ResultSet | null, id:string): PublicationObject | undefined => (resultSet === null) ? undefined : resultSet.data.publications[id];

/**
 * Resolves a catalog entry from the result set when present, otherwise from an explicit catalog
 * (used for canvas-only evidence that has no result set).
 */
export const resolveProvenanceCatalogEntry = (
  resultSet: ResultSet | null,
  infores: string,
  provenanceCatalog: Record<string, ProvenanceCatalogEntry> = {},
): ProvenanceCatalogEntry | undefined =>
  resultSet
    ? resultSet.data.provenance?.[infores]
    : provenanceCatalog[infores];

/** Prefers an edge-specific record URL, then the catalog URL, then `emptyFallback`. */
const resolveProvenanceUrl = <T extends string | null>(
  recordUrl: string | null | undefined,
  catalogUrl: string | null | undefined,
  emptyFallback: T,
): string | T => recordUrl ?? catalogUrl ?? emptyFallback;

/**
 * Resolves an edge's provenance by prioritizing edge specific provenance information
 * over generic provenance information.
 */
export const getEdgeProvenance = (
  resultSet: ResultSet | null,
  edge: ResultEdge | undefined,
  provenanceCatalog: Record<string, ProvenanceCatalogEntry> = {},
): Provenance[] => {
  if (!edge?.provenance) return [];
  return edge.provenance.map((source): Provenance => {
    const catalogEntry = resolveProvenanceCatalogEntry(resultSet, source.infores, provenanceCatalog);
    const sourceRecord = source.records?.length > 0 ? source.records[0] : null;
    return {
      infores: source.infores,
      knowledge_level: catalogEntry?.knowledge_level ?? "",
      name: catalogEntry?.name ?? source.infores,
      url: resolveProvenanceUrl(sourceRecord, catalogEntry?.url, null),
      wiki: catalogEntry?.wiki ?? null,
    };
  });
}

// Builds a publication source without a result set: catalog details when available, else the raw infores id.
const getCatalogPublicationSource = (
  infores: string,
  recordUrl: string | undefined,
  catalogEntry: ProvenanceCatalogEntry | undefined,
): SourceObject => ({
  knowledge_level: catalogEntry?.knowledge_level ?? "",
  name: catalogEntry?.name ?? infores,
  url: resolveProvenanceUrl(recordUrl, catalogEntry?.url, ""),
});

/**
 * Resolves the display source for a publication from an infores id.
 * Without a result set (canvas-only evidence), catalog details come from `provenanceCatalog`.
 */
export const getPublicationSource = (
  resultSet: ResultSet | null,
  infores: string | undefined,
  edge?: ResultEdge,
  provenanceCatalog: Record<string, ProvenanceCatalogEntry> = {},
): SourceObject | undefined => {
  if (!infores) return undefined;
  const recordUrl = edge?.provenance.find(source => source.infores === infores)?.records?.[0];
  const catalogEntry = resolveProvenanceCatalogEntry(resultSet, infores, provenanceCatalog);
  if (!resultSet) return getCatalogPublicationSource(infores, recordUrl, catalogEntry);
  if (!catalogEntry) return undefined;
  return {
    knowledge_level: catalogEntry.knowledge_level,
    name: catalogEntry.name ?? "",
    url: resolveProvenanceUrl(recordUrl, catalogEntry.url, ""),
  };
}
export const getTrialById = (resultSet: ResultSet | null, id:string): TrialObject | undefined => (resultSet === null) ? undefined : resultSet.data.trials[id];
export const getResultSetById = (id: string | null | undefined) => (state: {resultSets: ResultState}) => {
  // if no result sets have been added, return null with no console warning
  if(!!state?.resultSets && Object.keys(state?.resultSets).length === 0)
    return null;

  // "-1" is the explicit, 'i dont have the pk yet' marker
  if(id === "-1")
    return null;

  if(!id) {
    console.warn(`No pk provided to retrieve result set.`);
    return null;
  }
  if(!state?.resultSets[id]) {
    return null;
  }
  return state.resultSets[id];
}

export const selectResultSets = (state: { resultSets: ResultState }) => state.resultSets;
export const selectResultSetKeys = createSelector(
  selectResultSets,
  (resultSets) => Object.keys(resultSets),
);

export default resultSetsSlice.reducer;
