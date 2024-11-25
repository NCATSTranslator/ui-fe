import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ResultNode, ResultEdge, Path, Publication, ResultSet, Result } from "../Types/results";
import { cloneDeep } from "lodash";

type ResultState = {
  resultSet: ResultSet | null;
};

const initialState: ResultState = {
  resultSet: null,
};

const resultSetSlice = createSlice({
  name: "resultSet",
  initialState,
  reducers: {
    setResultSet(state, action: PayloadAction<ResultSet>) {
      state.resultSet = action.payload;
    },
  },
});

export const { setResultSet } = resultSetSlice.actions;

export const getResultById = (resultSet: ResultSet | null, id:string): Result | undefined => (resultSet === null) ? undefined : resultSet.data.results.find((result)=> result.id === id);
export const getPathById = (resultSet: ResultSet | null, id:string): Path | undefined => {
  if(resultSet === null)
    return undefined;
  if(!resultSet.data.paths[id]) {
    console.warn(`Unable to find path with id ${id} within result set.`);
    return undefined;
  }
  let path = cloneDeep(resultSet.data.paths[id]);
  path.id = id;
  return path;
}
export const getPathsByIds = (resultSet: ResultSet | undefined | null, pathIDs: string[]): Path[] => {
  if(!resultSet)
    return [];

  return pathIDs.map(pathID => getPathById(resultSet, pathID)).filter((path): path is Path => path !== undefined)
  // let paths = pathIDs.map(pathID => getPathById(resultSet, pathID)).filter((path): path is Path => path !== undefined);
  // return (paths) ? paths : [];
}
export const getNodeById = (resultSet: ResultSet | null, id:string): ResultNode | undefined => (resultSet === null) ? undefined : resultSet.data.nodes[id];
export const getEdgeById = (resultSet: ResultSet | null, id:string): ResultEdge | undefined => (resultSet === null) ? undefined : resultSet.data.edges[id];
export const getPubById = (resultSet: ResultSet | null, id:string): Publication | undefined => (resultSet === null) ? undefined : resultSet.data.publications[id];

export const currentResultSet = (state: { resultSet: ResultState }) => state.resultSet.resultSet;

export default resultSetSlice.reducer;