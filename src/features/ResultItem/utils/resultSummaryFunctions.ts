import { Result, ResultSet, Path } from "@/features/ResultList/types/results";
import { getPathById, getNodeById, getEdgeById } from "@/features/ResultList/slices/resultsSlice";
import { getAllSupportPathIDs } from "./utilities";
import { PublicationSupport } from "@/features/Evidence/types/evidence";

/**
 * Converts a Result and its context into the summary endpoint spec.
 * @param result The Result object
 * @param resultSet The full ResultSet containing all nodes, edges, and paths
 * @param diseaseId The disease curie string
 * @param diseaseName The disease name
 * @param diseaseDescription The disease description
 * @returns The summary payload object
 */
export function resultToSummarySpec(resultSet: ResultSet, result: Result, diseaseId: string, diseaseName: string, diseaseDescription: string) {

  // Get initial Path objects from result.paths
  const initialPaths: Path[] = result.paths
    .map(p => (typeof p === "string" ? getPathById(resultSet, p) : p))
    .filter((p): p is Path => !!p);

  // Use utility to get all support path IDs
  const supportPathIDs = getAllSupportPathIDs(initialPaths, resultSet);
  // Combine initial and support path IDs
  const allPathIDs = new Set<string>([...initialPaths.map(p => p.id!), ...supportPathIDs]);

  // Collect all node and edge IDs from all relevant paths
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  allPathIDs.forEach(pid => {
    const path = getPathById(resultSet, pid);
    if (path) {
      path.subgraph.forEach((id, i) => {
        if (i % 2 === 0) {
          nodeIds.add(id);
        } else {
          edgeIds.add(id);
        }
      });
    }
  });

  // Build the results array (single element)
  const summaryResult = {
    id: result.id,
    subject: result.subject,
    object: result.object,
    "drug name": result.drug_name,
    paths: Array.from(allPathIDs),
  };

  // Build the paths object
  const summaryPaths: Record<string, { subgraph: string[] }> = {};
  allPathIDs.forEach(pid => {
    const path = getPathById(resultSet, pid);
    if (path) {
      summaryPaths[pid] = { subgraph: path.subgraph };
    }
  });

  // Build the nodes object
  const summaryNodes: Record<string, { names: string[]; types: string[] }> = {};
  nodeIds.forEach(nid => {
    const node = getNodeById(resultSet, nid);
    if (node) {
      summaryNodes[nid] = { names: node.names, types: node.types };
    }
  });

  // Build the edges object
  const summaryEdges: Record<string, { subject: string; predicate: string; object: string; support: (string | Path)[]; publications: {[key: string]: {id: string; support: PublicationSupport}[]} }> = {};
  edgeIds.forEach(eid => {
    const edge = getEdgeById(resultSet, eid);
    if (edge) {
      summaryEdges[eid] = {
        subject: edge.subject,
        predicate: edge.predicate,
        object: edge.object,
        support: edge.support,
        publications: edge.publications,
        trials: edge.trials,
      };
    }
  });

  return {
    results: [summaryResult],
    paths: summaryPaths,
    nodes: summaryNodes,
    edges: summaryEdges,
    disease: diseaseId,
    disease_name: diseaseName,
    disease_description: diseaseDescription,
  };
}
