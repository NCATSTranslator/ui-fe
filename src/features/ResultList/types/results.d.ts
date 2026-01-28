import { PublicationObject, KnowledgeLevel, EvidenceCountsContainer, TrialObject,
  Provenance, PublicationSupport } from "@/features/Evidence/types/evidence";
import * as tc from "@/features/Common/types/checkers";
import { isProvenance } from "@/features/Evidence/types/checkers";

export type ResultSet = {
  status: "error" | "running" | "success",
  data: {
    edges: {[key: string]: ResultEdge},
    errors: Errors,
    meta: Meta,
    nodes: {[key: string]: ResultNode},
    paths: {[key: string]: Path},
    publications: {[key: string]: PublicationObject},
    results: Result[],
    tags: Tags,
    trials: {[key: string]: TrialObject}
  }
}

export interface Result {
  drug_name: string;
  evidenceCount?: EvidenceCountsContainer;
  id: string;
  // node ID
  object: string;
  pathCount?: number;
  // array of path IDs
  paths: string[] | Path[];
  score?: { main: number, secondary: number } | number;
  scores: Score[];
  // node ID
  subject: string;
  tags: Tags;
}

export type SharedItem = {
  index: number;
  name: string;
  page: number;
  type: string;
}

export interface ResultBookmark extends Result {
  description?: string;
  bookmarkID?: number | boolean;
  bookmarked?: boolean;
  hasNotes?: boolean;
}

export interface Path {
  aras: string[];
  // Array of all IDs from original and compressed paths
  compressedIDs?: string[];
  // Compressed subgraph with edges as arrays
  compressedSubgraph?: (string | string[])[] | null;
  highlighted?: boolean;
  id?: string;
  score?: number;
  // Original subgraph
  subgraph: string[];
  tags: Tags;
}

export interface RankedPath extends Path {
  // array of nodes and edges in order
  subgraph: (RankedEdge | ResultNode)[];
}

export type PathRank = {
  path: Path;
  rank: number;
  support: PathRank[];
}

export type EdgeMetadata = {
  edge_bindings: string[],
  inverted_id: string | null,
  is_root: boolean,
}

export interface ResultEdge {
  // array of ARA names
  aras: string[];
  "is_root": boolean;
  compressed_edges?: ResultEdge[];
  id: string;
  knowledge_level: KnowledgeLevel;
  metadata: EdgeMetadata;
  // nodeID
  object: string;
  predicate: string;
  predicate_url: string;
  description?: string | null;
  provenance: Provenance[];
  publications: {[key: string]: {id: string; support: PublicationSupport}[]};
  // nodeID
  subject: string;
  // array of path ids or Path objects
  support: string[] | Path[];
  tags: Tags;
  trials: string[];
}

export interface RankedEdge extends ResultEdge {
  support: RankedPath[];
}

export type Species = "Zebrafish" | "Mouse" | "Rat" | null;
export type Tdl = "Tclin" | "Tchem" | "Tbio" | "Tdark" | null;

export type Annotation = {
  chemical: ChemicalAnnotation;
  disease: DiseaseAnnotation;
  gene: GeneAnnotation;
}

export type ChebiRole = {
  id: string;
  name: string;
}

export type ChemicalAnnotation = {
  approval: number | null;
  clinical_trials: {title: string, url: string}[] | null;
  descriptions: string[] | null;
  indications: string[] | null;
  otc_status: number | null;
  other_names: {commercial: string[], generic: string[]} | null;
  roles: ChebiRole[] | null;
}

export type DiseaseAnnotation = {
  curies: string[] | null;
  descriptions: string[] | null;
}

export type GeneAnnotation = {
  descriptions: string[] | null;
  name: string | null;
  species: Species;
  tdl: Tdl;
}

export type ResultNode = {
  annotations: Annotation;
  aras: string[];
  curies: string[];
  descriptions: string[];
  id: string;
  names: string[];
  other_names: {[key: string]: string[]};
  // link to relevant info about node
  provenance: string;
  tags: Tags;
  // array of biolink types
  types: string[];
}

export type ResultGraph = {
  nodes: {
      data: {
          id: string;
          label: string;
          type: string;
          provenance: string;
          isTargetCount: number;
          isSourceCount: number;
          isTargetEdges: never[];
          isSourceEdges: never[];
      };
  }[];
  edges: {
      data: {
          id: string;
          source: string;
          sourceLabel: string;
          target: string;
          targetLabel: string;
          label: string;
          inferred: boolean;
      };
  }[];
}

export type Tags = {
  [key:string]: {name: string, value: string} | null;
}

export type PathFilterState = {
  [pid: string]: boolean;
}

export type Score = {
  clinical_evidence: number;
  confidence: number;
  main: number;
  novelty: number;
  normalized_score: number;
}

export type Meta = {
  aras: string[];
  qid: string;
  timestamp: string;
}

export type Errors = {
  "biothings-annotator": string[];
  unknown: string[];
}
export type ARAStatusResponse = {
  status: string;
  data: {
    aras: string[];
    status: string;
  };
}

export type HoverTarget = { id: string; type: 'node' | 'edge' } | null;

