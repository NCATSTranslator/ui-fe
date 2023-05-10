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
        height: height,
        isTargetCount: 0,
        isSourceCount: 0,
        isTargetEdges: [],
        isSourceEdges: []
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

  for(const node of c.nodes) {
    for(const edge of c.edges) {
      // calculate source counts for each node
      if(node.data.id === edge.data.source) {
        node.data.isSourceCount++;
        node.data.isSourceEdges.push(edge);
      }
      // calculate target counts for each node
      if(node.data.id === edge.data.target) {
        node.data.isTargetCount++;
        node.data.isTargetEdges.push(edge);
      }
    }
  }

  return c;
}

/**
 * Finds all paths in a graph from a start node to any node in a set of end nodes.
 * The paths are restricted to a maximum length of 5 nodes.
 *
 * @param {string} start - The starting node identifier.
 * @param {Set} ends - A Set of end node identifiers.
 * @param {Object} graph - The graph object, expected to have an 'edges' property, 
 *                         which is an array of objects each having 'data' property 
 *                         that includes 'source' and 'target' properties.
 * @returns {Set} A set of all paths from the start node to any of the nodes in the 'ends' set. 
 *                  Each path is represented as an array of node identifiers.
 * @example
 * const paths = findPaths('node1', new Set(['node3', 'node4']), graph);
 */
export const findPaths = (start, ends, graph) => {

  let paths = {};
  let stack = [[start, [start]]];

  while (stack.length > 0) {
    let [node, path] = stack.pop();

    if (ends.has(node)) {
      if (!paths[node]) paths[node] = [];
      paths[node].push(path);
    }
    // limit path length to 5 nodes
    if(path.length < 5) {
      for (let edge of graph.edges) {
        if (edge.data.source === node && !path.includes(edge.data.target)) {
          stack.push([edge.data.target, [...path, edge.data.target]]);
        }
      }
    }
  }

  // flattens the arrays in the paths object (which are associated with each end node) into a single array
  return new Set(Object.values(paths).flat());
}
