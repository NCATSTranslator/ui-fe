import { describe, it, expect } from 'vitest';
import { compareEdgeValue, getCompressedEdge, getCompressedEdges, getDistinctPredicateEdgeIDs } from '@/features/Core/utils/resultHelpers';
import { makeTestEdge, makeTestResultSet } from '@/features/ResultList/utils/resultTestFixtures';

describe('getDistinctPredicateEdgeIDs', () => {
  it('returns the same list when there is fewer than two edge IDs', () => {
    const rs = makeTestResultSet({ e1: makeTestEdge('e1') });
    expect(getDistinctPredicateEdgeIDs(rs, [])).toEqual([]);
    expect(getDistinctPredicateEdgeIDs(rs, ['e1'])).toEqual(['e1']);
  });

  it('keeps one representative per distinct predicate', () => {
    const rs = makeTestResultSet({
      e1: makeTestEdge('e1', { predicate: 'biolink:related_to' }),
      e2: makeTestEdge('e2', { predicate: 'biolink:interacts_with' }),
      e3: makeTestEdge('e3', { predicate: 'biolink:affects' }),
    });

    expect(getDistinctPredicateEdgeIDs(rs, ['e1', 'e2', 'e3'])).toEqual(['e1', 'e2', 'e3']);
  });

  it('collapses same-predicate edges into a single representative', () => {
    const rs = makeTestResultSet({
      e1: makeTestEdge('e1', { predicate: 'biolink:related_to' }),
      e2: makeTestEdge('e2', { predicate: 'biolink:related_to' }),
      e3: makeTestEdge('e3', { predicate: 'biolink:interacts_with' }),
    });

    expect(getDistinctPredicateEdgeIDs(rs, ['e1', 'e2', 'e3'])).toEqual(['e1', 'e3']);
  });

  it('keeps treats and impacts as distinct raw predicates', () => {
    const rs = makeTestResultSet({
      e1: makeTestEdge('e1', { predicate: 'biolink:treats' }),
      e2: makeTestEdge('e2', { predicate: 'biolink:impacts' }),
    });

    expect(getDistinctPredicateEdgeIDs(rs, ['e1', 'e2'])).toEqual(['e1', 'e2']);
  });
});

const pubRef = (id: string) => ({ id, support: null, infores: 'infores:test' });
const pubs = (...ids: string[]) => ({ 'infores:test': ids.map(pubRef) });
const source = (infores: string) => ({ infores, records: [] });

describe('compareEdgeValue', () => {
  const sorted = (...edges: ReturnType<typeof makeTestEdge>[]) => [...edges].sort(compareEdgeValue).map(e => e.id);

  it('ranks by combined publication and trial count first', () => {
    const trusted = makeTestEdge('trusted', { knowledge_level: 'trusted' });
    const onePub = makeTestEdge('one-pub', { knowledge_level: 'ml', publications: pubs('PMID:1') });
    const pubAndTrial = makeTestEdge('pub-and-trial', { knowledge_level: 'ml', publications: pubs('PMID:1'), trials: ['NCT1'] });
    expect(sorted(trusted, onePub, pubAndTrial)).toEqual(['pub-and-trial', 'one-pub', 'trusted']);
  });

  it('counts a publication once when several sources report it', () => {
    const duplicated = makeTestEdge('duplicated', { publications: { a: [pubRef('PMID:1')], b: [pubRef('PMID:1')] } });
    const twoPubs = makeTestEdge('two-pubs', { publications: pubs('PMID:1', 'PMID:2') });
    expect(sorted(duplicated, twoPubs)).toEqual(['two-pubs', 'duplicated']);
  });

  it('breaks evidence ties by knowledge level: trusted, then unlabelled, then ml', () => {
    const ml = makeTestEdge('ml', { knowledge_level: 'ml' });
    const unknown = makeTestEdge('unknown', { knowledge_level: 'unknown' });
    const trusted = makeTestEdge('trusted', { knowledge_level: 'trusted' });
    expect(sorted(ml, unknown, trusted)).toEqual(['trusted', 'unknown', 'ml']);
  });

  it('then ranks by distinct sources, ARAs, and predicate specificity', () => {
    const base = { knowledge_level: 'trusted' as const };
    const specific = makeTestEdge('specific', { ...base, predicate_rank: 3 });
    const generic = makeTestEdge('generic', { ...base, predicate_rank: 0 });
    const unranked = makeTestEdge('unranked', base);
    const twoAras = makeTestEdge('two-aras', { ...base, aras: ['a', 'b'] });
    const twoSources = makeTestEdge('two-sources', { ...base, provenance: [source('infores:a'), source('infores:b')] });
    expect(sorted(unranked, generic, specific, twoAras, twoSources))
      .toEqual(['two-sources', 'two-aras', 'specific', 'generic', 'unranked']);
  });

  it('falls back to predicate then ID so the order is deterministic', () => {
    const b = makeTestEdge('b', { predicate: 'affects' });
    const a = makeTestEdge('a', { predicate: 'affects' });
    const z = makeTestEdge('z', { predicate: 'aaa' });
    expect(sorted(b, a, z)).toEqual(['z', 'a', 'b']);
  });
});