export type ScoreWeights = {
  confidenceWeight: number;
  noveltyWeight: number;
  clinicalWeight: number;
}

export const isResultEdge = (obj: unknown): obj is ResultEdge => {
  return (
    tc.isObject(obj) &&
    tc.isStringArray(obj.aras) &&
    tc.missable(obj.description, tc.isString) &&
    tc.isString(obj.id) &&
    tc.isBoolean(obj.is_root) &&
    tc.isString(obj.knowledge_level) &&
    __isEdgeMetadata(obj.metadata) &&
    tc.isString(obj.object) &&
    tc.isString(obj.predicate) &&
    tc.isString(obj.predicate_url) &&
    tc.makeIsHomogeneousArray(isProvenance)(obj.provenance) &&
    tc.isObject(obj.publications) &&
    tc.isString(obj.subject) &&
    //tc.isObject(obj.tags) &&
    tc.isStringArray(obj.support) &&
    tc.isString(obj.type)
  );

  function __isEdgeMetadata(obj: unknown): obj is EdgeMetadata {
    return (
      tc.isObject(obj) &&
      tc.isStringArray(obj.edge_bindings) &&
      tc.nullable(obj.inverted_id, tc.isString) &&
      tc.isBoolean(obj.is_root)
    );
  }
}

export const isResultNode = (obj: unknown): obj is ResultNode => {
  return (
    tc.isObject(obj) &&
    __isAnnotation(obj.annotations) &&
    tc.isStringArray(obj.aras) &&
    tc.isStringArray(obj.curies) &&
    tc.isStringArray(obj.descriptions) &&
    tc.isString(obj.id) &&
    tc.isStringArray(obj.names) &&
    tc.isStringArray(obj.provenance) &&
    tc.isStringArray(obj.synonyms) &&
    tc.isStringArray(obj.types)
  );

  function __isAnnotation(obj: unknown): obj is Annotation {
    return (
      tc.isObject (obj) &&
      __isChemicalAnnotation(obj.chemical) &&
      __isDiseaseAnnotation(obj.disease) &&
      __isGeneAnnotation(obj.gene)
    );
  }

  function __isChemicalAnnotation(obj: unknown): obj is ChemicalAnnotation {
    return (
      tc.isObject (obj) &&
      tc.nullable(obj.approval, tc.isNumber) &&
      tc.nullable(obj.clinical_trials,
        tc.makeIsHomogeneousArray(e => tc.isObject(e) && tc.isString(e.title) && tc.isString(e.url))) &&
      tc.nullable(obj.descriptions, tc.isStringArray) &&
      tc.nullable(obj.indications, tc.isStringArray) &&
      tc.nullable(obj.otc_status, tc.isNumber) &&
      tc.nullable(obj.other_names,
        e => tc.isObject(e) && tc.isStringArray(e.commercial) && tc.isStringArray(e.generic)) &&
      tc.nullable(obj.roles,
        tc.makeIsHomogeneousArray(e => tc.isObject(e) && tc.isString(e.id) && tc.isString(e.name)))
    );
  }

  function __isDiseaseAnnotation(obj: unknown): obj is DiseaseAnnotation {
    return (
      tc.isObject(obj) &&
      tc.nullable(obj.curies, tc.isStringArray) &&
      tc.nullable(obj.descriptions, tc.isStringArray)
    );
  }

  function __isGeneAnnotation(obj: unknown): obj is GeneAnnotation {
    return (
      tc.isObject(obj) &&
      tc.nullable(obj.descriptions, tc.isStringArray) &&
      tc.nullable(obj.name, tc.isString) &&
      tc.nullable(obj.species, tc.isString) &&
      tc.nullable(obj.tdl, tc.isString)
    );
  }
}


export const isPath = (obj: unknown): obj is Path => {
  return (
    obj &&
    Array.isArray(obj.aras) &&
    Array.isArray(obj.compressedIDs) &&
    obj.compressedIDs.every((item: unknown) => typeof item === "string") &&
    Array.isArray(obj.compressedSubgraph) &&
    obj.compressedSubgraph.every((item: unknown) => typeof item === "string" || (Array.isArray(item) && item.every(subItem => typeof subItem === "string"))) &&
    typeof obj.highlighted === "boolean" &&
    typeof obj.id === "string" &&
    Array.isArray(obj.subgraph) &&
    obj.subgraph.every((item: unknown) => typeof item === "string") &&
    isTags(obj.tags)
  );
}

export const isTags = (obj: unknown): obj is Tags => {
  if (typeof obj !== "object" || obj === null) return false;

  for (const key in obj) {
    const tag = (obj as Tags)[key];
    if (
      typeof tag !== "object" ||
      tag === null ||
      typeof tag.name !== "string" ||
      typeof tag.value !== "string"
    ) {
      return false;
    }
  }

  return true;
};

export interface ResultListLoadingData {
  handleResultsRefresh: () => void;
  isFetchingARAStatus: boolean | null;
  isFetchingResults: boolean | null;
  showDisclaimer: boolean;
  hasFreshResults: boolean;
  currentInterval?: number;
  status?: string;
  isError: boolean;
  setIsActive: (active: boolean) => void;
}
