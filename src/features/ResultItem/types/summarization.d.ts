import { PublicationSupport } from "@/features/Evidence/types/evidence";

export type SummaryEdgeObject = Record<string, SummaryEdge>;
export type SummaryEdge = {
  subject: string;
  predicate: string;
  object: string;
  publications: { [key: string]: { id: string; support: PublicationSupport; infores: string }[] };
  trials: string[];
};

export type SummaryNodeObject = Record<string, SummaryNode>;
export type SummaryNode = {
  names: string[];
  types: string[];
};

export type SummaryPathObject = Record<string, SummaryPath>;
export type SummaryPath = {
  subgraph: string[];
};

export type SummaryResult = {
  id: string;
  subject: string;
  object: string;
  "drug name": string;
  paths: string[];
};

export type SummaryPayload = {
  results: SummaryResult[];
  paths: SummaryPathObject;
  nodes: SummaryNodeObject;
  edges: SummaryEdgeObject;
  disease: string;
  disease_name: string;
  disease_description: string;
};