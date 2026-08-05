import type { GraphAnnotation } from 'translator-graph-view';
import type {
  BackendCanvasAnnotation,
  CanvasAnnotation,
  CanvasNode,
  CreateCanvasAnnotationRequest,
  GraphGeometry,
} from '@/features/Canvas/types/canvas';

export const ANNOTATION_ID_PREFIX = 'annotation-';
export const DEFAULT_ANNOTATION_WIDTH = 200;
export const DEFAULT_ANNOTATION_HEIGHT = 80;

const BASE_POSITION = { x: 100, y: 100 };
const POSITION_STAGGER = 40;

export const annotationIdFromDataId = (dataId: number): string =>
  `${ANNOTATION_ID_PREFIX}${dataId}`;

export const estimatePlacementNearNodes = (
  nodes: Record<string, CanvasNode>,
  existingCount: number,
): { x: number; y: number } => {
  const nodeList = Object.values(nodes);
  if (nodeList.length === 0) {
    return {
      x: BASE_POSITION.x + existingCount * POSITION_STAGGER,
      y: BASE_POSITION.y + existingCount * POSITION_STAGGER,
    };
  }

  const centerX = nodeList.reduce((sum, node) => sum + node.x, 0) / nodeList.length;
  const centerY = nodeList.reduce((sum, node) => sum + node.y, 0) / nodeList.length;
  const offset = existingCount * POSITION_STAGGER;
  return { x: centerX + offset, y: centerY + offset };
};

export const backendAnnotationToCanvasAnnotation = (
  annotation: BackendCanvasAnnotation,
): CanvasAnnotation => ({
  id: annotationIdFromDataId(annotation.id),
  dataId: annotation.id,
  text: annotation.content,
  position: { x: annotation.x, y: annotation.y },
  width: annotation.width,
  height: annotation.height,
  timeCreated: annotation.time_created,
});

export const backendAnnotationsToCanvasAnnotations = (
  annotations: BackendCanvasAnnotation[] | undefined,
): CanvasAnnotation[] =>
  (annotations ?? [])
    .filter(annotation => !annotation.time_deleted)
    .map(backendAnnotationToCanvasAnnotation);

export const createCanvasAnnotationDraft = (
  existing: CanvasAnnotation[],
  nodes: Record<string, CanvasNode>,
): CreateCanvasAnnotationRequest => {
  const position = estimatePlacementNearNodes(nodes, existing.length);
  return {
    content: '',
    x: position.x,
    y: position.y,
    width: DEFAULT_ANNOTATION_WIDTH,
    height: DEFAULT_ANNOTATION_HEIGHT,
  };
};

export const canvasAnnotationToGraphAnnotation = (
  annotation: CanvasAnnotation,
): GraphAnnotation => ({
  id: annotation.id,
  text: annotation.text,
  position: annotation.position,
});

export const canvasAnnotationsToGraphAnnotations = (
  annotations: CanvasAnnotation[],
): GraphAnnotation[] => annotations.map(canvasAnnotationToGraphAnnotation);

export const canvasAnnotationsToGeometryPayload = (
  annotations: CanvasAnnotation[],
): NonNullable<GraphGeometry['annotations']> =>
  annotations
    .filter(annotation => annotation.dataId > 0)
    .map(annotation => ({
      id: annotation.dataId,
      x: annotation.position.x,
      y: annotation.position.y,
      width: annotation.width,
      height: annotation.height,
    }));

export const syncGraphAnnotationsToCanvas = (
  previous: CanvasAnnotation[],
  next: GraphAnnotation[],
): CanvasAnnotation[] => {
  const previousById = new Map(previous.map(annotation => [annotation.id, annotation]));
  return next.map(annotation => {
    const existing = previousById.get(annotation.id);
    return {
      id: annotation.id,
      dataId: existing?.dataId ?? 0,
      text: annotation.text,
      position: annotation.position,
      width: existing?.width ?? DEFAULT_ANNOTATION_WIDTH,
      height: existing?.height ?? DEFAULT_ANNOTATION_HEIGHT,
      timeCreated: existing?.timeCreated ?? new Date().toISOString(),
    };
  });
};

export const estimateAnnotationHeightFromText = (text: string): number =>
  Math.max(DEFAULT_ANNOTATION_HEIGHT, Math.ceil(text.length / 30) * 20 + 48);