describe('getCompressedEdge', () => {
  const rs = makeTestResultSet({
    plain: makeTestEdge('plain', { predicate: 'related to' }),
    affects1: makeTestEdge('affects1', { predicate: 'affects', publications: pubs('PMID:1'), aras: ['ara-a'] }),
    affects2: makeTestEdge('affects2', { predicate: 'affects', publications: pubs('PMID:2'), trials: ['NCT1'], aras: ['ara-b'] }),
    causes: makeTestEdge('causes', { predicate: 'causes', publications: pubs('PMID:3', 'PMID:4') }),
  });

  it('puts the most valuable predicate on top regardless of input order', () => {
    const edge = getCompressedEdge(rs, ['plain', 'causes', 'affects1', 'affects2']);
    expect(edge.predicate).toBe('affects');
    expect(edge.compressed_edges?.map(e => e.predicate)).toEqual(['causes', 'related to']);
  });

  it('pools evidence and sources across edges sharing a predicate before ranking', () => {
    const edge = getCompressedEdge(rs, ['affects1', 'affects2', 'causes']);
    expect(edge.id).toBe('affects1');
    expect(edge.publications['infores:test'].map(p => p.id)).toEqual(['PMID:1', 'PMID:2']);
    expect(edge.trials).toEqual(['NCT1']);
    expect(edge.aras).toEqual(['ara-a', 'ara-b']);
  });

  it('keeps a pinned edge on top and uses its ID for its predicate group', () => {
    const edge = getCompressedEdge(rs, ['affects1', 'affects2', 'causes', 'plain'], 'plain');
    expect(edge.id).toBe('plain');
    expect(edge.compressed_edges?.map(e => e.predicate)).toEqual(['affects', 'causes']);

    expect(getCompressedEdge(rs, ['affects1', 'affects2', 'causes'], 'affects2').id).toBe('affects2');
  });

  it('does not modify the edges in the result set', () => {
    getCompressedEdge(rs, ['affects1', 'affects2', 'causes']);
    expect(rs.data.edges.affects1.trials).toEqual([]);
    expect(Object.values(rs.data.edges.affects1.publications).flat()).toHaveLength(1);
  });

  it('returns an empty edge when no IDs resolve', () => {
    expect(getCompressedEdge(rs, ['missing']).id).toBe('');
  });
});

describe('getCompressedEdges', () => {
  it('returns one merged edge per predicate, most valuable first, without reordering its input', () => {
    const edges = [
      makeTestEdge('plain', { predicate: 'related to' }),
      makeTestEdge('affects1', { predicate: 'affects', publications: pubs('PMID:1') }),
      makeTestEdge('affects2', { predicate: 'affects', publications: pubs('PMID:2') }),
    ];
    expect(getCompressedEdges(edges).map(e => e.id)).toEqual(['affects1', 'plain']);
    expect(edges.map(e => e.id)).toEqual(['plain', 'affects1', 'affects2']);
  });
});
