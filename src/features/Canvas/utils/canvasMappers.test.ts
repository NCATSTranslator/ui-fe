import { describe, it, expect } from 'vitest';
import {
  backendGraphToInternal,
  resultDataToGraphSubmission,
  selectionFromSubmission,
} from '@/features/Canvas/utils/canvasMappers';
import {
  makeBackendCanvasEdge,
  makeBackendCanvasNode,
} from '@/features/Canvas/utils/canvasTestFixtures';
import {
  makeTestEdge,
  makeTestNode,
  makeTestResultSet,
} from '@/features/ResultList/utils/resultTestFixtures';
import type { BackendCanvasGraph } from '@/features/Canvas/types/canvas';

describe('backendGraphToInternal', () => {
  it('addresses nodes and edges by their canvas entity id, not their data id', () => {
    const { nodes, edges } = backendGraphToInternal({
      nodes: [makeBackendCanvasNode(1, 'n1'), makeBackendCanvasNode(2, 'n2')],
      edges: [makeBackendCanvasEdge(3, 'e1', 1, 2)],
      tags: null,
    });

    expect(nodes.n1.entityId).toBe(1);
    expect(nodes.n2.entityId).toBe(2);
    expect(edges.e1.entityId).toBe(3);
  });

  it('resolves edge endpoints through canvas node ids', () => {
    const { edges } = backendGraphToInternal({
      nodes: [makeBackendCanvasNode(1, 'n1'), makeBackendCanvasNode(2, 'n2')],
      edges: [makeBackendCanvasEdge(3, 'e1', 2, 1)],
      tags: null,
    });

    expect(edges.e1.subject).toBe('n2');
    expect(edges.e1.object).toBe('n1');
    expect(edges.e1.subjectEntityId).toBe(2);
    expect(edges.e1.objectEntityId).toBe(1);
  });

  it('gives entities with only user data a synthetic ref so each keeps a distinct id', () => {
    const userOnly = { ref: null, data_id: null };
    const { nodes, edges } = backendGraphToInternal({
      nodes: [
        makeBackendCanvasNode(1, 'n1'),
        makeBackendCanvasNode(2, 'unused', { ...userOnly, user_data_id: 7 }),
        makeBackendCanvasNode(3, 'unused', { ...userOnly, user_data_id: 8 }),
      ],
      edges: [makeBackendCanvasEdge(4, 'e1', 1, 2)],
      tags: null,
    });

    expect(Object.keys(nodes).sort()).toEqual(['n1', 'user:7', 'user:8']);
    expect(nodes['user:7'].curies).toEqual([]);
    expect(edges.e1.object).toBe('user:7');
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

describe('selectionFromSubmission', () => {
  const resultSet = makeTestResultSet(
    { e1: makeTestEdge('e1') },
    { n1: makeTestNode('n1', 'Aspirin'), n2: makeTestNode('n2', 'Pain') },
  );
  const submission = resultDataToGraphSubmission(resultSet, ['n1', 'n2'], ['e1']);
  const graph: BackendCanvasGraph = {
    nodes: [makeBackendCanvasNode(1, 'n1'), makeBackendCanvasNode(2, 'n2'), makeBackendCanvasNode(3, 'other')],
    edges: [makeBackendCanvasEdge(4, 'e1', 1, 2), makeBackendCanvasEdge(5, 'other-edge', 1, 3)],
    tags: null,
  };

  it('selects the canvas entity ids of exactly the entities the submission merged', () => {
    expect(selectionFromSubmission(submission, graph)).toEqual({ nodes: [1, 2], edges: [4] });
  });

  it('skips entities the server has already trashed', () => {
    const trashed: BackendCanvasGraph = {
      ...graph,
      nodes: graph.nodes.map(node => (
        node.ref === 'n2' ? { ...node, time_deleted: '2026-01-02T00:00:00.000Z' } : node
      )),
    };
    expect(selectionFromSubmission(submission, trashed)).toEqual({ nodes: [1], edges: [4] });
  });

  it('returns null when nothing from the submission is on the canvas', () => {
    expect(selectionFromSubmission(submission, { nodes: [], edges: [], tags: null })).toBeNull();
  });
});
