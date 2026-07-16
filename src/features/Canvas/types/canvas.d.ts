import { ResultSetTags, EntityTags, ResultEdge } from '@/features/ResultList/types/results';

// ---------------------------------------------------------------------------
// Backend response types (match API contract exactly)
// ---------------------------------------------------------------------------

export type BackendUserCanvas = {
  user_id: string;
  id: number;
  label: string;
  layout: CanvasLayout;
  data: {
    tags: ResultSetTags | null;
    query_ref: string | null;
    result_ref: string | null;
  };
  time_created: string;
  time_updated: string;
  time_deleted: string | null;
};

export type BackendCanvasNode = {
  canvas_id: number;
  data_id: number;
  ref: string;
  label: string;
  type: string;
  x: number;
  y: number;
  hidden: boolean;
  tags: EntityTags;
  time_created: string;
  time_updated: string;
  time_deleted: string | null;
};

export type BackendCanvasEdge = {
  canvas_id: number;
  data_id: number;
  subject_id: number;
  object_id: number;
  ref: string;
  label: string;
  hidden: boolean;
  tags: EntityTags;
  time_created: string;
  time_updated: string;
  time_deleted: string | null;
};

export type BackendCanvasGraph = {
  nodes: BackendCanvasNode[];
  edges: BackendCanvasEdge[];
  tags: ResultSetTags | null;
};

// ---------------------------------------------------------------------------
// Submission types (sent to backend for create/merge)
// ---------------------------------------------------------------------------

export type GraphSubmissionNode = {
  id: string;
  aras: string[];
  descriptions: string[];
  names: string[];
  types: string[];
  synonyms: string[];
  curies: string[];
  provenance: unknown[];
  tags: EntityTags;
  source_time: string;
  annotations?: unknown;
  x: number;
  y: number;
  hidden?: boolean;
  label?: string;
  signature: string;
};

export type GraphSubmissionEdge = {
  id: string;
  subject: string;
  object: string;
  predicate: string;
  aras: string[];
  support: unknown[];
  is_root: boolean;
  inferred: boolean;
  knowledge_level: string;
  description: string | null;
  type: string;
  predicate_url: string | null;
  provenance: unknown[];
  publications: Record<string, unknown>;
  metadata: unknown;
  trials: unknown[];
  tags: EntityTags;
  source_time: string;
  hidden?: boolean;
  label?: string;
  signature: string;
};

export type GraphSubmission = {
  nodes: Record<string, GraphSubmissionNode>;
  edges: Record<string, GraphSubmissionEdge>;
  tag_descriptions?: ResultSetTags;
  source?: {
    query_ref: string;
    result_ref: string;
  };
};

export type GraphSelection = {
  nodes?: number[];
  edges?: number[];
};

export type GraphMove = {
  nodes: Array<{
    data_id: number;
    x: number;
    y: number;
  }>;
};

export type UpdateCanvasElementRequest = {
  label?: string;
  hidden?: boolean;
};

// ---------------------------------------------------------------------------
// Internal frontend types (consumed by components and hooks)
// ---------------------------------------------------------------------------

export type CanvasLayout = 'horizontal' | 'vertical' | 'concentric' | 'custom';

export type Canvas = {
  id: number;
  label: string;
  layout: CanvasLayout;
  nodes: Record<string, CanvasNode>;
  edges: Record<string, CanvasEdge>;
  tags: ResultSetTags | null;
  queryRef: string | null;
  resultRef: string | null;
  annotations: CanvasAnnotation[];
  timeCreated: string;
  timeUpdated: string;
};

export type CanvasNode = {
  id: string;
  dataId: number;
  ref: string;
  names: string[];
  types: string[];
  curies: string[];
  x: number;
  y: number;
  hidden: boolean;
  tags: EntityTags;
};

export type CanvasEdge = Partial<ResultEdge> &
  Pick<ResultEdge, 'id' | 'subject' | 'object' | 'predicate' | 'tags'> & {
  dataId: number;
  ref: string;
  subjectDataId: number;
  objectDataId: number;
  hidden: boolean;
};

export type CanvasAnnotation = {
  id: string;
  text: string;
  position?: { x: number; y: number };
  timeCreated: string;
};

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

// ---------------------------------------------------------------------------
// Inspector types (unchanged)
// ---------------------------------------------------------------------------

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
