import { ResultItem, FormattedEdgeObject, FormattedNodeObject } from "../Types/results";
import { isFormattedNodeObject } from "./utilities";

export type ResultContextObject = {
  id: string;
  name: string;
  paths: string[];
}

export const genTopNResultsContext = (results: ResultItem[], n: number) => {
  n = Math.min(n, results.length);
  const resultContexts = [];
  for (let i = 0; i < n; i++) {
    resultContexts.push(genResultContext(results[i]));
  }
  return resultContexts;
}

export const genResultContext = (result: ResultItem): ResultContextObject => {
  const name = result.name;
  const seenPids = new Set();
  const pathStrings = new Set<string>();
  const pathsLeft = !!result.paths ?[...result.paths] : false;
  while (!!pathsLeft && pathsLeft.length !== 0) {
    const path = pathsLeft.pop();
    if(!path)
      break;
    const pid = path.id;
    seenPids.add(pid);
    const subgraph = path.path.subgraph;
    const pathString = genPathString(subgraph);
    if (!pathString) {
      console.error(`Unexpected missing path in summary: ${pid}`);
      continue;
    }
    pathStrings.add(pathString);
    for (let i = 1; i < subgraph.length; i+=2) {
      const nextEdgeItem = subgraph[i] as FormattedEdgeObject;
      if(!!nextEdgeItem.support) {
        for (let supPath of nextEdgeItem.support) {
          const spid = supPath.id;
          if (!seenPids.has(spid)) {
            pathsLeft.push(supPath);
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

const genPathString = (subgraph: (FormattedEdgeObject | FormattedNodeObject)[]) => {
  if (subgraph === undefined) {
    return false;
  }
  const pathNames = subgraph.map((obj) => {
    if (isFormattedNodeObject(obj)) 
      return getNodeName(obj);

    return `[${getPredicateName(obj)}]`;
  });
  return pathNames.join('-');
}

const getNodeName = (node: FormattedNodeObject) => {
  return node.name;
}

const getPredicateName = (edge: FormattedEdgeObject) => {
  if(edge.predicates)
    return edge.predicates[0].predicate;

  console.warn(`No predicate found for edge: ${edge} when generating result context for summarization.`);
  return "";
}
