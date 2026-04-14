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
  type: string;
}

export interface RankedEdge extends ResultEdge {
  support: RankedPath[];
}

export type Species = "Zebrafish" | "Mouse" | "Rat" | null;
export type Tdl = "Tclin" | "Tchem" | "Tbio" | "Tdark" | null;

const isSpecies = tc.makeIsOneOf(["Zebrafish", "Mouse", "Rat"] as const);
const isTdl = tc.makeIsOneOf(["Tclin", "Tchem", "Tbio", "Tdark"] as const);

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

export const isResultEdge = (obj: unknown, warn = true): obj is ResultEdge => {
  if (!tc.isObject(obj)) {
    if (warn) console.warn("[isResultEdge] expected object, got:", typeof obj, obj);
    return false;
  }
  return tc.checkProperties("isResultEdge", obj, [
    ["aras", tc.isStringArray(obj.aras), "string[]", obj.aras],
    ["description", tc.missable(obj.description, tc.isString), "string | undefined | null", obj.description],
    ["id", tc.isString(obj.id), "string", obj.id],
    ["is_root", tc.isBoolean(obj.is_root), "boolean", obj.is_root],
    ["knowledge_level", tc.isString(obj.knowledge_level), "string", obj.knowledge_level],
    ["metadata", __isEdgeMetadata(obj.metadata, warn), "EdgeMetadata", obj.metadata],
    ["object", tc.isString(obj.object), "string", obj.object],
    ["predicate", tc.isString(obj.predicate), "string", obj.predicate],
    ["predicate_url", tc.isString(obj.predicate_url), "string", obj.predicate_url],
    ["provenance", tc.makeIsHomogeneousArray((p: unknown) => isProvenance(p, warn))(obj.provenance), "Provenance[]", obj.provenance],
    ["publications", tc.isObject(obj.publications), "object", obj.publications],
    ["subject", tc.isString(obj.subject), "string", obj.subject],
    ["support", tc.isStringArray(obj.support), "string[]", obj.support],
    ["type", tc.isString(obj.type), "string", obj.type],
  ], warn);

  function __isEdgeMetadata(obj: unknown, warn = true): obj is EdgeMetadata {
    if (!tc.isObject(obj)) {
      if (warn) console.warn("[isResultEdge.metadata] expected object, got:", typeof obj, obj);
      return false;
    }
    return tc.checkProperties("isResultEdge.metadata", obj, [
      ["edge_bindings", tc.isStringArray(obj.edge_bindings), "string[]", obj.edge_bindings],
      ["inverted_id", tc.nullable(obj.inverted_id, tc.isString), "string | null", obj.inverted_id],
      ["is_root", tc.isBoolean(obj.is_root), "boolean", obj.is_root],
    ], warn);
  }
}

