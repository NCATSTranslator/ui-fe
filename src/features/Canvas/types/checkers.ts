import * as tc from '@/features/Core/types/checkers';
import { isEdgeProvenance } from '@/features/Evidence/types/checkers';
import type {
  BackendUserCanvas,
  BackendCanvasNode,
  BackendCanvasAnnotation,
  BackendCanvasGraph,
  CanvasNodeDetail,
  CanvasEdgeDetail,
} from '@/features/Canvas/types/canvas';

export const isBackendUserCanvas = (obj: unknown): obj is BackendUserCanvas => {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return typeof o.id === 'number' && typeof o.label === 'string' && typeof o.layout === 'string';
};

export const isBackendUserCanvasArray = (obj: unknown): obj is BackendUserCanvas[] =>
  Array.isArray(obj) && obj.every(isBackendUserCanvas);

export const isBackendCanvasNode = (obj: unknown): obj is BackendCanvasNode => {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return typeof o.data_id === 'number' && typeof o.ref === 'string' && typeof o.label === 'string';
};

export const isBackendCanvasNodeArray = (obj: unknown): obj is BackendCanvasNode[] =>
  Array.isArray(obj) && obj.every(isBackendCanvasNode);

export const isBackendCanvasAnnotation = (obj: unknown): obj is BackendCanvasAnnotation => {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return typeof o.id === 'number' && typeof o.content === 'string'
    && typeof o.x === 'number' && typeof o.y === 'number';
};

export const isBackendCanvasAnnotationArray = (obj: unknown): obj is BackendCanvasAnnotation[] =>
  Array.isArray(obj) && obj.every(isBackendCanvasAnnotation);

export const isBackendCanvasGraph = (obj: unknown): obj is BackendCanvasGraph => {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  if (!Array.isArray(o.nodes) || !Array.isArray(o.edges)) return false;
  if (o.annotations !== undefined && !isBackendCanvasAnnotationArray(o.annotations)) return false;
  return true;
};

export const isCanvasNodeDetail = (obj: unknown): obj is CanvasNodeDetail => {
  if (!tc.isObject(obj)) return false;
  return tc.checkProperties('isCanvasNodeDetail', obj, [
    ['id', tc.isString(obj.id), 'string', obj.id],
    ['aras', tc.isStringArray(obj.aras), 'string[]', obj.aras],
    ['descriptions', tc.isStringArray(obj.descriptions), 'string[]', obj.descriptions],
    ['names', tc.isStringArray(obj.names), 'string[]', obj.names],
    ['types', tc.isStringArray(obj.types), 'string[]', obj.types],
    ['synonyms', tc.isStringArray(obj.synonyms), 'string[]', obj.synonyms],
    ['curies', tc.isStringArray(obj.curies), 'string[]', obj.curies],
    ['provenance', tc.isStringArray(obj.provenance), 'string[]', obj.provenance],
    ['source_time', tc.nullable(obj.source_time, tc.isString), 'string | null', obj.source_time],
    ['tags', tc.isObject(obj.tags), 'EntityTags', obj.tags],
  ], false);
};

export const isCanvasEdgeDetail = (obj: unknown): obj is CanvasEdgeDetail => {
  if (!tc.isObject(obj)) return false;
  return tc.checkProperties('isCanvasEdgeDetail', obj, [
    ['id', tc.isString(obj.id), 'string', obj.id],
    ['aras', tc.isStringArray(obj.aras), 'string[]', obj.aras],
    ['is_root', tc.isBoolean(obj.is_root), 'boolean', obj.is_root],
    ['knowledge_level', tc.isString(obj.knowledge_level), 'string', obj.knowledge_level],
    ['description', tc.nullable(obj.description, tc.isString), 'string | null', obj.description],
    ['type', tc.isString(obj.type), 'string', obj.type],
    ['subject', tc.isString(obj.subject), 'string', obj.subject],
    ['object', tc.isString(obj.object), 'string', obj.object],
    ['predicate', tc.isString(obj.predicate), 'string', obj.predicate],
    ['predicate_url', tc.nullable(obj.predicate_url, tc.isString), 'string | null', obj.predicate_url],
    ['provenance', tc.makeIsHomogeneousArray((p: unknown) => isEdgeProvenance(p))(obj.provenance), 'EdgeProvenance[]', obj.provenance],
    ['publications', tc.isObject(obj.publications), 'object', obj.publications],
    ['metadata', tc.nullable(obj.metadata, tc.isObject), 'EdgeMetadata | null', obj.metadata],
    ['trials', tc.isStringArray(obj.trials), 'string[]', obj.trials],
    ['source_time', tc.nullable(obj.source_time, tc.isString), 'string | null', obj.source_time],
    ['tags', tc.isObject(obj.tags), 'EntityTags', obj.tags],
  ], false);
};
