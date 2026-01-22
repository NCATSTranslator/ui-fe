import { ResultSet, Result, ResultNode, ResultEdge, Path } from "@/features/ResultList/types/results.d";
import { PublicationObject, TrialObject } from "@/features/Evidence/types/evidence";
import { SaveGroup, Save } from "@/features/UserAuth/utils/userApi";
import {
  DownloadScope,
  DownloadOptions,
  ExportedResultSet,
  ExportedResult,
  ExportedNode,
  ExportedEdge,
  ExportedPath,
  ExportedPublication,
  ExportedTrial,
  ExportFormat,
} from "@/features/ResultDownload/types/download.d";
import { exportToCSV } from "@/features/ResultDownload/utils/csvUtils";

/**
 * Returns results based on the specified scope
 */
export const getResultsByScope = (
  scope: DownloadScope,
  allResults: Result[],
  filteredResults: Result[],
  userSaves: SaveGroup | null
): Result[] => {
  switch (scope) {
    case 'full':
      return allResults;
    case 'filtered':
      return filteredResults;
    case 'bookmarked': {
      if (!userSaves?.saves) return [];
      const bookmarkedIds = new Set<string>();
      userSaves.saves.forEach((save: Save) => {
        if (save.object_ref) {
          bookmarkedIds.add(save.object_ref);
        }
      });
      return allResults.filter(result => bookmarkedIds.has(result.id));
    }
    default:
      return allResults;
  }
};

/**
 * Gets the count of results for each scope
 */
export const getScopeCounts = (
  allResults: Result[],
  filteredResults: Result[],
  userSaves: SaveGroup | null
): { full: number; filtered: number; bookmarked: number } => {
  let bookmarkedCount = 0;
  if (userSaves?.saves) {
    const bookmarkedIds = new Set<string>();
    userSaves.saves.forEach((save: Save) => {
      if (save.object_ref) {
        bookmarkedIds.add(save.object_ref);
      }
    });
    bookmarkedCount = allResults.filter(result => bookmarkedIds.has(result.id)).length;
  }

  return {
    full: allResults.length,
    filtered: filteredResults.length,
    bookmarked: bookmarkedCount,
  };
};

/**
 * Collects all related entities (nodes, edges, paths, publications, trials)
 * referenced by the selected results
 */
export const collectRelatedEntities = (
  results: Result[],
  resultSet: ResultSet
): {
  nodes: { [key: string]: ResultNode };
  edges: { [key: string]: ResultEdge };
  paths: { [key: string]: Path };
  publications: { [key: string]: PublicationObject };
  trials: { [key: string]: TrialObject };
} => {
  const nodes: { [key: string]: ResultNode } = {};
  const edges: { [key: string]: ResultEdge } = {};
  const paths: { [key: string]: Path } = {};
  const publications: { [key: string]: PublicationObject } = {};
  const trials: { [key: string]: TrialObject } = {};

  const processedPathIds = new Set<string>();
  const processedEdgeIds = new Set<string>();

  const collectFromPath = (pathId: string) => {
    if (processedPathIds.has(pathId)) return;
    processedPathIds.add(pathId);

    const path = resultSet.data.paths[pathId];
    if (!path) return;

    paths[pathId] = path;

    // Process subgraph elements (alternating nodes and edges)
    path.subgraph.forEach((elementId, index) => {
      if (index % 2 === 0) {
        // Node
        if (resultSet.data.nodes[elementId]) {
          nodes[elementId] = resultSet.data.nodes[elementId];
        }
      } else {
        // Edge
        if (!processedEdgeIds.has(elementId) && resultSet.data.edges[elementId]) {
          processedEdgeIds.add(elementId);
          const edge = resultSet.data.edges[elementId];
          edges[elementId] = edge;

          // Collect publications from edge
          // edge.publications structure: { [groupingKey]: Array<{id: string, support: ...}> }
          // The actual publication IDs are in the nested array elements
          if (edge.publications) {
            Object.values(edge.publications).forEach(pubArray => {
              pubArray.forEach(pubRef => {
                if (pubRef.id && resultSet.data.publications[pubRef.id]) {
                  publications[pubRef.id] = resultSet.data.publications[pubRef.id];
                }
              });
            });
          }

          // Collect trials from edge
          if (edge.trials) {
            edge.trials.forEach(trialId => {
              if (resultSet.data.trials[trialId]) {
                trials[trialId] = resultSet.data.trials[trialId];
              }
            });
          }

          // Recursively collect support paths and their entities
          if (edge.support && Array.isArray(edge.support)) {
            edge.support.forEach(supportPathOrId => {
              const supportPathId = typeof supportPathOrId === 'string'
                ? supportPathOrId
                : supportPathOrId.id;
              if (supportPathId) {
                collectFromPath(supportPathId);
              }
            });
          }
        }
      }
    });
  };

  // Process each result
  results.forEach(result => {
    // Add subject and object nodes
    if (resultSet.data.nodes[result.subject]) {
      nodes[result.subject] = resultSet.data.nodes[result.subject];
    }
    if (resultSet.data.nodes[result.object]) {
      nodes[result.object] = resultSet.data.nodes[result.object];
    }

    // Process paths
    result.paths.forEach(pathIdOrObj => {
      const pathId = typeof pathIdOrObj === 'string' ? pathIdOrObj : pathIdOrObj.id;
      if (pathId) {
        collectFromPath(pathId);
      }
    });
  });

  return { nodes, edges, paths, publications, trials };
};

