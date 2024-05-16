export interface EvidenceItem {
  edges: EdgeList;
  id: string;
}
export interface EvidenceObjectContainer {
  [key: string]: EvidenceItem;
}
export interface EvidenceContainer {
  distinctSources: any;
  length?: number;
  publications: any;
  sources: any;
}
export interface PublicationObject {
  id: string;
  journal: string;
  knowledgeLevel: string;
  source: object;
  support: object | null;
  title: string;
  type: string;
  url: string;
}
export interface PublicationsList {
  [key: string]: PublicationObject[];
}
export interface SourceObject {
  knowledge_level: string;
  name: string;
  url: string;
}
interface rawAttachedPublication {
  id: string;
  support: object | null;
}
export interface rawAttachedPublications {
  [key: string]: rawAttachedPublication[];
}

export interface EvidenceCounts {
  clinicalTrialCount: number;
  miscCount: number;
  publicationCount: number;
  sourceCount: number;
}