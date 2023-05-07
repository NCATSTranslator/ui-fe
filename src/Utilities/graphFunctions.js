export const layoutList = {
  breadthfirst: {
    name: 'breadthfirst', spacingFactor: 1.1, avoidOverlap: true, directed: true
  },
  dagre: {
    name: 'dagre', spacingFactor: 1.1
  },
  klay: {
    name: 'klay', spacingFactor: 1.3, klay:{direction: 'RIGHT', edgeSpacingFactor: .1}, 
    ready: (ev)=>{ 
      if(ev.target?.options?.eles?.length < 10) { 
        ev.cy.zoom({level:1.5}); 
        ev.cy.center(); 
      }
    }
  },
  random: {
    name: 'random'
  },
  avsdf: {
    name: 'avsdf'
  },
  circle: {
    name: 'circle'
  },
  concentric: {
    name: 'concentric'
  },
  cose: {
    name: 'cose'
  }
}

export const resultToCytoscape = (result, summary) => {
  const makeNode = (n, name) =>
  {
    const height = (name.length) < 40 ? 40 : name.length + 20;
    return {
      data: {
        id: n,
        label: name,
        height: height
      }
    };
  }

  const makeNodes = (ns, nodes) => 
  {
    return [...ns].map((n) => { return makeNode(n, nodes[n].names[0]); });
  }

  const makeEdge = (eid, src, tgt, pred) =>
  {
    return {
      data: {
        id: eid,
        source: src,
        target: tgt,
        label: pred
      }
    };
  }

  const makeEdges = (es, edges) =>
  {
    return [...es].map((e) =>
      {
        return makeEdge(e, edges[e].subject, edges[e].object, edges[e].predicate);
      });
  }

  const ps = result.paths;
  const ns = new Set();
  const es = new Set();
  ps.forEach((p) =>
  {
    summary.paths[p].subgraph.forEach((elem, i) =>
      {
        if (i % 2 === 0)
        {
          ns.add(elem);
        }
        else
        {
          es.add(elem);
        }
      });
  });

  const c = {
    nodes: makeNodes(ns, summary.nodes),
    edges: makeEdges(es, summary.edges)
  };

  return c;
}

export const findPaths = (start, end, graph, visited = new Set(), paths = new Set()) => {
  // Base case: if the start and end nodes are the same, return a single-element set containing the start node
  if (start === end) {
    return new Set([[start]]);
  }

  // Mark the current node as visited
  visited.add(start);

  // Recursive case: for each edge starting at the start node, find the paths that start at the next node
  for (const edge of graph.edges) {
    if (edge.data.source === start && !visited.has(edge.data.target)) {
      const nextVisited = new Set(visited);
      nextVisited.add(edge.data.target);
      const nextPaths = findPaths(edge.data.target, end, graph, nextVisited, new Set(paths));
      for (const path of nextPaths) {
        if (!path.includes(start)) {
          paths.add(JSON.stringify([start, ...path]));
        }
      }
    }
  }

  // Remove the current node from the visited set
  visited.delete(start);

  // Return all the paths that end at the target node
  return new Set(Array.from(paths, path => JSON.parse(path)).filter(path => path[path.length - 1] === end));
}  
