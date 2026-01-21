import { ResultSet } from "@/features/ResultList/types/results.d";
import { ExportedResultSet, CSVRow } from "@/features/ResultDownload/types/download.d";

/**
 * Escapes a value for CSV format
 */
const escapeCSVValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

/**
 * Joins array values with semicolon for CSV
 */
const joinArrayForCSV = (arr: string[] | undefined): string => {
  if (!arr || arr.length === 0) return '';
  return arr.join(';');
};

/**
 * Counts publications for a result
 */
const countPublications = (
  resultId: string,
  exportedResultSet: ExportedResultSet,
  resultSet: ResultSet
): number => {
  let count = 0;
  const result = exportedResultSet.results.find(r => r.id === resultId);
  if (!result) return 0;

  // Count publications from edges in the result's paths
  result.paths.forEach(pathId => {
    const path = exportedResultSet.paths[pathId];
    if (!path) return;

    path.subgraph.forEach((elementId, index) => {
      // Edges are at odd indices in the subgraph
      if (index % 2 !== 0) {
        const edge = exportedResultSet.edges[elementId];
        if (edge?.publications) {
          count += Object.keys(edge.publications).length;
        }
      }
    });
  });

  return count;
};

/**
 * Counts trials for a result
 */
const countTrials = (
  resultId: string,
  exportedResultSet: ExportedResultSet
): number => {
  let count = 0;
  const result = exportedResultSet.results.find(r => r.id === resultId);
  if (!result) return 0;

  const trialIds = new Set<string>();

  // Count unique trials from edges in the result's paths
  result.paths.forEach(pathId => {
    const path = exportedResultSet.paths[pathId];
    if (!path) return;

    path.subgraph.forEach((elementId, index) => {
      // Edges are at odd indices in the subgraph
      if (index % 2 !== 0) {
        const edge = exportedResultSet.edges[elementId];
        if (edge?.trials) {
          edge.trials.forEach(trialId => trialIds.add(trialId));
        }
      }
    });
  });

  return trialIds.size;
};

/**
 * Collects unique ARAs for a result
 */
const collectResultARAs = (
  resultId: string,
  exportedResultSet: ExportedResultSet
): string[] => {
  const aras = new Set<string>();
  const result = exportedResultSet.results.find(r => r.id === resultId);
  if (!result) return [];

  result.paths.forEach(pathId => {
    const path = exportedResultSet.paths[pathId];
    if (path?.aras) {
      path.aras.forEach(ara => aras.add(ara));
    }
  });

  return Array.from(aras);
};

/**
 * Flattens a result into a CSV row
 */
export const flattenResultForCSV = (
  resultId: string,
  exportedResultSet: ExportedResultSet,
  resultSet: ResultSet
): CSVRow => {
  const result = exportedResultSet.results.find(r => r.id === resultId);
  if (!result) {
    throw new Error(`Result with id ${resultId} not found`);
  }

  const subjectNode = exportedResultSet.nodes[result.subject];
  const objectNode = exportedResultSet.nodes[result.object];

  return {
    result_id: result.id,
    result_name: result.drug_name,
    subject_id: result.subject,
    subject_name: subjectNode?.names?.[0] || '',
    subject_types: joinArrayForCSV(subjectNode?.types),
    object_id: result.object,
    object_name: objectNode?.names?.[0] || '',
    object_types: joinArrayForCSV(objectNode?.types),
    path_count: result.paths.length,
    publication_count: countPublications(resultId, exportedResultSet, resultSet),
    trial_count: countTrials(resultId, exportedResultSet),
    aras: joinArrayForCSV(collectResultARAs(resultId, exportedResultSet)),
  };
};

/**
 * Converts the exported result set to CSV format
 */
export const exportToCSV = (
  exportedResultSet: ExportedResultSet,
  resultSet: ResultSet
): string => {
  const headers: (keyof CSVRow)[] = [
    'result_id',
    'result_name',
    'subject_id',
    'subject_name',
    'subject_types',
    'object_id',
    'object_name',
    'object_types',
    'path_count',
    'publication_count',
    'trial_count',
    'aras',
  ];

  const rows: string[] = [];

  // Add header row
  rows.push(headers.join(','));

  // Add data rows
  exportedResultSet.results.forEach(result => {
    const csvRow = flattenResultForCSV(result.id, exportedResultSet, resultSet);
    const rowValues = headers.map(header => escapeCSVValue(csvRow[header]));
    rows.push(rowValues.join(','));
  });

  return rows.join('\n');
};
