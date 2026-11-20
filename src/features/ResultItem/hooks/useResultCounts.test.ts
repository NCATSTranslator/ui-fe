import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useResultCounts } from '@/features/ResultItem/hooks/useResultCounts';
import { makeTestEdge, makeTestNode, makeTestPath, makeTestResultSet } from '@/features/ResultList/utils/resultTestFixtures';
import { Result, ResultSet } from '@/features/ResultList/types/results';
import { PublicationObject } from '@/features/Evidence/types/evidence';
import { EMPTY_EVIDENCE_COUNTS } from '@/features/Evidence/utils/utilities';

const pubRef = (id: string) => ({ id, support: { object: [0, 0] as [number, number], subject: [0, 0] as [number, number], text: '' }, infores: 'infores:test' });

const makeSet = (): ResultSet => {
  const set = makeTestResultSet(
    {
      e1: makeTestEdge('e1', { publications: { 'infores:test': [pubRef('PMID:1')] } }),
      e2: makeTestEdge('e2', { subject: 'n2', object: 'n3' }),
    },
    { n1: makeTestNode('n1'), n2: makeTestNode('n2'), n3: makeTestNode('n3') },
  );
  set.data.paths = {
    p1: makeTestPath({ id: 'p1', subgraph: ['n1', 'e1', 'n2'] }),
    p2: makeTestPath({ id: 'p2', subgraph: ['n2', 'e2', 'n3'] }),
  };
  // Evidence counts resolve publication refs against the set and key them by url
  set.data.publications = { 'PMID:1': { id: 'PMID:1', type: 'PMID', url: 'https://pubmed.test/1' } as PublicationObject };
  return set;
};
const makeResult = (overrides: Partial<Result> = {}): Result => ({
  id: 'r1', drug_name: 'Drug', subject: 'n1', object: 'n3', paths: ['p1', 'p2'], scores: [], tags: {}, ...overrides,
} as unknown as Result);

describe('useResultCounts', () => {
  it('prefers counts precalculated on the result', () => {
    const evidenceCount = { ...EMPTY_EVIDENCE_COUNTS, publicationCount: 7, clinicalTrialCount: 2, sourceCount: 3 };
    const { result } = renderHook(() => useResultCounts(makeSet(), makeResult({ evidenceCount, pathCount: 42 })));
    expect(result.current.evidenceCounts).toBe(evidenceCount);
    expect(result.current.pathCount).toBe(42);
  });

  it('computes counts from the result set when none are precalculated', () => {
    const { result } = renderHook(() => useResultCounts(makeSet(), makeResult()));
    expect(result.current.evidenceCounts?.publicationCount).toBe(1);
    expect(result.current.pathCount).toBe(2);
  });

  it('counts an accepted ontology edge once per displayed path it appears in', () => {
    const set = makeSet();
    set.data.edges.e2.predicate = 'subclass of';
    // p3 shares p2's node sequence, so the two display as one path and count once
    set.data.paths.p3 = makeTestPath({ id: 'p3', subgraph: ['n2', 'e2', 'n3'] });
    const { result } = renderHook(() => useResultCounts(set, makeResult({ paths: ['p1', 'p2', 'p3'] })));
    expect(result.current.evidenceCounts?.acceptedOntologyCount).toBe(1);
    expect(result.current.evidenceCounts?.productLabelCount).toBe(0);

    // p4 has its own node sequence, so its e2 counts again; with e1 also an
    // ontology edge, p1 counts one and p4 counts two
    set.data.paths.p4 = makeTestPath({ id: 'p4', subgraph: ['n1', 'e1', 'n2', 'e2', 'n3'] });
    const { result: shared } = renderHook(() => useResultCounts(set, makeResult({ paths: ['p1', 'p2', 'p3', 'p4'] })));
    expect(shared.current.evidenceCounts?.acceptedOntologyCount).toBe(2);
    set.data.edges.e1.predicate = 'superclass of';
    const { result: multiple } = renderHook(() => useResultCounts(set, makeResult({ paths: ['p1', 'p2', 'p3', 'p4'] })));
    expect(multiple.current.evidenceCounts?.acceptedOntologyCount).toBe(4);
  });

  it('counts an accepted ontology edge compressed behind another edge, whichever path comes first', () => {
    const set = makeSet();
    set.data.edges.e3 = makeTestEdge('e3', { subject: 'n2', object: 'n3', predicate: 'subclass of' });
    set.data.edges.e4 = makeTestEdge('e4', { subject: 'n2', object: 'n3', predicate: 'superclass of' });
    set.data.paths.p3 = makeTestPath({ id: 'p3', subgraph: ['n2', 'e3', 'n3'] });
    set.data.paths.p4 = makeTestPath({ id: 'p4', subgraph: ['n2', 'e4', 'n3'] });
    const { result } = renderHook(() => useResultCounts(set, makeResult({ paths: ['p1', 'p2', 'p3'] })));
    expect(result.current.evidenceCounts?.acceptedOntologyCount).toBe(1);
    const { result: leading } = renderHook(() => useResultCounts(set, makeResult({ paths: ['p1', 'p3', 'p2'] })));
    expect(leading.current.evidenceCounts?.acceptedOntologyCount).toBe(1);
    // Two ontology edges merged into the same displayed predicate still count once
    const { result: merged } = renderHook(() => useResultCounts(set, makeResult({ paths: ['p1', 'p2', 'p3', 'p4'] })));
    expect(merged.current.evidenceCounts?.acceptedOntologyCount).toBe(1);
  });

  it('returns the largest evidence total of any result in the set', () => {
    const set = makeSet();
    set.data.results = [
      makeResult({ id: 'r1', evidenceCount: { ...EMPTY_EVIDENCE_COUNTS, publicationCount: 4, sourceCount: 2 } }),
      makeResult({ id: 'r2', evidenceCount: { ...EMPTY_EVIDENCE_COUNTS, clinicalTrialCount: 9, acceptedOntologyCount: 3 } }),
    ];
    const { result } = renderHook(() => useResultCounts(set, set.data.results[0]));
    expect(result.current.maxEvidenceTotal).toBe(12);
  });

  it('returns empty counts without a result', () => {
    const { result } = renderHook(() => useResultCounts(makeSet(), undefined));
    expect(result.current).toEqual({ evidenceCounts: null, pathCount: 0, maxEvidenceTotal: 0 });
  });

  it('returns zero paths without a result set to resolve them against', () => {
    const { result } = renderHook(() => useResultCounts(null, makeResult()));
    expect(result.current.pathCount).toBe(0);
  });
});
