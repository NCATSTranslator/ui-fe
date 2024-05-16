import { EvidenceCounts, PublicationObject } from "./evidence";

interface RawNode {
  aras: string[];
  curies: string[];
  descriptions: string[];
  fda_info?: boolean;
  id: string;
  is_root: boolean;
  name: string;
  names: string[];
  other_names: string[] | null;
  provenance: string[];
  sameAs: string[] | null;
  support: any;
  synonyms: string[] | null;
  types: string[];
}
export interface RawEdge {
  aras: string[];
  id: string | null;
  is_root: boolean;
  knowledge_level: string;
  object: string;
  predicate: EdgePredicateObject | string;
  predicate_url: string;
  provenance: ProvenanceObject[];
  publications: rawAttachedPublications;
  subject: string;
  support: string[];
}
export interface RawPathObject {
  aras: string[];
  stringName?: string;
  subgraph: RawNode[] | RawEdge[];
  support?: PathObject[] | RawPathObject[] | string[];
  tags: {[key:string]: {name: string; value: string;}}
}
export interface RawResult {
  drug_name: string;
  id: string;
  object: string;
  paths: string[];
  scores: Score[];
  subject: string;
  tags: Tag[];
}
export interface RawResults {
  edges: {[key: string]: any};
  errors: object;
  meta: object;
  nodes: {[key: string]: RawNode};
  paths: {[key: string]: any};
  publications: any;
  results: RawResult[];
  tags: object;
}
export interface ResultItem {
  bookmarkID: number | boolean;
  bookmarked: boolean;
  compressedPaths: PathObjectContainer[];
  description: string;
  evidenceCounts: EvidenceCounts;
  fdaInfo: boolean;
  graph: any | null;
  hasNotes: boolean;
  highlightedName: string | boolean | null;
  id: string;
  name: string;
  object: string;
  paths?: PathObjectContainer[] | null;
  rawResult: RawResult;
  score: Score;
  scores: Score[];
  subjectNode: FormattedNodeObject;
  tags: string[];
  type: string;
}
export interface FormattedPathObject {
  aras: string[];
  inferred?: boolean;
  stringName?: string;
  subgraph: (FormattedNodeObject | FormattedEdgeObject)[];
  support?: PathObject[] | RawPathObject[] | string[];
  tags: {[key:string]: {name: string; value: string;}}
}
export interface PathObjectContainer {
  id: string;
  inferred?: boolean;
  highlighted: boolean;
  path: FormattedPathObject;
  provenance?: ProvenanceObject[];
}
export interface FormattedEdgeObject {
  category?: string;
  edges: RawEdge[] | EdgeObject[] | null;
  id: string;
  label?: string;
  subject?: EdgeNodeObject;
  predicate?: EdgePredicateObject | string;
  object?: EdgeNodeObject;
  inferred: boolean;
  predicate_url?: string | null;
  predicates?: EdgePredicateObject[] | null;
  provenance?: any;
  publications: PublicationObject[] | {[key: string]: string[]};
  support?: PathObjectContainer[];
}
export interface FormattedNodeObject {
  id: string;
  category: string;
  curies: string[];
  description: string;
  name: string;
  provenance: string[];
  type: string;
}
interface ProvenanceObject {
  knowledge_level: string;
}
interface SubgraphObject {
  inferred?: boolean;
  predicates: EdgePredicateObject[];
  provenance: ProvenanceObject[];
  name: string;
}
export interface EdgeNodeObject {
  name: string;
}
export interface EdgePredicateObject {
  predicate: string;
  url: string | null;
}
export interface EdgeList {
  [key: string]: EdgeObject;
}
export interface SupportDataObject {
  key: string;
  pathItem: FormattedEdgeObject | FormattedNodeObject;
  pathViewStyles: {[key: string]: string;} | null;
  selectedPaths: Set<PathObjectContainer> | null;
  pathToDisplay: any;
  handleActivateEvidence: (path: PathObjectContainer) => void;
  handleNameClick: (name: FormattedNodeObject) => void;
  handleEdgeClick: (edgeGroup: FormattedEdgeObject, path: PathObjectContainer) => void;
  handleTargetClick: (target: FormattedNodeObject) => void;
  activeStringFilters: string[];
}
export interface Score {
  clinical_evidence: number;
  confidence: number;
  main: number;
  novelty: number;
  normalized_score: number;
}
export interface Tag {
  count?: number
  name: string;
  negated: boolean;
  type: string;
  value: string;
}
export interface GroupedTags {
  [key: string]: {[key: string]: Tag};
}
export interface Filter {
  type: string;
  value: string;
  negated: boolean;
}
export interface QueryType {
  filterType: string;
}