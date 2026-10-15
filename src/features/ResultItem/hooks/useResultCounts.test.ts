import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useResultCounts } from '@/features/ResultItem/hooks/useResultCounts';
import { makeTestEdge, makeTestNode, makeTestPath, makeTestResultSet } from '@/features/ResultList/utils/resultTestFixtures';
import { Result, ResultSet } from '@/features/ResultList/types/results';
import { PublicationObject } from '@/features/Evidence/types/evidence';

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
    const evidenceCount = { publicationCount: 7, clinicalTrialCount: 2, miscCount: 0, sourceCount: 3 };
    const { result } = renderHook(() => useResultCounts(makeSet(), makeResult({ evidenceCount, pathCount: 42 })));
    expect(result.current.evidenceCounts).toBe(evidenceCount);
    expect(result.current.pathCount).toBe(42);
  });

  it('computes counts from the result set when none are precalculated', () => {
    const { result } = renderHook(() => useResultCounts(makeSet(), makeResult()));
    expect(result.current.evidenceCounts?.publicationCount).toBe(1);
    expect(result.current.pathCount).toBe(2);
  });

  it('returns empty counts without a result', () => {
    const { result } = renderHook(() => useResultCounts(makeSet(), undefined));
    expect(result.current).toEqual({ evidenceCounts: null, pathCount: 0 });
  });

  it('returns zero paths without a result set to resolve them against', () => {
    const { result } = renderHook(() => useResultCounts(null, makeResult()));
    expect(result.current.pathCount).toBe(0);
  });
});
