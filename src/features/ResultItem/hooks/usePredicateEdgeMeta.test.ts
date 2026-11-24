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
    // the edge itself first, then its compressed edges in rank order
    expect(result.current.tooltipEdgeEntries.map(e => e.id)).toEqual(['e-top', 'e-pub', 'e-trial']);
  });

  it('flags drug labels and counts them per tooltip entry, apart from publications', () => {
    const labelId = 'dailymed:0a1b2c3d-0000-4000-8000-000000000001';
    const withLabel = makeTestEdge('e-label', { publications: { 'infores:test': [pubRef(labelId), pubRef('PMID:1')] } });
    const rs = makeTestResultSet({ [withLabel.id]: withLabel, [plain.id]: plain }, { n1: makeTestNode('n1'), n2: makeTestNode('n2') });
    rs.data.publications = {
      [labelId]: { infores: ['infores:test'], type: 'other', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=0a1b2c3d-0000-4000-8000-000000000001' },
      'PMID:1': { infores: ['infores:test'], type: 'PMID', url: 'https://pubmed.ncbi.nlm.nih.gov/1' },
    } as unknown as typeof rs.data.publications;

    const { result } = renderHook(() => usePredicateEdgeMeta(rs, withLabel));
    expect(result.current.hasDrugLabels).toBe(true);
    expect(result.current.tooltipEdgeEntries[0]).toMatchObject({ drugLabelCount: 1, pubCount: 1 });

    const { result: none } = renderHook(() => usePredicateEdgeMeta(rs, plain));
    expect(none.current.hasDrugLabels).toBe(false);
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
