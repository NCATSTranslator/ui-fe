// type KnowledgeLevel = "unknown" | "";

// type Score = {
//   clinical_evidence: number;
//   confidence: number;
//   normalized_score: number;
//   novelty: number;
// }

// type Provenance = {
//   knowledge_level: KnowledgeLevel;
//   name: string;
//   url: string;
// }

// type ResultEdge = {
//   // array of ARA names
//   aras: string[];
//   "is_root": boolean;
//   knowledge_level: KnowledgeLevel;
//   // nodeID
//   object: string;
//   predicate: string;
//   predicate_url: string;
//   provenance: Provenance[];
//   publications: {[key: string]: [{id: string; support: PublicationSupport}]};
//   // nodeID
//   subject: string;
//   // array of path ids
//   support: string[];
// }

// type ResultNode = {
//   aras: string[];
//   curies: string[];
//   descriptions: string[];
//   names: string[];
//   other_names: string[];
//   // link to relevant info about node
//   provenance: string;
//   species: "Zebrafish" | "Mouse" | "Rat" | null;
//   tags: Tags;
//   // array of biolink types
//   types: string[];
// }

// type Path = {
//   aras: string[];
//   // array of nodes and edges in order
//   subgraph: string[];
//   tags: Tags;
// }

// type Publication = {

// }

// type PublicationSupport = {
//   object: number[];
//   subject: number[];
//   text: string;
// }

// type Result = {
//   drug_name: string;
//   id: string;
//   // node ID
//   object: string;
//   // array of path IDs
//   paths: string[];
//   scores: Score[];
//   // node ID
//   subject: string;
//   tags: {[key: string]: null};
// }

// type Tag = {
//   name: string;
//   value: string;
// }
// type Tags =  {[key: string]: Tag};

// type Meta = {
//   aras: string[];
//   qid: string;
//   timestamp: string;
// }

// type Errors = {
//   "biothings-annotator":  string[];
//   unknown: string[];
// }

// type ResultSet = {
//   status: "running" | "success",
//   data: {
//     edges: {[key: string]: ResultEdge},
//     errors: Errors,
//     meta: Meta,
//     nodes: {[key: string]: ResultNode},
//     paths: {[key: string]: Path},
//     publications: {[key: string]: Publication},
//     results: Result[],
//     tags: Tags
//   }
// }