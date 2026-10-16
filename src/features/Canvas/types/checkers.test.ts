import { describe, it, expect } from 'vitest';
import { isBackendCanvasGraph } from '@/features/Canvas/types/checkers';
import { makeBackendCanvasEdge, makeBackendCanvasNode } from '@/features/Canvas/utils/canvasTestFixtures';

describe('isBackendCanvasGraph', () => {
  const graph = {
    nodes: [makeBackendCanvasNode(1, 'n1'), makeBackendCanvasNode(2, 'n2')],
    edges: [makeBackendCanvasEdge(3, 'e1', 1, 2)],
    tags: null,
  };

  it('accepts a graph whose entities carry canvas entity ids', () => {
    expect(isBackendCanvasGraph(graph)).toBe(true);
  });

  it('accepts entities with only user data, whose ref is null', () => {
    const userOnly = makeBackendCanvasNode(4, 'unused', { ref: null, data_id: null, user_data_id: 9 });
    expect(isBackendCanvasGraph({ ...graph, nodes: [...graph.nodes, userOnly] })).toBe(true);
  });

  it('rejects the pre-refactor shape that keyed entities by data_id only', () => {
    const legacyNode: Record<string, unknown> = { ...makeBackendCanvasNode(1, 'n1') };
    delete legacyNode.id;
    expect(isBackendCanvasGraph({ ...graph, nodes: [legacyNode] })).toBe(false);
  });

  it('rejects an edge without numeric endpoints', () => {
    const edge: Record<string, unknown> = { ...makeBackendCanvasEdge(3, 'e1', 1, 2), subject_id: '1' };
    expect(isBackendCanvasGraph({ ...graph, edges: [edge] })).toBe(false);
  });
});
