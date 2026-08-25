import { GraphData, GraphNodeType, GraphEdgeType, LayoutType, HoverGeometry } from 'translator-graph-view';
import { replaceTreatWithImpact } from '@/features/Core/utils/stringFormatters';
import { Result, ResultEdge, ResultNode, ResultSet } from '@/features/ResultList/types/results.d';
import { isNodeIndex } from '@/features/ResultList/utils/resultsInteractionFunctions';
import { Preferences } from '@/features/UserAuth/types/user';
import { GraphHoverTarget, HoverAnchor } from '@/features/ResultGraphView/types/graphTypes';

/**
 * Converts a result to a graph data object.
 * @param result - The result to convert.
 * @param summary - The summary of the result.
 * @returns The graph data object.
 */
export const resultToGraphData = (
  result: Result,
  summary: { nodes: Record<string, ResultNode>, edges: Record<string, ResultEdge>, paths: Record<string, { subgraph: string[] }> }
): GraphData => {
  const distributeEntitiesInPath = (
    pathID: string,
    pathsArray: typeof summary.paths,
    nodeCollection: Set<string>,
    edgeCollection: Set<string>
  ) => {
    const path = pathsArray[pathID];
    if (path) {
      path.subgraph.forEach((elemID, i) => {
        if (isNodeIndex(i)) nodeCollection.add(elemID);
        else edgeCollection.add(elemID);
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
      distributeEntitiesInPath(pid, summary.paths, ns, es);
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

/**
 * Converts a layout preference to a layout type.
 * @param pref - The layout preference.
 * @returns The layout type.
 */
const legacyLayoutMap: Record<string, LayoutType> = {
  klay: 'hierarchicalLR',
  breadthfirst: 'hierarchical',
  concentric: 'force',
  vertical: 'hierarchical',
  horizontal: 'hierarchicalLR',
};

/**
 * Converts a layout preference to a layout type.
 * @param pref - The layout preference.
 * @returns The layout type.
 */
export function resolveLayout(pref: string): LayoutType {
  return legacyLayoutMap[pref] ?? (pref as LayoutType);
}

/**
 * Converts a layout preference to a layout type.
 * @param prefs - The layout preferences.
 * @returns The layout type.
 */
export const getInitialLayout = (prefs: Preferences): LayoutType => {
  const layoutPref = String(prefs?.graph_layout?.pref_value || 'hierarchicalLR');
  return resolveLayout(layoutPref);
};

/**
 * Checks if two targets are the same.
 * @param a - The first target.
 * @param b - The second target.
 * @returns True if the targets are the same, false otherwise.
 */
export const sameTarget = (a: GraphHoverTarget, b: GraphHoverTarget): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.kind === b.kind && a.id === b.id;
};

export const toGraphHoverTarget = (
  kind: 'node' | 'edge',
  id: string,
  entity: ResultNode | ResultEdge,
  anchor: HoverAnchor | undefined,
): GraphHoverTarget => {
  if (!anchor) return null;
  if (kind === 'node') {
    return { kind: 'node', id, node: entity as ResultNode, anchor };
  }
  return { kind: 'edge', id, edge: entity as ResultEdge, anchor };
};

/**
 * Converts a node to a hover target.
 * @param node - The node to convert.
 * @param geometry - The geometry of the node.
 * @param resultSet - The result set.
 * @returns The hover target.
 */
export const resolveNodeTarget = (
  node: GraphNodeType | null,
  geometry: HoverGeometry | null,
  resultSet?: ResultSet
): GraphHoverTarget => {
  if (!node || !resultSet) return null;
  const resultNode = resultSet.data.nodes[node.id];
  if (!resultNode) return null;
  return toGraphHoverTarget('node', node.id, resultNode, geometry?.anchor);
};

/**
 * Converts an edge to a hover target.
 * @param edge - The edge to convert.
 * @param geometry - The geometry of the edge.
 * @param resultSet - The result set.
 * @returns The hover target.
 */
export const resolveEdgeTarget = (
  edge: GraphEdgeType | null,
  geometry: HoverGeometry | null,
  resultSet?: ResultSet
): GraphHoverTarget => {
  if (!edge || !resultSet) return null;
  const resultEdge = resultSet.data.edges[edge.id];
  if (!resultEdge) return null;
  return toGraphHoverTarget('edge', edge.id, resultEdge, geometry?.anchor);
};