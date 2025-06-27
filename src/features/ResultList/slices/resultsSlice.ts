import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ResultNode, ResultEdge, Path, ResultSet, Result } from "@/features/ResultList/types/results.d";
import { PublicationObject, TrialObject } from "@/features/Evidence/types/evidence";
import { cloneDeep } from "lodash";

type ResultState = {
  [key: string]: ResultSet
};

const initialState: ResultState = {};

const resultSetsSlice = createSlice({
  name: "resultSets",
  initialState,
  reducers: {
    setResultSet(state, action: PayloadAction<{ pk: string; resultSet: ResultSet }>) {
      state[action.payload.pk] = action.payload.resultSet;
    },
    setResultSets(state, action: PayloadAction<{[key:string]: ResultSet}>) {
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
export const getNodeById = (resultSet: ResultSet | null, id?: string): ResultNode | undefined => (resultSet === null || !id) ? undefined : resultSet.data.nodes[id];
export const getEdgeById = (resultSet: ResultSet | null, id?: string): ResultEdge | undefined => (resultSet === null || !id) ? undefined : resultSet.data.edges[id];
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
    console.warn(`Unable to find result set with pk: ${id}.`);
    return null;
  }
  return state.resultSets[id];
}

export const removeResultSetById = (id: string | null | undefined) => (state: {resultSets: ResultState}) => {

}

export default resultSetsSlice.reducer;