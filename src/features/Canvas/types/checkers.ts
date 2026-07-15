import type { BackendUserCanvas, BackendCanvasNode, BackendCanvasGraph } from '@/features/Canvas/types/canvas';

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

export const isBackendCanvasGraph = (obj: unknown): obj is BackendCanvasGraph => {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return Array.isArray(o.nodes) && Array.isArray(o.edges);
};
