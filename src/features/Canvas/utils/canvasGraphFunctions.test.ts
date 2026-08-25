import { describe, it, expect } from 'vitest';
import { extractNodesAndEdgesFromPath } from '@/features/Canvas/utils/canvasGraphFunctions';
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
