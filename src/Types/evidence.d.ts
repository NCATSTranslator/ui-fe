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
  source: object;
  support: object | null;
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