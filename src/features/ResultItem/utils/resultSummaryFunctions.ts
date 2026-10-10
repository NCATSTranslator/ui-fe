import { Result, ResultSet, Path } from "@/features/ResultList/types/results";
import { getPathById, getNodeById, getEdgeById } from "@/features/ResultList/slices/resultsSlice";
import { SummaryPayload, SummaryResult, SummaryPathObject, SummaryNodeObject, SummaryEdgeObject } from "../types/summarization";
import { QueryType } from "@/features/Query/types/querySubmission";
import { Config } from "@/features/UserAuth/types/user";

/** Query template 0 is the only one whose payload the summarizer understands. */
const SUMMARIZABLE_QUERY_TYPE_ID = 0;

/**
 * Whether the per-result summary button should be offered for a query.
 * @param {QueryType | null} queryType The query template the results came from
 * @param {Config | null} config The backend config
 * @returns {boolean} True when summarization is enabled and supported
 */
export const isResultSummaryEnabled = (
  queryType: QueryType | null,
  config: Config | null,
): boolean => queryType?.id === SUMMARIZABLE_QUERY_TYPE_ID && !!config?.include_summarization;

/** Identifiers the summarizer cites in prose, and the resource each one resolves to. */
const CITATION_LINKS: { pattern: RegExp; href: (id: string) => string; label: (id: string) => string }[] = [
  {
    pattern: /\bPMC[:\s]?(\d+)\b/g,
    href: id => `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${id}/`,
    label: id => `PMC${id}`,
  },
  {
    pattern: /\bPMID[:\s]?(\d+)\b/g,
    href: id => `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
    label: id => `PMID:${id}`,
  },
  {
    pattern: /\bNCT(\d+)\b/g,
    href: id => `https://clinicaltrials.gov/study/NCT${id}`,
    label: id => `NCT${id}`,
  },
];

/**
 * Turns the summarizer's markdown-ish output into the HTML the modal renders:
 * bold runs become <strong>, and cited identifiers become links to their source.
 * @param {string} text Raw output text from one stream event
 * @returns {string} HTML string, still to be sanitized before rendering
 */
export const formatSummaryText = (text: string): string => {
  const withEmphasis = text
    .replace(/\.\*\*/g, '.<br />**')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  return CITATION_LINKS.reduce(
    (formatted, { pattern, href, label }) =>
      formatted.replace(pattern, (_match, id: string) =>
        `<a href="${href(id)}" target="_blank" rel="noopener noreferrer">${label(id)}</a>`
      ),
    withEmphasis
  );
};

/**
 * Converts a Result and its context into the summary endpoint spec.
 * @param {Result} result The Result object
 * @param {ResultSet} resultSet The full ResultSet containing all nodes, edges, and paths
 * @param {string} diseaseId The disease curie string
 * @param {string} diseaseName The disease name
 * @param {string} diseaseDescription The disease description
 * @returns {SummaryPayload} The summary payload object
 */
export function resultToSummarySpec(
  resultSet: ResultSet,
  result: Result,
  diseaseId: string,
  diseaseName: string,
  diseaseDescription: string
): SummaryPayload {

  // Get initial Path objects from result.paths
  const initialPaths: Path[] = result.paths
    .map(p => (typeof p === "string" ? getPathById(resultSet, p) : p))
    .filter((p): p is Path => !!p);

  // A compressed path stands in for several concrete ones, so send those rather
  // than the placeholder. Support paths are not included: the result set no
  // longer carries them.
  const allPathIDs = new Set<string>(
    initialPaths.flatMap(p => p.compressedIDs ?? (p.id ? [p.id] : []))
  );

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

  // Build the summary result object
  const summaryResult: SummaryResult = {
    id: result.id,
    subject: result.subject,
    object: result.object,
    "drug name": result.drug_name,
    paths: Array.from(allPathIDs),
  };

  // Build the paths object
  const summaryPaths: SummaryPathObject = {};
  allPathIDs.forEach(pid => {
    const path = getPathById(resultSet, pid);
    if (path) {
      summaryPaths[pid] = { subgraph: path.subgraph };
    }
  });

  // Build the nodes object
  const summaryNodes: SummaryNodeObject = {};
  nodeIds.forEach(nid => {
    const node = getNodeById(resultSet, nid);
    if (node) {
      summaryNodes[nid] = { names: node.names, types: node.types };
    }
  });

  // Build the edges object
  const summaryEdges: SummaryEdgeObject = {};

  edgeIds.forEach(eid => {
    const edge = getEdgeById(resultSet, eid);
    if (edge) {
      summaryEdges[eid] = {
        subject: edge.subject,
        predicate: edge.predicate,
        object: edge.object,
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
