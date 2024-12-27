import { PublicationObject, KnowledgeLevel, EvidenceCountsContainer } from "./evidence";
// type RawNode = {
//   aras: string[];
//   curies: string[];
//   descriptions: string[];
//   fda_info?: boolean;
//   id: string;
//   is_root: boolean;
//   name: string;
//   names: string[];
//   other_names: string[] | null;
//   provenance: string[];
//   sameAs: string[] | null;
//   support: any;
//   synonyms: string[] | null;
//   types: string[];
//   species: string | null;
// }
// export type RawEdge = {
//   aras: string[];
//   id: string | null;
//   is_root: boolean;
//   knowledge_level: string;
//   object: string;
//   predicate: EdgePredicateObject | string;
//   predicate_url: string;
//   provenance: ProvenanceObject[];
//   publications: rawAttachedPublications;
//   subject: string;
//   support: string[];
// }
// export type RawPathObject = {
//   aras: string[];
//   stringName?: string;
//   subgraph: RawNode[] | RawEdge[];
//   support?: PathObject[] | RawPathObject[] | string[];
//   tags: {[key:string]: {name: string; value: string;}}
// }
// export type RawResult = {
//   drug_name: string;
//   id: string;
//   object: string;
//   paths: string[];
//   scores: Score[];
//   subject: string;
//   tags: Tag[];
// }
// export type RawResultsContainer = {
//   edges: {[key: string]: any};
//   errors: object;
//   meta: object;
//   nodes: {[key: string]: RawNode};
//   paths: {[key: string]: any};
//   publications: any;
//   results: RawResult[];
//   tags: object;
// }
// export type ResultItem = {
//   bookmarkID: number | boolean;
//   bookmarked: boolean;
//   compressedPaths: PathObjectContainer[];
//   description: string;
//   evidenceCounts: EvidenceCountsContainer;
//   evidence?: OldEvidence;
//   fdaInfo: boolean;
//   graph: any | null;
//   hasNotes: boolean;
//   highlightedName: string | boolean | null;
//   id: string;
//   name: string;
//   object: string;
//   paths?: PathObjectContainer[] | null;
//   rawResult: RawResult;
//   score: Score;
//   scores: Score[];
//   subjectNode: RawNode;
//   objectNode: RawNode;
//   tags: string[];
//   type: string;
//   species: string | null;
// }
// export type FormattedPathObject = {
//   aras: string[];
//   inferred?: boolean;
//   stringName?: string;
//   subgraph: (FormattedNodeObject | FormattedEdgeObject)[];
//   support?: PathObject[] | RawPathObject[] | string[];
//   tags: {[key:string]: {name: string; value: string;}}
// }
// export type PathObjectContainer = {
//   id: string;
//   inferred?: boolean;
//   highlighted: boolean;
//   path: FormattedPathObject;
//   provenance?: ProvenanceObject[];
// }
// export type FormattedEdgeObject = {
//   category?: string;
//   compressedEdges: FormattedEdgeObject[];
//   edges: RawEdge[] | null;
//   id: string;
//   label?: string;
//   subject?: EdgeNodeObject;
//   predicate?: EdgePredicateObject | string;
//   object?: EdgeNodeObject;
//   inferred: boolean;
//   is_root: boolean;
//   predicate_url?: string | null;
//   predicates?: EdgePredicateObject[] | null;
//   provenance?: any;
//   publications: PublicationObject[] | {[key: string]: string[]};
//   support?: PathObjectContainer[];
// }
// export type FormattedNodeObject = {
//   id: string;
//   category: string;
//   curies: string[];
//   description: string;
//   name: string;
//   provenance: string[];
//   type: string;
//   species: string | null;
// }
// type ProvenanceObject = {
//   knowledge_level: string;
// }
// type SubgraphObject = {
//   inferred?: boolean;
//   predicates: EdgePredicateObject[];
//   provenance: ProvenanceObject[];
//   name: string;
// }
// export type EdgeNodeObject = {
//   name: string;
// }
// export type EdgePredicateObject = {
//   predicate: string;
//   url: string | null;
// }
// export type EdgeList = {
//   [key: string]: EdgeObject;
// }
// export type SupportDataObject = {
//   key: string;
//   pathItem: FormattedEdgeObject | FormattedNodeObject;
//   pathViewStyles: {[key: string]: string;} | null;
//   selectedPaths: Set<PathObjectContainer> | null;
//   supportPath: PathObjectContainer | null;
//   pathToDisplay: any;
//   handleActivateEvidence: (pathID: string) => void;
//   handleNodeClick: (name: ResultNode) => void;
//   handleEdgeClick: (edgeID: string, pathID: string) => void;
//   activeEntityFilters: string[];
//   tooltipID: string | null;
// }
// export type Tag = {
  //   count?: number
  //   name: string;
  //   negated: boolean;
  //   id: string;
  //   value: string;
  // }



