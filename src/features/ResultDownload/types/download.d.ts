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
  title?: string;
  journal?: string;
  pubdate?: string;
  url: string;
  type: string;
  source: {
    knowledge_level: string;
    name: string;
    url: string;
  };
  snippet?: string;
  support: PublicationSupport | null;
  knowledgeLevel?: string;
}

export interface ExportMeta {
  aras: string[];
  qid: string;
  timestamp: string;
  exportedAt: string;
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
