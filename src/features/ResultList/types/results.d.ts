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
  inferred: boolean;
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
  type: string;
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
  clinical_trials: string[] | null;
  descriptions: string[] | null;
  indications: string[] | null;
  otc_status: {code: number, label: string} | null;
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
  provenance: string[];
  synonyms: string[];
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
