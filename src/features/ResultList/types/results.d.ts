import { PublicationObject, KnowledgeLevel, EvidenceCountsContainer, TrialObject,
  Provenance, PublicationSupport } from "@/features/Evidence/types/evidence";

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
  score?: { main: number, secondary: number };
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

export interface ResultEdge {
  // array of ARA names
  aras: string[];
  "is_root": boolean;
  compressed_edges?: ResultEdge[];
  id: string;
  knowledge_level: KnowledgeLevel;
  metadata: {
    edge_bindings: string[],
    inverted_id: string | null,
    is_root: boolean,
  };
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
  trials: string[];
}

export interface RankedEdge extends ResultEdge {
  support: RankedPath[];
}


export type ResultNode = {
  aras: string[];
  curies: string[];
  descriptions: string[];
  id: string;
  names: string[];
  other_names: {[key: string]: string[]};
  // link to relevant info about node
  provenance: string;
  species: "Zebrafish" | "Mouse" | "Rat" | null;
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

export const isResultEdge = (obj: unknown): obj is ResultEdge => {
  return (
    obj &&
    Array.isArray(obj.aras) &&
    obj.aras.every((item: unknown) => typeof item === "string") &&
    typeof obj.is_root === "boolean" &&
    typeof obj.knowledge_level === "string" &&
    typeof obj.metadata === "object" &&
    Array.isArray(obj.metadata.edge_bindings) &&
    obj.metadata.edge_bindings.every((item: unknown) => typeof item === "string") &&
    (typeof obj.metadata.inverted_id === "string" || obj.metadata.inverted_id === null) &&
    typeof obj.metadata.is_root === "boolean" &&
    typeof obj.object === "string" &&
    typeof obj.predicate === "string" &&
    typeof obj.predicate_url === "string" &&
    (typeof obj.description === "string" || obj.description === null || obj.description === undefined) &&
    Array.isArray(obj.provenance) &&
    obj.provenance.every((prov: unknown) => typeof prov === "object") &&
    typeof obj.publications === "object" &&
    typeof obj.subject === "string" &&
    Array.isArray(obj.support) &&
    obj.support.every((item: unknown) => typeof item === "string")
  );
}

export const isResultNode = (obj: unknown): obj is ResultNode => {
  return (
    obj &&
    Array.isArray(obj.aras) &&
    obj.aras.every((item: unknown) => typeof item === "string") &&
    Array.isArray(obj.curies) &&
    obj.curies.every((item: unknown) => typeof item === "string") &&
    Array.isArray(obj.descriptions) &&
    obj.descriptions.every((item: unknown) => typeof item === "string") &&
    Array.isArray(obj.names) &&
    obj.names.every((item: unknown) => typeof item === "string") &&
    Array.isArray(obj.provenance) &&
    obj.provenance.every((item: unknown) => typeof item === "string") &&
    (obj.species === "Zebrafish" ||
      obj.species === "Mouse" ||
      obj.species === "Rat" ||
      obj.species === null) &&
    typeof obj.tags === "object" &&
    Array.isArray(obj.types) &&
    obj.types.every((type: unknown) => typeof type === "string")
  );
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
  containerClassName: string;
  buttonClassName: string;
  hasFreshResults: boolean;
  currentInterval?: number;
  status?: string;
  isError: boolean;
  setIsActive: (active: boolean) => void;
}