/**
 * Cleans a node by removing internal fields
 * @param node The node object
 * @param nodeId The node ID (from dictionary key, used if node.id is undefined)
 */
const cleanNode = (node: ResultNode, nodeId: string): ExportedNode => ({
  id: node.id || nodeId,
  names: node.names,
  types: node.types,
  curies: node.curies,
  descriptions: node.descriptions,
  species: node.species,
  provenance: node.provenance,
  aras: node.aras,
});

/**
 * Cleans an edge by removing internal fields
 * @param edge The edge object
 * @param edgeId The edge ID (from dictionary key, used if edge.id is undefined)
 */
const cleanEdge = (edge: ResultEdge, edgeId: string): ExportedEdge => ({
  id: edge.id || edgeId,
  subject: edge.subject,
  object: edge.object,
  predicate: edge.predicate,
  predicate_url: edge.predicate_url,
  knowledge_level: edge.knowledge_level,
  provenance: edge.provenance,
  publications: edge.publications,
  trials: edge.trials,
  support: Array.isArray(edge.support)
    ? edge.support.map(s => (typeof s === 'string' ? s : s.id || ''))
    : [],
  aras: edge.aras,
  description: edge.description,
});

/**
 * Cleans a result by removing internal fields
 */
const cleanResult = (result: Result): ExportedResult => ({
  id: result.id,
  drug_name: result.drug_name,
  subject: result.subject,
  object: result.object,
  paths: result.paths.map(p => (typeof p === 'string' ? p : p.id || '')),
});

/**
 * Cleans a path by removing internal fields
 */
const cleanPath = (path: Path, pathId: string): ExportedPath => ({
  id: path.id || pathId,
  subgraph: path.subgraph,
  aras: path.aras,
});

/**
 * Cleans a publication by removing internal fields
 * @param pub The publication object
 * @param pubId The publication ID (from dictionary key, used if pub.id is undefined)
 */
const cleanPublication = (pub: PublicationObject, pubId: string): ExportedPublication => ({
  id: pub.id || pubId,
  url: pub.url,
  source: pub.source,
  support: pub.support,
  knowledgeLevel: pub.knowledgeLevel,
});

/**
 * Cleans a trial by removing internal fields
 * @param trial The trial object
 * @param trialId The trial ID (from dictionary key, used if trial.id is undefined)
 */
const cleanTrial = (trial: TrialObject, trialId: string): ExportedTrial => ({
  id: trial.id || trialId,
  title: trial.title,
  url: trial.url,
  phase: trial.phase,
  size: trial.size,
  start_date: trial.start_date,
  status: trial.status,
  type: trial.type,
});

/**
 * Cleans all entities by removing internal fields
 */
