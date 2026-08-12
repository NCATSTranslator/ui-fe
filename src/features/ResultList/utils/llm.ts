import { getEdgeById, getNodeById, getPathById } from "@/features/ResultList/slices/resultsSlice";
import { ResultEdge, ResultNode, ResultSet, Result } from "@/features/ResultList/types/results.d";
import { isResultNode, isResultEdge } from "@/features/ResultList/types/checkers";
import { isNodeIndex } from "./resultsInteractionFunctions";

export type ResultContextObject = {
  id: string;
  name: string;
  paths: string[];
}

export const genTopNResultsContext = (resultSet: ResultSet, results: Result[], n: number) => {
  const newN = Math.min(n, results.length);
  const resultContexts = [];
  for (let i = 0; i < newN; i++) {
    resultContexts.push(genResultContext(resultSet, results[i]));
  }
  return resultContexts;
}

export const genResultContext = (resultSet: ResultSet, result: Result): ResultContextObject => {
  const name = result.drug_name;
  const pathStrings = new Set<string>();
  for (const p of result.paths ?? []) {
    const path = (typeof p === "string") ? getPathById(resultSet, p) : p;
    const pathID = (typeof p === "string") ? p : p.id;
    if(!path)
      continue;
    const pathString = genPathString(resultSet, path.subgraph);
    if (!pathString) {
      console.error(`Unexpected missing path in summary: ${pathID}`);
      continue;
    }
    pathStrings.add(pathString);
  }
  return {
    name: name,
    paths: [...pathStrings],
    id: result.id
  };
}

const genPathString = (resultSet: ResultSet, subgraph: string[]) => {
  if (subgraph === undefined) {
    return false;
  }
  const pathNames = subgraph.map((id, i) => {
    let obj;
    if(isNodeIndex(i))
      obj = getNodeById(resultSet, id);
    else 
      obj = getEdgeById(resultSet, id);

    if(isResultNode(obj)) 
      return getNodeName(obj);

    if(isResultEdge(obj))
      return `[${getPredicateName(obj)}]`;

    return "";
  });
  return pathNames.join('-');
}

const getNodeName = (node: ResultNode) => {
  return node.names[0];
}

const getPredicateName = (edge: ResultEdge) => {
  if(edge.predicate)
    return edge.predicate;

  console.warn(`No predicate found for edge: ${edge} when generating result context for summarization.`);
  return "";
}
