export const resultToCytoscape = (result, summary) => {
  const makeNode = (n, name) =>
  {
    return {
      data: {
        id: n,
        label: name
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