import { 
  ExportedResultSet, 
  DenormalizedCSVRow,
  ExportedNode,
  ExportedEdge,
  ExportedPublication,
  ExportedTrial,
  ExportedResult,
} from "@/features/ResultDownload/types/download.d";

/**
 * Escapes a value for CSV format
 */
const escapeCSVValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // If value contains comma, quote, newline, or semicolon, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes(';')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};


/**
 * Joins array values with semicolon for CSV
 * Escapes any semicolons within individual values
 */
const joinArrayForCSV = (arr: (string | number | null | undefined)[] | undefined): string => {
  if (!arr || arr.length === 0) return '';
  return arr
    .map(item => {
      if (item === null || item === undefined) return '';
      const str = String(item);
      // Escape semicolons within values by replacing with a placeholder
      return str.replace(/;/g, '\\;');
    })
    .join(';');
};

/**
 * Sanitizes text to prevent CSV quoting
 * Removes/replaces characters that would trigger quote-wrapping
 */
const sanitizeForCSV = (value: string): string => {
  return value
    .replace(/"/g, "")      // Replace double quotes with nothing
    .replace(/,/g, ' ')      // Replace commas with spaces
    .replace(/;/g, ' ')      // Replace semicolons with spaces
    .replace(/\n/g, ' ')     // Replace newlines with spaces
    .replace(/\r/g, '')      // Remove carriage returns
    .replace(/\s+/g, ' ')    // Collapse multiple spaces
    .trim();
};

/**
 * Joins array values with semicolon for CSV, sanitizing each value
 * to prevent quote-wrapping in the final output
 */
const joinArrayForCSVSanitized = (arr: (string | number | null | undefined)[] | undefined): string => {
  if (!arr || arr.length === 0) return '';
  return arr
    .map(item => {
      if (item === null || item === undefined) return '';
      return sanitizeForCSV(String(item));
    })
    .join('; ');  // Use "; " as delimiter for readability
};

/**
 * Extracts node data into flat CSV-friendly fields
 */
const extractNodeFields = (node: ExportedNode | undefined): {
  id: string;
  name: string;
  types: string;
  curies: string;
  descriptions: string;
  species: string;
  provenance: string;
} => {
  if (!node) {
    return {
      id: '',
      name: '',
      types: '',
      curies: '',
      descriptions: '',
      species: '',
      provenance: '',
    };
  }

  return {
    id: node.id,
    name: node.names?.[0] || '',
    types: joinArrayForCSV(node.types),
    curies: joinArrayForCSV(node.curies),
    descriptions: joinArrayForCSVSanitized(node.descriptions),
    species: node.species || '',
    provenance: node.provenance || '',
  };
};

/**
 * Extracts publication data into semicolon-separated fields
 */
const extractPublicationFields = (
  edge: ExportedEdge,
  exportedResultSet: ExportedResultSet
): {
  ids: string;
  urls: string;
} => {
  const publications: ExportedPublication[] = [];
  
  // edge.publications structure: { [groupingKey]: Array<{id: string, support: ...}> }
  // The actual publication IDs are in the nested array elements
  if (edge.publications) {
    Object.values(edge.publications).forEach(pubArray => {
      pubArray.forEach(pubRef => {
        if (pubRef.id) {
          const pub = exportedResultSet.publications[pubRef.id];
          if (pub) {
            publications.push(pub);
          }
        }
      });
    });
  }

  if (publications.length === 0) {
    return {
      ids: '',
      urls: '',
    };
  }

  return {
    ids: joinArrayForCSV(publications.map(p => p.id || '')),
    urls: joinArrayForCSV(publications.map(p => p.url || '')),
  };
};

/**
 * Extracts trial data into semicolon-separated fields
 */
const extractTrialFields = (
  edge: ExportedEdge,
  exportedResultSet: ExportedResultSet
): {
  ids: string;
  titles: string;
  urls: string;
  phases: string;
  sizes: string;
  start_dates: string;
  statuses: string;
} => {
  const trials: ExportedTrial[] = [];
  
  if (edge.trials) {
    edge.trials.forEach(trialId => {
      const trial = exportedResultSet.trials[trialId];
      if (trial) {
        trials.push(trial);
      }
    });
  }

  if (trials.length === 0) {
    return {
      ids: '',
      titles: '',
      urls: '',
      phases: '',
      sizes: '',
      start_dates: '',
      statuses: '',
    };
  }

  return {
    ids: joinArrayForCSV(trials.map(t => t.id)),
    titles: joinArrayForCSV(trials.map(t => t.title || '')),
    urls: joinArrayForCSV(trials.map(t => t.url || '')),
    phases: joinArrayForCSV(trials.map(t => t.phase)),
    sizes: joinArrayForCSV(trials.map(t => t.size)),
    start_dates: joinArrayForCSV(trials.map(t => t.start_date || '')),
    statuses: joinArrayForCSV(trials.map(t => t.status || '')),
  };
};

/**
 * Serializes provenance array to a semicolon-separated string
 */
const serializeProvenance = (provenance: ExportedEdge['provenance']): string => {
  if (!provenance || provenance.length === 0) return '';
  return joinArrayForCSV(provenance.map(p => {
    if (typeof p === 'string') return p;
    // Provenance objects - serialize to a readable format
    return `${p.name || ''}:${p.url || ''}`;
  }));
};

/**
 * Generates CSV rows for a support path and its nested support paths
 * @param pathId - The support path ID to process
 * @param exportedResultSet - The exported result set containing all entities
 * @param parentResult - The parent result for context
 * @param supportLevel - The current support nesting depth (1 = first level support)
 * @param parentPathId - The path ID that contains the edge with this support
 * @param parentEdgeId - The edge ID that this path supports
 * @param hierarchicalIndex - The hierarchical path index (e.g., "1.2.1" for support path 1 of edge 2 in path 1)
 * @param visitedPathIds - Set to track visited paths and prevent infinite loops
 */
const generateSupportPathRows = (
  pathId: string,
  exportedResultSet: ExportedResultSet,
  parentResult: ExportedResult,
  supportLevel: number,
  parentPathId: string,
  parentEdgeId: string,
  hierarchicalIndex: string,
  visitedPathIds: Set<string>
): DenormalizedCSVRow[] => {
  // Prevent infinite recursion from circular references
  if (visitedPathIds.has(pathId)) return [];
  visitedPathIds.add(pathId);

  const path = exportedResultSet.paths[pathId];
  if (!path) return [];

  const rows: DenormalizedCSVRow[] = [];
  let edgeIndex = 0;

  // Iterate through the subgraph - edges are at odd indices
  for (let i = 1; i < path.subgraph.length; i += 2) {
    const edgeId = path.subgraph[i];
    const sourceNodeId = path.subgraph[i - 1];
    const targetNodeId = path.subgraph[i + 1];

    const edge = exportedResultSet.edges[edgeId];
    if (!edge) continue;

    edgeIndex++;

    const sourceNode = exportedResultSet.nodes[sourceNodeId];
    const targetNode = exportedResultSet.nodes[targetNodeId];

    const sourceFields = extractNodeFields(sourceNode);
    const targetFields = extractNodeFields(targetNode);
    const publicationFields = extractPublicationFields(edge, exportedResultSet);
    const trialFields = extractTrialFields(edge, exportedResultSet);

    const row: DenormalizedCSVRow = {
      // Result context (from parent result)
      result_id: parentResult.id,
      result_name: parentResult.drug_name,
      result_subject_id: parentResult.subject,
      result_object_id: parentResult.object,

      // Path context with hierarchical index
      path_id: path.id || pathId,
      path_index: hierarchicalIndex,
      path_aras: joinArrayForCSV(path.aras),

      // Edge data
      edge_id: edge.id,
      edge_index: edgeIndex,
      edge_predicate: edge.predicate || '',
      edge_knowledge_level: edge.knowledge_level || '',
      edge_provenance: serializeProvenance(edge.provenance),
      edge_aras: joinArrayForCSV(edge.aras),

      // Source node
      source_node_id: sourceFields.id,
      source_node_name: sourceFields.name,
      source_node_types: sourceFields.types,
      source_node_curies: sourceFields.curies,
      source_node_descriptions: sourceFields.descriptions,
      source_node_species: sourceFields.species,
      source_node_provenance: sourceFields.provenance,

      // Target node
      target_node_id: targetFields.id,
      target_node_name: targetFields.name,
      target_node_types: targetFields.types,
      target_node_curies: targetFields.curies,
      target_node_descriptions: targetFields.descriptions,
      target_node_species: targetFields.species,
      target_node_provenance: targetFields.provenance,

      // Publications
      publication_ids: publicationFields.ids,
      publication_urls: publicationFields.urls,

      // Trials
      trial_ids: trialFields.ids,
      trial_titles: trialFields.titles,
      trial_urls: trialFields.urls,
      trial_phases: trialFields.phases,
      trial_sizes: trialFields.sizes,
      trial_start_dates: trialFields.start_dates,
      trial_statuses: trialFields.statuses,

      // Support hierarchy
      support_level: supportLevel,
      parent_path_id: parentPathId,
      parent_edge_id: parentEdgeId,
      edge_support_path_ids: joinArrayForCSV(edge.support || []),
    };

    rows.push(row);

    // Recursively generate rows for this edge's support paths
    if (edge.support && edge.support.length > 0) {
      edge.support.forEach((supportPathId, supportIndex) => {
        // Build hierarchical index: currentIndex.edgeIndex.supportIndex (1-based)
        const nestedHierarchicalIndex = `${hierarchicalIndex}.${edgeIndex}.${supportIndex + 1}`;
        // Clone the visited set for each branch to allow the same support path
        // to appear under different edges while preventing cycles within this branch
        const branchVisitedPaths = new Set(visitedPathIds);
        const supportRows = generateSupportPathRows(
          supportPathId,
          exportedResultSet,
          parentResult,
          supportLevel + 1,
          path.id || pathId,
          edge.id,
          nestedHierarchicalIndex,
          branchVisitedPaths
        );
        rows.push(...supportRows);
      });
    }
  }

  return rows;
};

/**
 * Generates denormalized CSV rows for a single result
 * Returns one row per edge in each path, including support paths
 */
export const generateDenormalizedRows = (
  resultId: string,
  exportedResultSet: ExportedResultSet
): DenormalizedCSVRow[] => {
  const result = exportedResultSet.results.find(r => r.id === resultId);
  if (!result) {
    throw new Error(`Result with id ${resultId} not found`);
  }

  const rows: DenormalizedCSVRow[] = [];
  // Track visited paths to prevent infinite loops from circular references
  const visitedPathIds = new Set<string>();

  // Iterate through each top-level path
  result.paths.forEach((pathId, pathArrayIndex) => {
    // Skip if already visited (shouldn't happen at top level, but safety check)
    if (visitedPathIds.has(pathId)) return;
    visitedPathIds.add(pathId);

    const path = exportedResultSet.paths[pathId];
    if (!path) return;

    const pathIndex = String(pathArrayIndex + 1); // 1-based index as string
    let edgeIndex = 0;

    // Iterate through the subgraph - edges are at odd indices
    for (let i = 1; i < path.subgraph.length; i += 2) {
      const edgeId = path.subgraph[i];
      const sourceNodeId = path.subgraph[i - 1];
      const targetNodeId = path.subgraph[i + 1];

      const edge = exportedResultSet.edges[edgeId];
      if (!edge) continue;

      edgeIndex++;

      const sourceNode = exportedResultSet.nodes[sourceNodeId];
      const targetNode = exportedResultSet.nodes[targetNodeId];

      const sourceFields = extractNodeFields(sourceNode);
      const targetFields = extractNodeFields(targetNode);
      const publicationFields = extractPublicationFields(edge, exportedResultSet);
      const trialFields = extractTrialFields(edge, exportedResultSet);

      const row: DenormalizedCSVRow = {
        // Result context
        result_id: result.id,
        result_name: result.drug_name,
        result_subject_id: result.subject,
        result_object_id: result.object,

        // Path context
        path_id: path.id || pathId,
        path_index: pathIndex,
        path_aras: joinArrayForCSV(path.aras),

        // Edge data
        edge_id: edge.id,
        edge_index: edgeIndex,
        edge_predicate: edge.predicate || '',
        edge_knowledge_level: edge.knowledge_level || '',
        edge_provenance: serializeProvenance(edge.provenance),
        edge_aras: joinArrayForCSV(edge.aras),

        // Source node
        source_node_id: sourceFields.id,
        source_node_name: sourceFields.name,
        source_node_types: sourceFields.types,
        source_node_curies: sourceFields.curies,
        source_node_descriptions: sourceFields.descriptions,
        source_node_species: sourceFields.species,
        source_node_provenance: sourceFields.provenance,

        // Target node
        target_node_id: targetFields.id,
        target_node_name: targetFields.name,
        target_node_types: targetFields.types,
        target_node_curies: targetFields.curies,
        target_node_descriptions: targetFields.descriptions,
        target_node_species: targetFields.species,
        target_node_provenance: targetFields.provenance,

        // Publications
        publication_ids: publicationFields.ids,
        publication_urls: publicationFields.urls,

        // Trials
        trial_ids: trialFields.ids,
        trial_titles: trialFields.titles,
        trial_urls: trialFields.urls,
        trial_phases: trialFields.phases,
        trial_sizes: trialFields.sizes,
        trial_start_dates: trialFields.start_dates,
        trial_statuses: trialFields.statuses,

        // Support hierarchy (top-level paths have support_level 0)
        support_level: 0,
        parent_path_id: '',
        parent_edge_id: '',
        edge_support_path_ids: joinArrayForCSV(edge.support || []),
      };

      rows.push(row);

      // Generate rows for support paths
      if (edge.support && edge.support.length > 0) {
        edge.support.forEach((supportPathId, supportIndex) => {
          // Build hierarchical index: pathIndex.edgeIndex.supportIndex (1-based)
          const hierarchicalIndex = `${pathIndex}.${edgeIndex}.${supportIndex + 1}`;
          // Create a fresh visited set for this support branch, starting with current path
          // This allows the same support path to appear under multiple edges while still
          // preventing cycles within a single recursive chain
          const branchVisitedPaths = new Set<string>([pathId]);
          const supportRows = generateSupportPathRows(
            supportPathId,
            exportedResultSet,
            result,
            1, // First level of support
            path.id || pathId,
            edge.id,
            hierarchicalIndex,
            branchVisitedPaths
          );
          rows.push(...supportRows);
        });
      }
    }
  });

  return rows;
};

/**
 * CSV column headers in order
 */
const CSV_HEADERS: (keyof DenormalizedCSVRow)[] = [
  // Result context
  'result_id',
  'result_name',
  'result_subject_id',
  'result_object_id',

  // Path context
  'path_id',
  'path_index',
  'path_aras',

  // Support hierarchy
  'support_level',
  'parent_path_id',
  'parent_edge_id',
  'edge_support_path_ids',

  // Edge data
  'edge_id',
  'edge_index',
  'edge_predicate',
  'edge_knowledge_level',
  'edge_provenance',
  'edge_aras',

  // Source node
  'source_node_id',
  'source_node_name',
  'source_node_types',
  'source_node_curies',
  'source_node_descriptions',
  'source_node_species',
  'source_node_provenance',

  // Target node
  'target_node_id',
  'target_node_name',
  'target_node_types',
  'target_node_curies',
  'target_node_descriptions',
  'target_node_species',
  'target_node_provenance',

  // Publications
  'publication_ids',
  'publication_urls',

  // Trials
  'trial_ids',
  'trial_titles',
  'trial_urls',
  'trial_phases',
  'trial_sizes',
  'trial_start_dates',
  'trial_statuses',
];

/**
 * Converts the exported result set to denormalized CSV format
 * One row per edge in each path
 */
export const exportToCSV = (exportedResultSet: ExportedResultSet): string => {
  const rows: string[] = [];
  // const { meta } = exportedResultSet;

  // // Add metadata section header row
  // const metaHeaders = ['aras', 'qid', 'timestamp', 'export_time', 'scope', 'format', 'resultCount'];
  // rows.push(metaHeaders.join(','));

  // // Add metadata values row
  // rows.push([
  //   escapeCSVValue(meta.aras.join('; ')),
  //   escapeCSVValue(meta.qid),
  //   escapeCSVValue(meta.timestamp),
  //   escapeCSVValue(meta.export_time),
  //   escapeCSVValue(meta.scope),
  //   escapeCSVValue(meta.format),
  //   escapeCSVValue(meta.resultCount),
  // ].join(','));

  // // Blank separator row
  // rows.push('');

  // // Column explanations section
  // rows.push('Column,Description');
  // rows.push('path_index,' + escapeCSVValue("Hierarchical path index: '1' = top-level path 1, '1.2.1' = support path 1 for edge 2 in path 1"));
  // rows.push('support_level,' + escapeCSVValue("0 = top-level path, 1+ = nested support depth (1 = first-level support, 2 = support of support, etc.)"));

  // // Blank separator row
  // rows.push('');

  // Add data header row
  rows.push(CSV_HEADERS.join(','));

  // Generate denormalized rows for each result
  exportedResultSet.results.forEach(result => {
    const denormalizedRows = generateDenormalizedRows(result.id, exportedResultSet);
    denormalizedRows.forEach(csvRow => {
      const rowValues = CSV_HEADERS.map(header => {
        return escapeCSVValue(csvRow[header]);
      });
      rows.push(rowValues.join(','));
    });
  });

  return rows.join('\n');
};
