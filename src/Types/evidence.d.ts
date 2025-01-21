import { PublicationSupport } from "./results";

export type EvidenceItem = {
  edges: EdgeList;
  id: string;
}
export type EvidenceObjectContainer = {
  [key: string]: EvidenceItem;
}
export type EvidenceContainer = {
  distinctSources: any;
  length?: number;
  publications: any;
  sources: any;
}
export type PublicationObject = {
  id?: string;
  journal?: string;
  knowledgeLevel?: string;
  pubdate?: string;
  source: SourceObject;
  snippet?: string;
  support: PublicationSupport | null;
  title?: string;
  type: string;
  url: string;
}
export type PublicationsList = {
  [key: string]: PublicationObject[];
}
export type SourceObject = {
  knowledge_level: string;
  name: string;
  url: string;
}
type RawPublicationObject = {
  id: string;
  support: PublicationSupport | null;
}
export type RawPublicationList = {
  [key: string]: RawPublication[];
}
export type EvidenceCountsContainer = {
  clinicalTrialCount: number;
  miscCount: number;
  publicationCount: number;
  sourceCount: number;
}
export type OldEvidence = {
  distinctSources: any[];
  length: number;
  publications: {[key: string]: PublicationObject};
  sources: any[];
}

export type Provenance = {
  knowledge_level: KnowledgeLevel;
  name: string;
  url: string;
  wiki: string;
}

export type PublicationSupport = {
  object: number[];
  subject: number[];
  text: string;
}

export type KnowledgeLevel = "trusted" | "ml" | "unknown" | "";

export type EvidenceSortState = {
  date: null | boolean;
  journal: null | boolean;
  title: null | boolean;
}

export type TrialObject = {
  child: boolean;
  id?: string;
  phase: number;
  size: number;
  start_date: string;
  status: 'COMPLETED' | 'TERMINATED' | 'WITHDRAWN' | 'UNKNOWN';
  type: 'enrolled' | 'anticipated';
  url: string;
}
