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
  source: object;
  support: object;
  title: string;
  type: string;
  url: string;
}
export interface PublicationsList {
  [key: string]: PublicationObject;
}
export interface SourceObject {
  knowledge_level: string;
  name: string;
  url: string;
}