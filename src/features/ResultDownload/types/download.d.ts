import { PublicationObject, TrialObject, Provenance, KnowledgeLevel, PublicationSupport } from "@/features/Evidence/types/evidence";

export type DownloadScope = 'full' | 'filtered' | 'bookmarked';
export type ExportFormat = 'json' | 'csv';

export interface DownloadOptions {
  scope: DownloadScope;
  format: ExportFormat;
  // Future extensibility
  excludeNodeTypes?: string[];
  excludeEdgeFields?: string[];
  excludeNodeFields?: string[];
}

// Exported entity types with internal fields stripped
export interface ExportedNode {
  id: string;
  names: string[];
  types: string[];
  curies: string[];
  descriptions: string[];
  species: "Zebrafish" | "Mouse" | "Rat" | null;
  provenance: string;
  aras: string[];
}

export interface ExportedEdge {
  id: string;
  subject: string;
  object: string;
  predicate: string;
  predicate_url: string;
  knowledge_level: KnowledgeLevel;
  provenance: Provenance[];
  publications: { [key: string]: { id: string; support: PublicationSupport }[] };
  trials: string[];
  support: string[];
  aras: string[];
  description?: string | null;
}

export interface ExportedResult {
  id: string;
  drug_name: string;
  subject: string;
  object: string;
  paths: string[];
}

export interface ExportedPath {
  id: string;
  subgraph: string[];
  aras: string[];
}

export interface ExportedTrial {
  id: string;
  title?: string;
  url: string;
  phase: number;
  size: number;
  start_date: string;
  status: 'COMPLETED' | 'TERMINATED' | 'WITHDRAWN' | 'UNKNOWN';
  type?: 'enrolled' | 'anticipated';
}

export interface ExportedPublication {
  id?: string;
  url: string;
  source: {
    knowledge_level: string;
    name: string;
    url: string;
  };
  support: PublicationSupport | null;
  knowledgeLevel?: string;
}

export interface ExportMeta {
  aras: string[];
  qid: string;
  timestamp: string;
  export_time: string;
  scope: DownloadScope;
  format: ExportFormat;
  resultCount: number;
}

export interface ExportedResultSet {
  meta: ExportMeta;
  results: ExportedResult[];
  nodes: { [key: string]: ExportedNode };
  edges: { [key: string]: ExportedEdge };
  paths: { [key: string]: ExportedPath };
  publications: { [key: string]: ExportedPublication };
  trials: { [key: string]: ExportedTrial };
}

/**
 * Denormalized CSV row - one row per edge in each path
 * All array fields are semicolon-separated strings
 */
export interface DenormalizedCSVRow {
  // Result context (repeated per row)
  result_id: string;
  result_name: string;
  result_subject_id: string;
  result_object_id: string;

  // Path context
  path_id: string;
  path_index: string;  // Hierarchical index: "1" for top-level, "1.2" for support of edge 2 in path 1, etc.
  path_aras: string;

  // Edge data
  edge_id: string;
  edge_index: number;
  edge_predicate: string;
  edge_knowledge_level: string;
  edge_provenance: string;
  edge_aras: string;

  // Edge source node
  source_node_id: string;
  source_node_name: string;
  source_node_types: string;
  source_node_curies: string;
  source_node_descriptions: string;
  source_node_species: string;
  source_node_provenance: string;

  // Edge target node
  target_node_id: string;
  target_node_name: string;
  target_node_types: string;
  target_node_curies: string;
  target_node_descriptions: string;
  target_node_species: string;
  target_node_provenance: string;

  // Publications (semicolon-separated lists)
  publication_ids: string;
  publication_urls: string;

  // Trials (semicolon-separated lists)
  trial_ids: string;
  trial_titles: string;
  trial_urls: string;
  trial_phases: string;
  trial_sizes: string;
  trial_start_dates: string;
  trial_statuses: string;

  // Support path hierarchy
  support_level: number;           // 0 = top-level path, 1+ = nested support depth
  parent_path_id: string;          // Path ID of parent (empty for top-level)
  parent_edge_id: string;          // Edge ID this support path supports (empty for top-level)
  edge_support_path_ids: string;   // Semicolon-separated support path IDs for this edge
}

/**
 * @deprecated Use DenormalizedCSVRow instead
 * Legacy CSV row format - one row per result (summary only)
 */
export interface CSVRow {
  result_id: string;
  result_name: string;
  subject_id: string;
  subject_name: string;
  subject_types: string;
  object_id: string;
  object_name: string;
  object_types: string;
  path_count: number;
  publication_count: number;
  trial_count: number;
  aras: string;
}