export const isResultNode = (obj: unknown, warn = true): obj is ResultNode => {
  if (!tc.isObject(obj)) {
    if (warn) console.warn("[isResultNode] expected object, got:", typeof obj, obj);
    return false;
  }
  return tc.checkProperties("isResultNode", obj, [
    ["annotations", __isAnnotation(obj.annotations, warn), "Annotation", obj.annotations],
    ["aras", tc.isStringArray(obj.aras), "string[]", obj.aras],
    ["curies", tc.isStringArray(obj.curies), "string[]", obj.curies],
    ["descriptions", tc.isStringArray(obj.descriptions), "string[]", obj.descriptions],
    ["id", tc.isString(obj.id), "string", obj.id],
    ["names", tc.isStringArray(obj.names), "string[]", obj.names],
    ["provenance", tc.isStringArray(obj.provenance), "string[]", obj.provenance],
    ["synonyms", tc.isStringArray(obj.synonyms), "string[]", obj.synonyms],
    ["types", tc.isStringArray(obj.types), "string[]", obj.types],
  ], warn);

  function __isAnnotation(obj: unknown, warn = true): obj is Annotation {
    if (!tc.isObject(obj)) {
      if (warn) console.warn("[isResultNode.annotations] expected object, got:", typeof obj, obj);
      return false;
    }
    return tc.checkProperties("isResultNode.annotations", obj, [
      ["chemical", __isChemicalAnnotation(obj.chemical, warn), "ChemicalAnnotation", obj.chemical],
      ["disease", __isDiseaseAnnotation(obj.disease, warn), "DiseaseAnnotation", obj.disease],
      ["gene", __isGeneAnnotation(obj.gene, warn), "GeneAnnotation", obj.gene],
    ], warn);
  }

  function __isChemicalAnnotation(obj: unknown, warn = true): obj is ChemicalAnnotation {
    if (!tc.isObject(obj)) {
      if (warn) console.warn("[isResultNode.annotations.chemical] expected object, got:", typeof obj, obj);
      return false;
    }
    return tc.checkProperties("isResultNode.annotations.chemical", obj, [
      ["approval", tc.nullable(obj.approval, tc.isNumber), "number | null", obj.approval],
      ["clinical_trials", tc.nullable(obj.clinical_trials, tc.isStringArray), "string[] | null", obj.clinical_trials],
      ["descriptions", tc.nullable(obj.descriptions, tc.isStringArray), "string[] | null", obj.descriptions],
      ["indications", tc.nullable(obj.indications, tc.isStringArray), "string[] | null", obj.indications],
      ["otc_status", tc.nullable(obj.otc_status, (e) => tc.isObject(e) && tc.isNumber(e.code) && tc.isString(e.label)), "{code, label} | null", obj.otc_status],
      ["other_names", tc.nullable(obj.other_names, e => tc.isObject(e) && tc.isStringArray(e.commercial) && tc.isStringArray(e.generic)), "{commercial, generic} | null", obj.other_names],
      ["roles", tc.nullable(obj.roles, tc.makeIsHomogeneousArray(e => tc.isObject(e) && tc.isString(e.id) && tc.isString(e.name))), "ChebiRole[] | null", obj.roles],
    ], warn);
  }

  function __isDiseaseAnnotation(obj: unknown, warn = true): obj is DiseaseAnnotation {
    if (!tc.isObject(obj)) {
      if (warn) console.warn("[isResultNode.annotations.disease] expected object, got:", typeof obj, obj);
      return false;
    }
    return tc.checkProperties("isResultNode.annotations.disease", obj, [
      ["curies", tc.nullable(obj.curies, tc.isStringArray), "string[] | null", obj.curies],
      ["descriptions", tc.nullable(obj.descriptions, tc.isStringArray), "string[] | null", obj.descriptions],
    ], warn);
  }

  function __isGeneAnnotation(obj: unknown, warn = true): obj is GeneAnnotation {
    if (!tc.isObject(obj)) {
      if (warn) console.warn("[isResultNode.annotations.gene] expected object, got:", typeof obj, obj);
      return false;
    }
    return tc.checkProperties("isResultNode.annotations.gene", obj, [
      ["descriptions", tc.nullable(obj.descriptions, tc.isStringArray), "string[] | null", obj.descriptions],
      ["name", tc.nullable(obj.name, tc.isString), "string | null", obj.name],
      ["species", tc.nullable(obj.species, isSpecies), "Species | null", obj.species],
      ["tdl", tc.nullable(obj.tdl, isTdl), "Tdl | null", obj.tdl],
    ], warn);
  }
}


export const isPath = (obj: unknown, warn = true): obj is Path => {
  if (!tc.isObject(obj)) {
    if (warn) console.warn("[isPath] expected object, got:", typeof obj, obj);
    return false;
  }
  return tc.checkProperties("isPath", obj, [
    ["aras", tc.isStringArray(obj.aras), "string[]", obj.aras],
    ["compressedIDs", tc.missable(obj.compressedIDs, tc.isStringArray), "string[] | undefined | null", obj.compressedIDs],
    ["compressedSubgraph", tc.missable(obj.compressedSubgraph, tc.makeIsHomogeneousArray((e: unknown) => tc.isString(e) || tc.isStringArray(e))), "(string | string[])[] | undefined | null", obj.compressedSubgraph],
    ["highlighted", tc.missable(obj.highlighted, tc.isBoolean), "boolean | undefined | null", obj.highlighted],
    ["id", tc.missable(obj.id, tc.isString), "string | undefined | null", obj.id],
    ["score", tc.missable(obj.score, tc.isNumber), "number | undefined | null", obj.score],
    ["subgraph", tc.isStringArray(obj.subgraph), "string[]", obj.subgraph],
    ["tags", isTags(obj.tags, warn), "Tags", obj.tags],
  ], warn);
}

export const isTags = (obj: unknown, warn = true): obj is Tags => {
  if (!tc.isObject(obj)) {
    if (warn) console.warn("[isTags] expected object, got:", typeof obj, obj);
    return false;
  }
  for (const key in obj) {
    const tag = (obj as Record<string, unknown>)[key];
    if (!tc.nullable(tag, (t) => tc.isObject(t) && tc.isString(t.name) && tc.isString(t.value))) {
      if (warn) console.warn(`[isTags] invalid tag at key "${key}": expected {name, value} | null, got:`, tag);
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