export const cleanResultSet = (
  results: Result[],
  entities: ReturnType<typeof collectRelatedEntities>,
  resultSet: ResultSet,
  options: DownloadOptions
): ExportedResultSet => {
  const cleanedNodes: { [key: string]: ExportedNode } = {};
  const cleanedEdges: { [key: string]: ExportedEdge } = {};
  const cleanedPaths: { [key: string]: ExportedPath } = {};
  const cleanedPublications: { [key: string]: ExportedPublication } = {};
  const cleanedTrials: { [key: string]: ExportedTrial } = {};

  // Clean nodes (excluding specified types if configured)
  Object.entries(entities.nodes).forEach(([id, node]) => {
    if (!options.excludeNodeTypes?.includes(node.types[0])) {
      cleanedNodes[id] = cleanNode(node, id);
    }
  });

  // Clean edges
  Object.entries(entities.edges).forEach(([id, edge]) => {
    cleanedEdges[id] = cleanEdge(edge, id);
  });

  // Clean paths
  Object.entries(entities.paths).forEach(([id, path]) => {
    cleanedPaths[id] = cleanPath(path, id);
  });

  // Clean publications
  Object.entries(entities.publications).forEach(([id, pub]) => {
    cleanedPublications[id] = cleanPublication(pub, id);
  });

  // Clean trials
  Object.entries(entities.trials).forEach(([id, trial]) => {
    cleanedTrials[id] = cleanTrial(trial, id);
  });

  return {
    meta: {
      aras: resultSet.data.meta.aras,
      qid: resultSet.data.meta.qid,
      timestamp: resultSet.data.meta.timestamp,
      exportedAt: new Date().toISOString(),
      scope: options.scope,
      format: options.format,
      resultCount: results.length,
    },
    results: results.map(cleanResult),
    nodes: cleanedNodes,
    edges: cleanedEdges,
    paths: cleanedPaths,
    publications: cleanedPublications,
    trials: cleanedTrials,
  };
};

/**
 * Converts the result set to a JSON string
 */
export const exportToJSON = (exportedResultSet: ExportedResultSet): string => {
  return JSON.stringify(exportedResultSet, null, 2);
};

/**
 * Triggers a browser file download
 */
export const triggerDownload = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Sanitizes a string for use in a filename
 * - Removes or replaces special characters
 * - Limits length
 * - Converts spaces to underscores
 */
export const sanitizeForFilename = (str: string, maxLength: number = 50): string => {
  if (!str) return '';
  
  return str
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-')            // Replace spaces with dashes
    .replace(/-+/g, '-')             // Collapse multiple hyphens
    .replace(/_+/g, '_')             // Collapse multiple underscores
    .slice(0, maxLength)             // Limit length
    .replace(/[_-]+$/, '');          // Remove trailing underscores/hyphens
};

/**
 * Generates a filename for the export
 */
export const generateFilename = (scope: DownloadScope, format: ExportFormat, queryTitle?: string): string => {
  const date = new Date().toISOString().split('T')[0];
  const sanitizedTitle = queryTitle ? sanitizeForFilename(queryTitle) : '';
  const titlePart = sanitizedTitle ? `${sanitizedTitle}` : '';
  return `${titlePart}_${scope}_results_${date}.${format}`;
};

/**
 * Main export function that orchestrates the entire download process
 */
export const downloadResults = (
  resultSet: ResultSet,
  allResults: Result[],
  filteredResults: Result[],
  userSaves: SaveGroup | null,
  options: DownloadOptions,
  queryTitle?: string
): void => {
  // Get results based on scope
  const scopedResults = getResultsByScope(options.scope, allResults, filteredResults, userSaves);

  if (scopedResults.length === 0) {
    console.warn('No results to export for the selected scope');
    return;
  }

  // Collect related entities
  const entities = collectRelatedEntities(scopedResults, resultSet);

  // Clean the result set
  const cleanedResultSet = cleanResultSet(scopedResults, entities, resultSet, options);

  // Generate filename
  const filename = generateFilename(options.scope, options.format, queryTitle);

  if (options.format === 'json') {
    const jsonContent = exportToJSON(cleanedResultSet);
    triggerDownload(jsonContent, filename, 'application/json');
  } else {
    const csvContent = exportToCSV(cleanedResultSet, resultSet);
    triggerDownload(csvContent, filename, 'text/csv');
  }
};
