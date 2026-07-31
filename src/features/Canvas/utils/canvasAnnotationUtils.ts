import type { GraphAnnotation } from 'translator-graph-view';
import type { CanvasAnnotation, CanvasNode } from '@/features/Canvas/types/canvas';

const ANNOTATION_ID_PREFIX = 'annotation-';
const BASE_POSITION = { x: 100, y: 100 };
const POSITION_STAGGER = 40;

export const createAnnotationId = (): string =>
  `${ANNOTATION_ID_PREFIX}${crypto.randomUUID()}`;

const isAnnotationIdAvailable = (
  id: string,
  existing: CanvasAnnotation[],
  nodes: Record<string, CanvasNode>,
): boolean => !nodes[id] && !existing.some(annotation => annotation.id === id);

export const estimateAnnotationPosition = (
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

export const createCanvasAnnotation = (
  existing: CanvasAnnotation[],
  nodes: Record<string, CanvasNode>,
): CanvasAnnotation => {
  let id = createAnnotationId();
  while (!isAnnotationIdAvailable(id, existing, nodes)) {
    id = createAnnotationId();
  }

  return {
    id,
    text: '',
    position: estimateAnnotationPosition(nodes, existing.length),
    timeCreated: new Date().toISOString(),
  };
};

export const canvasAnnotationToGraphAnnotation = (
  annotation: CanvasAnnotation,
): GraphAnnotation => ({
  id: annotation.id,
  text: annotation.text,
  position: annotation.position ?? { x: 0, y: 0 },
});

export const canvasAnnotationsToGraphAnnotations = (
  annotations: CanvasAnnotation[],
): GraphAnnotation[] => annotations.map(canvasAnnotationToGraphAnnotation);

export const syncGraphAnnotationsToCanvas = (
  previous: CanvasAnnotation[],
  next: GraphAnnotation[],
): CanvasAnnotation[] => {
  const previousById = new Map(previous.map(annotation => [annotation.id, annotation]));
  return next.map(annotation => ({
    id: annotation.id,
    text: annotation.text,
    position: annotation.position,
    timeCreated: previousById.get(annotation.id)?.timeCreated ?? new Date().toISOString(),
  }));
};
