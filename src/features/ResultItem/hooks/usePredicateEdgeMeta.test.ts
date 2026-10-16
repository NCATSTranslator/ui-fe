import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePredicateEdgeMeta } from '@/features/ResultItem/hooks/usePredicateEdgeMeta';
import { makeTestEdge, makeTestNode, makeTestResultSet } from '@/features/ResultList/utils/resultTestFixtures';

const pubRef = (id: string) => ({ id, support: { object: [0, 0] as [number, number], subject: [0, 0] as [number, number], text: '' }, infores: 'infores:test' });

const plain = makeTestEdge('e-plain');
const withPub = makeTestEdge('e-pub', { publications: { 'infores:test': [pubRef('PMID:1')] } });
const withTrial = makeTestEdge('e-trial', { trials: ['NCT1'] });
const resultSet = makeTestResultSet(
  { [plain.id]: plain, [withPub.id]: withPub, [withTrial.id]: withTrial },
  { n1: makeTestNode('n1'), n2: makeTestNode('n2') },
);

describe('usePredicateEdgeMeta', () => {
  it('describes a single edge with no evidence', () => {
    const { result } = renderHook(() => usePredicateEdgeMeta(resultSet, plain));
    expect(result.current).toMatchObject({ hasMore: false, hasPubs: false, hasCTs: false, isAcceptedOntology: false });
    expect(result.current.tooltipEdgeEntries.map(e => e.id)).toEqual(['e-plain']);
  });

  it('includes compressed edges when checking evidence and building tooltip entries', () => {
    const compressed = makeTestEdge('e-top', { compressed_edges: [withPub, withTrial] });
    const { result } = renderHook(() => usePredicateEdgeMeta(resultSet, compressed));
    expect(result.current).toMatchObject({ hasMore: true, hasPubs: true, hasCTs: true });
    // compressed edges first, then the edge itself
    expect(result.current.tooltipEdgeEntries.map(e => e.id)).toEqual(['e-pub', 'e-trial', 'e-top']);
  });

  it('flags subclass/superclass predicates as accepted ontology', () => {
    const { result } = renderHook(() => usePredicateEdgeMeta(resultSet, makeTestEdge('e-sub', { predicate: 'subclass of' })));
    expect(result.current.isAcceptedOntology).toBe(true);
  });

  it('has no tooltip entries without a result set', () => {
    const { result } = renderHook(() => usePredicateEdgeMeta(null, withPub));
    expect(result.current.tooltipEdgeEntries).toEqual([]);
    expect(result.current.hasPubs).toBe(true);
  });
});
