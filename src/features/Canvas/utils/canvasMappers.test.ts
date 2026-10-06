import { describe, it, expect } from 'vitest';
import {
  backendGraphToInternal,
  canvasNodesToGraphSubmission,
  resultDataToGraphSubmission,
} from '@/features/Canvas/utils/canvasMappers';
import {
  makeBackendCanvasEdge,
  makeBackendCanvasNode,
  makeCanvasEdge,
  makeCanvasNode,
} from '@/features/Canvas/utils/canvasTestFixtures';
import {
  makeTestEdge,
  makeTestNode,
  makeTestResultSet,
} from '@/features/ResultList/utils/resultTestFixtures';

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

describe('resultDataToGraphSubmission', () => {
  it('nests Translator data in the data slot with placement beside it', () => {
    const resultSet = makeTestResultSet(
      { e1: makeTestEdge('e1') },
      { n1: makeTestNode('n1', 'Aspirin'), n2: makeTestNode('n2', 'Pain') },
    );
    const submission = resultDataToGraphSubmission(resultSet, ['n1', 'n2'], ['e1']);

    expect(submission.nodes).toEqual([
      { x: 0, y: 0, data: expect.objectContaining({ id: 'n1', signature: 'n1' }) },
      { x: 0, y: 0, data: expect.objectContaining({ id: 'n2', signature: 'n2' }) },
    ]);
    expect(submission.edges).toEqual([
      { data: expect.objectContaining({ id: 'e1', subject: 'n1', object: 'n2', signature: 'e1' }) },
    ]);
  });
});

describe('canvasNodesToGraphSubmission', () => {
  it('nests Translator data in the data slot with display fields beside it', () => {
    const submission = canvasNodesToGraphSubmission(
      [makeCanvasNode('a', { x: 3, y: 4 })],
      [makeCanvasEdge('ab', 'a', 'b')],
    );

    expect(submission.nodes).toEqual([
      { x: 3, y: 4, hidden: false, data: expect.objectContaining({ id: 'a', signature: 'a' }) },
    ]);
    expect(submission.edges).toEqual([
      { hidden: false, data: expect.objectContaining({ id: 'ab', subject: 'a', object: 'b' }) },
    ]);
  });
});
