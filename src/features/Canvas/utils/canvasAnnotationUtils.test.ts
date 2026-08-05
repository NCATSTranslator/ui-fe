import { describe, it, expect } from 'vitest';
import {
  annotationIdFromDataId,
  backendAnnotationToCanvasAnnotation,
  backendAnnotationsToCanvasAnnotations,
  canvasAnnotationsToGeometryPayload,
  canvasAnnotationsToGraphAnnotations,
  createCanvasAnnotationDraft,
  syncGraphAnnotationsToCanvas,
  DEFAULT_ANNOTATION_HEIGHT,
  DEFAULT_ANNOTATION_WIDTH,
} from '@/features/Canvas/utils/canvasAnnotationUtils';
import type { BackendCanvasAnnotation, CanvasAnnotation } from '@/features/Canvas/types/canvas';

const backendAnnotation = (overrides: Partial<BackendCanvasAnnotation> = {}): BackendCanvasAnnotation => ({
  canvas_id: 1,
  id: 42,
  content: 'Note',
  x: 100,
  y: 200,
  width: 220,
  height: 90,
  time_created: '2026-01-01T00:00:00.000Z',
  time_updated: '2026-01-02T00:00:00.000Z',
  time_deleted: null,
  ...overrides,
});

describe('canvasAnnotationUtils', () => {
  it('maps backend annotations to canvas annotations', () => {
    expect(backendAnnotationToCanvasAnnotation(backendAnnotation())).toEqual({
      id: 'annotation-42',
      dataId: 42,
      text: 'Note',
      position: { x: 100, y: 200 },
      width: 220,
      height: 90,
      timeCreated: '2026-01-01T00:00:00.000Z',
    });
  });

  it('filters deleted backend annotations', () => {
    const annotations = backendAnnotationsToCanvasAnnotations([
      backendAnnotation({ id: 1 }),
      backendAnnotation({ id: 2, time_deleted: '2026-01-03T00:00:00.000Z' }),
    ]);

    expect(annotations).toHaveLength(1);
    expect(annotations[0].dataId).toBe(1);
  });

  it('creates annotation drafts near graph nodes', () => {
    const draft = createCanvasAnnotationDraft([], {
      'CHEBI:123': { id: 'CHEBI:123', x: 200, y: 300 } as never,
    });

    expect(draft.content).toBe('');
    expect(draft.x).toBe(200);
    expect(draft.y).toBe(300);
    expect(draft.width).toBe(DEFAULT_ANNOTATION_WIDTH);
    expect(draft.height).toBe(DEFAULT_ANNOTATION_HEIGHT);
  });

  it('maps canvas annotations to graph annotations', () => {
    const graphAnnotations = canvasAnnotationsToGraphAnnotations([
      {
        id: annotationIdFromDataId(1),
        dataId: 1,
        text: 'Note',
        position: { x: 10, y: 20 },
        width: DEFAULT_ANNOTATION_WIDTH,
        height: DEFAULT_ANNOTATION_HEIGHT,
        timeCreated: '2026-01-01T00:00:00.000Z',
      },
    ]);

    expect(graphAnnotations).toEqual([
      { id: 'annotation-1', text: 'Note', position: { x: 10, y: 20 } },
    ]);
  });

  it('preserves metadata when syncing graph annotation updates', () => {
    const previous: CanvasAnnotation[] = [{
      id: 'annotation-1',
      dataId: 1,
      text: 'Old',
      position: { x: 1, y: 2 },
      width: 180,
      height: 72,
      timeCreated: '2026-01-01T00:00:00.000Z',
    }];

    const synced = syncGraphAnnotationsToCanvas(previous, [
      { id: 'annotation-1', text: 'New', position: { x: 10, y: 20 } },
    ]);

    expect(synced[0]).toEqual({
      id: 'annotation-1',
      dataId: 1,
      text: 'New',
      position: { x: 10, y: 20 },
      width: 180,
      height: 72,
      timeCreated: '2026-01-01T00:00:00.000Z',
    });
  });

  it('builds geometry payloads for persistence', () => {
    expect(canvasAnnotationsToGeometryPayload([
      {
        id: 'annotation-5',
        dataId: 5,
        text: 'Saved',
        position: { x: 4, y: 8 },
        width: 200,
        height: 80,
        timeCreated: '2026-01-01T00:00:00.000Z',
      },
    ])).toEqual([{
      id: 5,
      x: 4,
      y: 8,
      width: 200,
      height: 80,
    }]);
  });

  it('omits annotations without a persisted data id from geometry payloads', () => {
    expect(canvasAnnotationsToGeometryPayload([
      {
        id: 'annotation-pending',
        dataId: 0,
        text: 'Draft',
        position: { x: 1, y: 2 },
        width: DEFAULT_ANNOTATION_WIDTH,
        height: DEFAULT_ANNOTATION_HEIGHT,
        timeCreated: '2026-01-01T00:00:00.000Z',
      },
    ])).toEqual([]);
  });
});
