import { describe, it, expect } from 'vitest';
import {
  extractNodesAndEdgesFromPath,
  getIncidentEdgeIds,
  selectionForRemovedElements,
} from '@/features/Canvas/utils/canvasGraphFunctions';
import { makeCanvas, makeCanvasEdge, makeCanvasNode } from '@/features/Canvas/utils/canvasTestFixtures';
import {
  makeTestEdge,
  makeTestNode,
  makeTestPath,
  makeTestResultSet,
} from '@/features/ResultList/utils/resultTestFixtures';

describe('extractNodesAndEdgesFromPath', () => {
  it('extracts nodes and edges from an uncompressed path', () => {
    const rs = makeTestResultSet(
      { e1: makeTestEdge('e1', { predicate: 'biolink:treats' }) },
      { n1: makeTestNode('n1', 'Aspirin'), n2: makeTestNode('n2', 'Pain') },
    );
    const { nodes, edges } = extractNodesAndEdgesFromPath(rs, makeTestPath());

    expect(nodes.map(n => n.id)).toEqual(['n1', 'n2']);
    expect(edges.map(e => e.id)).toEqual(['e1']);
  });

  it('includes every distinct-predicate edge from a compressed hop', () => {
    const rs = makeTestResultSet(
      {
        e1: makeTestEdge('e1', { predicate: 'biolink:related_to' }),
        e2: makeTestEdge('e2', { predicate: 'biolink:interacts_with' }),
        e3: makeTestEdge('e3', { predicate: 'biolink:affects' }),
      },
      { n1: makeTestNode('n1'), n2: makeTestNode('n2') },
    );
    const path = makeTestPath({
      subgraph: ['n1', 'e1', 'n2'],
      compressedSubgraph: ['n1', ['e1', 'e2', 'e3'], 'n2'],
    });
    const { edges } = extractNodesAndEdgesFromPath(rs, path);

    expect(edges.map(e => e.id).sort()).toEqual(['e1', 'e2', 'e3']);
  });

  it('dedupes same-predicate edges within a compressed hop', () => {
    const rs = makeTestResultSet(
      {
        e1: makeTestEdge('e1', { predicate: 'biolink:related_to' }),
        e2: makeTestEdge('e2', { predicate: 'biolink:related_to' }),
        e3: makeTestEdge('e3', { predicate: 'biolink:interacts_with' }),
      },
      { n1: makeTestNode('n1'), n2: makeTestNode('n2') },
    );
    const path = makeTestPath({
      subgraph: ['n1', 'e1', 'n2'],
      compressedSubgraph: ['n1', ['e1', 'e2', 'e3'], 'n2'],
    });
    const { edges } = extractNodesAndEdgesFromPath(rs, path);

    expect(edges.map(e => e.id).sort()).toEqual(['e1', 'e3']);
  });

  it('falls back to subgraph when compressedSubgraph is null', () => {
    const rs = makeTestResultSet(
      { e1: makeTestEdge('e1') },
      { n1: makeTestNode('n1'), n2: makeTestNode('n2') },
    );
    const path = makeTestPath({ compressedSubgraph: null });
    const { edges } = extractNodesAndEdgesFromPath(rs, path);

    expect(edges.map(e => e.id)).toEqual(['e1']);
  });
});

describe('getIncidentEdgeIds', () => {
  const edges = {
    ab: makeCanvasEdge('ab', 'a', 'b'),
    bc: makeCanvasEdge('bc', 'b', 'c'),
    cd: makeCanvasEdge('cd', 'c', 'd'),
  };

  it('returns every edge connected to the given nodes', () => {
    expect(getIncidentEdgeIds(edges, ['a', 'b']).sort()).toEqual(['ab', 'bc']);
  });

  it('returns nothing when no nodes are given', () => {
    expect(getIncidentEdgeIds(edges, [])).toEqual([]);
  });
});

describe('selectionForRemovedElements', () => {
  const canvas = makeCanvas({
    nodes: {
      a: makeCanvasNode('a', { dataId: 10 }),
      b: makeCanvasNode('b', { dataId: 11 }),
      c: makeCanvasNode('c', { dataId: 12 }),
    },
    edges: {
      ab: makeCanvasEdge('ab', 'a', 'b', { dataId: 20 }),
      bc: makeCanvasEdge('bc', 'b', 'c', { dataId: 21 }),
    },
  });

  it('collects the removed nodes and every edge connected to them', () => {
    expect(selectionForRemovedElements(canvas, ['a'])).toEqual({
      nodes: [10],
      edges: [20],
    });
  });

  it('takes several nodes and their edges in one selection', () => {
    const selection = selectionForRemovedElements(canvas, ['a', 'b']);

    expect(selection?.nodes).toEqual([10, 11]);
    expect(selection?.edges?.sort()).toEqual([20, 21]);
  });

  it('takes edges on their own', () => {
    expect(selectionForRemovedElements(canvas, [], ['bc'])).toEqual({ edges: [21] });
  });

  it('does not repeat an edge named directly and reached through its node', () => {
    expect(selectionForRemovedElements(canvas, ['a'], ['ab'])).toEqual({
      nodes: [10],
      edges: [20],
    });
  });

  it('drops elements the server has never seen', () => {
    const local = makeCanvas({
      nodes: { a: makeCanvasNode('a', { dataId: 0 }) },
      edges: { ab: makeCanvasEdge('ab', 'a', 'b', { dataId: 0 }) },
    });

    expect(selectionForRemovedElements(local, ['a'])).toBeNull();
  });

  it('ignores ids the canvas does not hold', () => {
    expect(selectionForRemovedElements(canvas, ['missing'], ['gone'])).toBeNull();
  });
});
