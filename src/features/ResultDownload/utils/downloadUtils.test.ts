import { describe, it, expect } from 'vitest';
import { collectRelatedEntities } from '@/features/ResultDownload/utils/downloadUtils';
import { makeTestEdge, makeTestNode, makeTestPath, makeTestResultSet } from '@/features/ResultList/utils/resultTestFixtures';
import { Result, ResultSet } from '@/features/ResultList/types/results';
import { PublicationObject, TrialObject } from '@/features/Evidence/types/evidence';

const pubRef = (id: string) => ({ id, support: { object: [0, 0] as [number, number], subject: [0, 0] as [number, number], text: '' }, infores: 'infores:test' });
const makePub = (id: string): PublicationObject => ({ id, type: 'PMID' } as PublicationObject);
const makeTrial = (id: string): TrialObject => ({ id, child: false, phase: 2, size: 10, start_date: '', status: 'completed' } as TrialObject);
const makeResult = (paths: string[]): Result => ({
  id: 'r1', drug_name: 'Drug', subject: 'n1', object: 'n3', paths, scores: [], tags: {},
} as unknown as Result);

// n1 -e1-> n2 -e2-> n3; e1 has one real publication, one dangling reference, and one trial
const makeFixtureSet = (): ResultSet => {
  const set = makeTestResultSet(
    {
      e1: makeTestEdge('e1', { publications: { 'infores:test': [pubRef('PMID:1'), pubRef('PMID:missing')] }, trials: ['NCT1'] }),
      e2: makeTestEdge('e2', { subject: 'n2', object: 'n3' }),
    },
    { n1: makeTestNode('n1'), n2: makeTestNode('n2'), n3: makeTestNode('n3'), unrelated: makeTestNode('unrelated') },
  );
  set.data.paths = {
    p1: makeTestPath({ id: 'p1', subgraph: ['n1', 'e1', 'n2'] }),
    p2: makeTestPath({ id: 'p2', subgraph: ['n2', 'e2', 'n3'] }),
  };
  set.data.publications = { 'PMID:1': makePub('PMID:1'), 'PMID:unused': makePub('PMID:unused') };
  set.data.trials = { NCT1: makeTrial('NCT1'), NCT2: makeTrial('NCT2') };
  return set;
};

describe('collectRelatedEntities', () => {
  it('collects only the nodes, edges, and paths reachable from the given results', () => {
    const { nodes, edges, paths } = collectRelatedEntities([makeResult(['p1', 'p2'])], makeFixtureSet());
    expect(Object.keys(nodes).sort()).toEqual(['n1', 'n2', 'n3']);
    expect(Object.keys(edges).sort()).toEqual(['e1', 'e2']);
    expect(Object.keys(paths).sort()).toEqual(['p1', 'p2']);
  });

  it('collects the publications and trials referenced by collected edges, skipping dangling references', () => {
    const { publications, trials } = collectRelatedEntities([makeResult(['p1', 'p2'])], makeFixtureSet());
    expect(Object.keys(publications)).toEqual(['PMID:1']);
    expect(Object.keys(trials)).toEqual(['NCT1']);
  });

  it('leaves evidence out when the result does not reach the edge that cites it', () => {
    const { publications, trials, edges } = collectRelatedEntities([makeResult(['p2'])], makeFixtureSet());
    expect(Object.keys(edges)).toEqual(['e2']);
    expect(publications).toEqual({});
    expect(trials).toEqual({});
  });

  it('collects each path and edge once when results share them', () => {
    const { paths, edges, publications } = collectRelatedEntities(
      [makeResult(['p1']), { ...makeResult(['p1']), id: 'r2' }],
      makeFixtureSet(),
    );
    expect(Object.keys(paths)).toEqual(['p1']);
    expect(Object.keys(edges)).toEqual(['e1']);
    expect(Object.keys(publications)).toEqual(['PMID:1']);
  });
});
