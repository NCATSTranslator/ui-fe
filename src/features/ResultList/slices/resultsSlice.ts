import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ResultNode, ResultEdge, Path, ResultSet, Result, Species } from "@/features/ResultList/types/results.d";
import { PublicationObject, Provenance, SourceObject, TrialObject } from "@/features/Evidence/types/evidence";
import { cloneDeep } from "lodash";
import { replaceTreatWithImpact } from "@/features/Common/utils/utilities";

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
  return node.annotations?.gene?.species || null;
}
export const getEdgeById = (resultSet: ResultSet | null, id?: string): ResultEdge | undefined => {
  let edge: ResultEdge | undefined = (resultSet === null || !id) ? undefined : resultSet.data.edges[id];
  if(!edge) {
    console.warn(`Unable to find edge with id: ${id} within result set.`);
    return undefined;
  }

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
 * Resolves an edge's provenance by prioritizing edge specific provenance information
 * over generic provenance information.
 */
export const getEdgeProvenance = (resultSet: ResultSet | null, edge: ResultEdge | undefined): Provenance[] => {
  if (!resultSet || !edge?.provenance) return [];
  return edge.provenance.map((source): Provenance => {
    const provenance = resultSet.data.provenance?.[source.infores];
    const sourceRecord = (source.records && source.records.length > 0) ? source.records[0] : null;
    return {
      infores: source.infores,
      knowledge_level: provenance?.knowledge_level ?? "",
      name: provenance?.name ?? null,
      url: (null !== sourceRecord) ? sourceRecord : provenance?.url ?? null,
      wiki: provenance?.wiki ?? null,
    };
  });
}

/**
 * Resolves the display source for a publication from an infores id.
 */
export const getPublicationSource = (resultSet: ResultSet | null, infores: string | undefined, edge?: ResultEdge): SourceObject | undefined => {
  if (!resultSet || !infores) return undefined;
  const provenance = resultSet.data.provenance?.[infores];
  if (!provenance) return undefined;
  const recordUrl = edge?.provenance.find(source => source.infores === infores)?.records[0];
  return {
    knowledge_level: provenance.knowledge_level,
    name: provenance.name ?? "",
    url: recordUrl || provenance.url || "",
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

export default resultSetsSlice.reducer;
