import { describe, expect, it } from 'vitest';
import type { Canvas, CanvasAnnotation, CanvasNode } from '@/features/Canvas/types/canvas';
import { diffCanvasForHistory } from '@/features/Canvas/utils/canvasHistoryUtils';
import { makeCanvas } from '@/features/Canvas/utils/canvasTestFixtures';

const makeNode = (overrides: Partial<CanvasNode> & Pick<CanvasNode, 'id' | 'dataId'>): CanvasNode => ({
  ref: overrides.id,
  names: [overrides.id],
  types: ['biolink:NamedThing'],
  curies: [overrides.id],
  x: 0,
  y: 0,
  hidden: false,
  tags: {},
  ...overrides,
});

const makeAnnotation = (
  overrides: Partial<CanvasAnnotation> & Pick<CanvasAnnotation, 'id' | 'dataId'>,
): CanvasAnnotation => ({
  text: 'note',
  position: { x: 0, y: 0 },
  width: 160,
  height: 80,
  timeCreated: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('diffCanvasForHistory', () => {
  it('marks deleted nodes for restore when undoing a delete', () => {
    const node = makeNode({ id: 'n1', dataId: 11, x: 10, y: 20 });
    const beforeDelete = makeCanvas({ nodes: { n1: node } });
    const afterDelete = makeCanvas({ nodes: {} });

    const diff = diffCanvasForHistory(afterDelete, beforeDelete);

    expect(diff.restore).toEqual({ nodes: [11] });
    expect(diff.trash).toEqual({});
  });

  it('marks added nodes for trash when undoing an add', () => {
    const node = makeNode({ id: 'n1', dataId: 11 });
    const beforeAdd = makeCanvas({ nodes: {} });
    const afterAdd = makeCanvas({ nodes: { n1: node } });

    const diff = diffCanvasForHistory(afterAdd, beforeAdd);

    expect(diff.trash).toEqual({ nodes: [11] });
    expect(diff.restore).toEqual({});
  });

  it('captures node position and layout changes', () => {
    const before = makeCanvas({
      layout: 'horizontal',
      nodes: { n1: makeNode({ id: 'n1', dataId: 11, x: 0, y: 0 }) },
    });
    const after = makeCanvas({
      layout: 'custom',
      nodes: { n1: makeNode({ id: 'n1', dataId: 11, x: 40, y: 50 }) },
    });

    const diff = diffCanvasForHistory(before, after);

    expect(diff.layout).toBe('custom');
    expect(diff.geometry).toEqual({
      nodes: [{ data_id: 11, x: 40, y: 50 }],
    });
  });

  it('captures annotation geometry changes', () => {
    const before = makeCanvas({
      annotations: [makeAnnotation({ id: 'a1', dataId: 21, position: { x: 0, y: 0 } })],
    });
    const after = makeCanvas({
      annotations: [makeAnnotation({
        id: 'a1',
        dataId: 21,
        position: { x: 12, y: 34 },
        width: 200,
        height: 100,
      })],
    });

    const diff = diffCanvasForHistory(before, after);

    expect(diff.geometry).toEqual({
      annotations: [{ id: 21, x: 12, y: 34, width: 200, height: 100 }],
    });
  });

  it('captures annotation text changes', () => {
    const before = makeCanvas({
      annotations: [makeAnnotation({ id: 'a1', dataId: 21, text: 'before' })],
    });
    const after = makeCanvas({
      annotations: [makeAnnotation({ id: 'a1', dataId: 21, text: 'after' })],
    });

    const diff = diffCanvasForHistory(before, after);

    expect(diff.annotationTexts).toEqual([{ id: 21, content: 'after' }]);
  });
});