// new 
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
    tags: Filters
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
  tags: Filters;
}

export type SharedItem = {
  index: number;
  name: string;
  page: number;
  type: string;
}

export interface ResultBookmark extends Result { 
  graph?: ResultGraph;
  description?: string;
  bookmarkID?: number | boolean;
  bookmarked?: boolean;
  hasNotes?: boolean;
}

export interface Path {
  aras: string[];
  highlighted?: boolean;
  id?: string;
  // Original subgraph
  subgraph: string[];
  // Compressed subgraph with edges as arrays
  compressedSubgraph?: (string | string[])[] | null;
  tags: Tags;
  // Array of all IDs from original and compressed paths
  compressedIDs?: string[];
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
  // nodeID
  object: string;
  predicate: string;
  predicate_url: string;
  provenance: Provenance[];
  publications: {[key: string]: {id: string; support: PublicationSupport}[]};
  // nodeID
  subject: string;
  // array of path ids or Path objects
  support: (string | Path)[];
}

export interface RankedEdge extends ResultEdge {
  support: RankedPath[];
}


export type ResultNode = {
  aras: string[];
  curies: string[];
  descriptions: string[];
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
          type: any;
          provenance: any;
          isTargetCount: number;
          isSourceCount: number;
          isTargetEdges: never[];
          isSourceEdges: never[];
      };
  }[];
  edges: {
      data: {
          id: string;
          source: any;
          sourceLabel: string;
          target: any;
          targetLabel: string;
          label: string;
          inferred: boolean;
      };
  }[];
}

export type Tags = {
  [key:string]: {name: string, value: string}
}
export type Filter = {
  count?: number
  name: string;
  negated?: boolean;
  id?: string;
  value?: string;
}
export type Filters =  {[key: string]: Filter};
export type GroupedFilters = {
  [key: string]: {[key: string]: Filter};
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

export const isResultEdge = (obj: any): obj is ResultEdge => {
  return (
    obj &&
    Array.isArray(obj.aras) &&
    obj.aras.every((item: any) => typeof item === "string") &&
    typeof obj.is_root === "boolean" &&
    typeof obj.knowledge_level === "string" && 
    typeof obj.object === "string" &&
    typeof obj.predicate === "string" &&
    typeof obj.predicate_url === "string" &&
    Array.isArray(obj.provenance) &&
    obj.provenance.every((prov: any) => typeof prov === "object") && 
    typeof obj.publications === "object" &&
    typeof obj.subject === "string" &&
    Array.isArray(obj.support) &&
    obj.support.every((item: any) => typeof item === "string")
  );
}

export const isResultNode = (obj: any): obj is ResultNode => {
  return (
    obj &&
    Array.isArray(obj.aras) &&
    obj.aras.every((item: any) => typeof item === "string") &&
    Array.isArray(obj.curies) &&
    obj.curies.every((item: any) => typeof item === "string") &&
    Array.isArray(obj.descriptions) &&
    obj.descriptions.every((item: any) => typeof item === "string") &&
    Array.isArray(obj.names) &&
    obj.names.every((item: any) => typeof item === "string") &&
    typeof obj.other_names === "object" &&
    Array.isArray(obj.provenance) &&
    obj.provenance.every((item: any) => typeof item === "string") &&
    (obj.species === "Zebrafish" ||
      obj.species === "Mouse" ||
      obj.species === "Rat" ||
      obj.species === null) &&
    typeof obj.tags === "object" &&
    Array.isArray(obj.types) &&
    obj.types.every((type: any) => typeof type === "string")
  );
}