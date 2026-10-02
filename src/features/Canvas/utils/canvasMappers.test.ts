import { describe, it, expect } from 'vitest';
import { backendGraphToInternal } from '@/features/Canvas/utils/canvasMappers';
import {
  makeBackendCanvasEdge,
  makeBackendCanvasNode,
} from '@/features/Canvas/utils/canvasTestFixtures';

describe('backendGraphToInternal', () => {
  it('addresses nodes and edges by their canvas entity id, not their data id', () => {
    const { nodes, edges } = backendGraphToInternal({
      nodes: [makeBackendCanvasNode(1, 'n1'), makeBackendCanvasNode(2, 'n2')],
      edges: [makeBackendCanvasEdge(3, 'e1', 1, 2)],
      tags: null,
    });

    expect(nodes.n1.dataId).toBe(1);
    expect(nodes.n2.dataId).toBe(2);
    expect(edges.e1.dataId).toBe(3);
  });

  it('resolves edge endpoints through canvas node ids', () => {
    const { edges } = backendGraphToInternal({
      nodes: [makeBackendCanvasNode(1, 'n1'), makeBackendCanvasNode(2, 'n2')],
      edges: [makeBackendCanvasEdge(3, 'e1', 2, 1)],
      tags: null,
    });

    expect(edges.e1.subject).toBe('n2');
    expect(edges.e1.object).toBe('n1');
    expect(edges.e1.subjectDataId).toBe(2);
    expect(edges.e1.objectDataId).toBe(1);
  });
});
