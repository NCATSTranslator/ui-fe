import { 
  ExportedResultSet, 
  DenormalizedCSVRow,
  ExportedNode,
  ExportedEdge,
  ExportedPath,
  ExportedPublication,
  ExportedResult,
  ExportedTrial,
  CSVValue,
} from "@/features/ResultDownload/types/download.d";

/**
 * Escapes a value for CSV format
 */
export const escapeCSVValue = (value: CSVValue): string => {
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
export const joinArrayForCSV = (arr: (string | number | null | undefined)[] | undefined): string => {
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
    provenance: joinArrayForCSV(node.provenance),
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

const buildDenormalizedRow = (params: {
  result: ExportedResult;
  path: ExportedPath;
  pathId: string;
  pathIndex: string;
  edgeIndex: number;
  edge: ExportedEdge;
  sourceNodeId: string;
  targetNodeId: string;
  exportedResultSet: ExportedResultSet;
}): DenormalizedCSVRow => {
  const sourceFields = extractNodeFields(params.exportedResultSet.nodes[params.sourceNodeId]);
  const targetFields = extractNodeFields(params.exportedResultSet.nodes[params.targetNodeId]);
  const publicationFields = extractPublicationFields(params.edge, params.exportedResultSet);
  const trialFields = extractTrialFields(params.edge, params.exportedResultSet);

  return {
    result_id: params.result.id,
    result_name: params.result.drug_name,
    result_subject_id: params.result.subject,
    result_object_id: params.result.object,
    path_id: params.path.id || params.pathId,
    path_index: params.pathIndex,
    path_aras: joinArrayForCSV(params.path.aras),
    edge_id: params.edge.id,
    edge_index: params.edgeIndex,
    edge_predicate: params.edge.predicate || '',
    edge_knowledge_level: params.edge.knowledge_level || '',
    edge_provenance: serializeProvenance(params.edge.provenance),
    edge_aras: joinArrayForCSV(params.edge.aras),
    source_node_id: sourceFields.id,
    source_node_name: sourceFields.name,
    source_node_types: sourceFields.types,
    source_node_curies: sourceFields.curies,
    source_node_descriptions: sourceFields.descriptions,
    source_node_species: sourceFields.species,
    source_node_provenance: sourceFields.provenance,
    target_node_id: targetFields.id,
    target_node_name: targetFields.name,
    target_node_types: targetFields.types,
    target_node_curies: targetFields.curies,
    target_node_descriptions: targetFields.descriptions,
    target_node_species: targetFields.species,
    target_node_provenance: targetFields.provenance,
    publication_ids: publicationFields.ids,
    publication_urls: publicationFields.urls,
    trial_ids: trialFields.ids,
    trial_titles: trialFields.titles,
    trial_urls: trialFields.urls,
    trial_phases: trialFields.phases,
    trial_sizes: trialFields.sizes,
    trial_start_dates: trialFields.start_dates,
    trial_statuses: trialFields.statuses,
  };
};

/**
 * Generates denormalized CSV rows for a single result
 * Returns one row per edge in each path
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
    if (visitedPathIds.has(pathId)) return;
    visitedPathIds.add(pathId);

    const path = exportedResultSet.paths[pathId];
    if (!path) return;

    const pathIndex = String(pathArrayIndex + 1);
    let edgeIndex = 0;

    for (let i = 1; i < path.subgraph.length; i += 2) {
      const edge = exportedResultSet.edges[path.subgraph[i]];
      if (!edge) continue;
      edgeIndex++;
      rows.push(buildDenormalizedRow({
        result,
        path,
        pathId,
        pathIndex,
        edgeIndex,
        edge,
        sourceNodeId: path.subgraph[i - 1],
        targetNodeId: path.subgraph[i + 1],
        exportedResultSet,
      }));
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
