export function genTopNResultsContext(results, n) {
  n = Math.min(n, results.length);
  const resultContexts = [];
  for (let i = 0; i < n; i++) {
    resultContexts.push(genResultContext(results[i], summary));
  }
  return resultContexts;
}

export function genResultContext(result) {
  const name = result.name;
  const seenPids = new Set();
  const pathStrings = new Set();
  const pathsLeft = [...result.paths];
  while (pathsLeft.length !== 0) {
    const path = pathsLeft.pop();
    const pid = path.id;
    seenPids.add(pid);
    const subgraph = path.path.subgraph;
    console.log(subgraph);
    const pathString = genPathString(subgraph);
    if (!pathString) {
      console.error(`Unexpected missing path in summary: ${pid}`);
      continue;
    }
    pathStrings.add(pathString);
    for (let i = 1; i < subgraph.length; i+=2) {
      for (let edge of subgraph[i].edges) {
        for (let supPath of edge.support) {
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
    paths: [...pathStrings]
  };
}

function genPathString(subgraph) {
  if (subgraph === undefined) {
    return false;
  }
  const pathNames = subgraph.map((obj, i) => {
    if (i%2 === 0) {
      return getNodeName(obj);
    }
    return `[${getPredicateName(obj)}]`;
  });
  return pathNames.join('-');
}

function getNodeName(node) {
  return node.name;
}

function getPredicateName(edge) {
  return edge.edges[0].predicate.predicate;
}
