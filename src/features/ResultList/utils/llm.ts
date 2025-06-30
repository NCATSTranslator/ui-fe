import { getEdgeById, getNodeById, getPathById } from "@/features/ResultList/slices/resultsSlice";
import { ResultEdge, ResultNode, ResultSet, Result, isResultNode, isResultEdge } from "@/features/ResultList/types/results.d";

export type ResultContextObject = {
  id: string;
  name: string;
  paths: string[];
}

export const genTopNResultsContext = (resultSet: ResultSet, results: Result[], n: number) => {
  n = Math.min(n, results.length);
  const resultContexts = [];
  for (let i = 0; i < n; i++) {
    resultContexts.push(genResultContext(resultSet, results[i]));
  }
  return resultContexts;
}

export const genResultContext = (resultSet: ResultSet, result: Result): ResultContextObject => {
  const name = result.drug_name;
  const seenPids = new Set();
  const pathStrings = new Set<string>();
  const pathsLeft = !!result.paths ?[...result.paths] : false;
  while (!!pathsLeft && pathsLeft.length !== 0) {
    const p = pathsLeft.pop();
    if(!p)
      break;
    const path = (typeof p === "string") ? getPathById(resultSet, p) : p;
    const pathID = (typeof p === "string") ? p : p.id;
    if(!path)
      break;
    seenPids.add(pathID);
    const subgraph = path.subgraph;
    const pathString = genPathString(resultSet, subgraph);
    if (!pathString) {
      console.error(`Unexpected missing path in summary: ${pathID}`);
      continue;
    }
    pathStrings.add(pathString);
    for (let i = 1; i < subgraph.length; i+=2) {
      const nextEdgeItem = getEdgeById(resultSet, subgraph[i]);
      if(!!nextEdgeItem?.support) {
        for (let supPathID of nextEdgeItem.support) {
          if (!seenPids.has(supPathID)) {
            pathsLeft.push(supPathID);
          }
        }
      }
    }
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
    if(i % 2 === 0)
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
