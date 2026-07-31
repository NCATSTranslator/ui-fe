import { describe, it, expect } from 'vitest';
import {
  createCanvasAnnotation,
  canvasAnnotationsToGraphAnnotations,
  syncGraphAnnotationsToCanvas,
} from '@/features/Canvas/utils/canvasAnnotationUtils';
import type { CanvasAnnotation } from '@/features/Canvas/types/canvas';

describe('canvasAnnotationUtils', () => {
  it('creates annotation ids that do not collide with graph nodes', () => {
    const existing: CanvasAnnotation[] = [];
    const nodes = { 'CHEBI:123': { id: 'CHEBI:123', x: 200, y: 300 } as never };
    const annotation = createCanvasAnnotation(existing, nodes);

    expect(annotation.id.startsWith('annotation-')).toBe(true);
    expect(annotation.id).not.toBe('CHEBI:123');
    expect(annotation.text).toBe('');
    expect(annotation.position).toEqual({ x: 200, y: 300 });
  });

  it('maps canvas annotations to graph annotations with default position', () => {
    const graphAnnotations = canvasAnnotationsToGraphAnnotations([
      { id: 'annotation-1', text: 'Note', timeCreated: '2026-01-01T00:00:00.000Z' },
    ]);

    expect(graphAnnotations).toEqual([
      { id: 'annotation-1', text: 'Note', position: { x: 0, y: 0 } },
    ]);
  });

  it('preserves timeCreated when syncing graph annotation updates', () => {
    const previous: CanvasAnnotation[] = [{
      id: 'annotation-1',
      text: 'Old',
      position: { x: 1, y: 2 },
      timeCreated: '2026-01-01T00:00:00.000Z',
    }];

    const synced = syncGraphAnnotationsToCanvas(previous, [
      { id: 'annotation-1', text: 'New', position: { x: 10, y: 20 } },
      { id: 'annotation-2', text: 'Added', position: { x: 3, y: 4 } },
    ]);

    expect(synced[0].timeCreated).toBe('2026-01-01T00:00:00.000Z');
    expect(synced[0].text).toBe('New');
    expect(synced[1].timeCreated).toBeTruthy();
  });
});
