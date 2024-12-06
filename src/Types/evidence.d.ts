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
  id: string;
  journal: string;
  knowledgeLevel: string;
  pubdate?: string;
  source: SourceObject;
  support: PublicationSupport | null;
  title: string;
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
type rawAttachedPublication = {
  id: string;
  support: object | null;
}
export type rawAttachedPublications = {
  [key: string]: rawAttachedPublication[];
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
}

export type PublicationSupport = {
  object: number[];
  subject: number[];
  text: string;
}

export type KnowledgeLevel = "trusted" | "ml" | "unknown" | "";