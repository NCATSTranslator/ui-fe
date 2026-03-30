import { GraphData, GraphNodeType, GraphEdgeType } from 'translator-graph-view';
import { hasSupport, replaceTreatWithImpact } from '@/features/Common/utils/utilities';
import { Result, ResultEdge, ResultNode } from '@/features/ResultList/types/results.d';
import { isNodeIndex } from '@/features/ResultList/utils/resultsInteractionFunctions';

export const resultToGraphData = (
  result: Result,
  summary: { nodes: Record<string, ResultNode>, edges: Record<string, ResultEdge>, paths: Record<string, { subgraph: string[] }> }
): GraphData => {
  const distributeEntitiesInPath = (
    pathID: string,
    pathsArray: typeof summary.paths,
    edgesArray: typeof summary.edges,
    nodeCollection: Set<string>,
    edgeCollection: Set<string>,
    supportStack: string[]
  ) => {
    const path = pathsArray[pathID];
    if (path) {
      supportStack.push(pathID);
      path.subgraph.forEach((elemID, i) => {
        if (isNodeIndex(i)) nodeCollection.add(elemID);
        else {
          edgeCollection.add(elemID);
          const edge = edgesArray[elemID];
          if (hasSupport(edge)) {
            const validSupport = edge.support.filter(p => {
              const pid = typeof p === "string" ? p : p.id;
              return !!pid && !supportStack.includes(pid);
            });
            for (const supportPathID of validSupport) {
              const id = typeof supportPathID === "string" ? supportPathID : supportPathID.id;
              if(!id) {
                console.warn('unable to add support path to graph, id is missing.');
                continue;
              }
              distributeEntitiesInPath(id, pathsArray, edgesArray, nodeCollection, edgeCollection, supportStack);
            }
          }
        }
      });
    } else {
      console.warn("Missing pathID:", pathID);
    }
  };

  const ns = new Set<string>();
  const es = new Set<string>();
  for (const pathID of result.paths) {
    const pid = typeof pathID === "string" ? pathID : pathID.id;
    if(!!pid)
      distributeEntitiesInPath(pid, summary.paths, summary.edges, ns, es, []);
  }

  const nodes: Record<string, GraphNodeType> = {};
  for (const n of ns) {
    const node = summary.nodes[n];
    nodes[n] = {
      id: node.id,
      names: node.names?.length ? node.names : ["unknown node"],
      types: node.types?.length ? node.types : ["unknown"],
      curies: node.curies ?? [],
    };
  }

  const edges: Record<string, GraphEdgeType> = {};
  for (const eid of es) {
    const e = summary.edges[eid];
    const predicate = e.predicate.includes("treat") ? replaceTreatWithImpact(e.predicate) : e.predicate;
    edges[eid] = {
      id: e.id,
      subject: e.subject,
      object: e.object,
      predicate,
    };
  }

  return { nodes, edges };
};
