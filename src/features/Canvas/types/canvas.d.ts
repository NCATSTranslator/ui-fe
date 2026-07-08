
export type Canvas = {
  id: string;
  title: string;
  nodes: Record<string, CanvasNode>;
  edges: Record<string, CanvasEdge>;
  annotations: CanvasAnnotation[];
  nodePositions: Record<string, { x: number; y: number }>;
  sources: CanvasSource[];
  timeCreated: string;
  timeUpdated: string;
};

export type CanvasNode = {
  id: string;
  names: string[];
  types: string[];
  curies: string[];
  sources: string[];
};

export type CanvasEdge = {
  id: string;
  subject: string;
  object: string;
  predicate: string;
  inferred?: boolean;
  sources: string[];
};

export type CanvasAnnotation = {
  id: string;
  text: string;
  position?: { x: number; y: number };
  timeCreated: string;
};

export type CanvasSource = {
  id: string;
  type: 'query' | 'manual' | 'search';
  label: string;
  queryPk?: string;
};

export type InspectorLevel = 'query' | 'result' | 'path' | 'evidence' | 'node';

export type InspectorBreadcrumb = {
  label: string;
  level: InspectorLevel;
  id: string;
  data: InspectorViewData;
};

export type InspectorQueryData = {
  queryPk: string;
};

export type InspectorResultData = {
  queryPk: string;
  resultId: string;
};

export type InspectorPathData = {
  queryPk: string;
  resultId: string;
  pathId: string;
};

export type InspectorEvidenceData = {
  queryPk: string;
  edgeId: string;
  pathId?: string;
  resultId?: string;
};

export type InspectorNodeData = {
  nodeId: string;
  queryPk?: string;
};

export type InspectorViewData =
  | InspectorQueryData
  | InspectorResultData
  | InspectorPathData
  | InspectorEvidenceData
  | InspectorNodeData;
