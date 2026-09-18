import { describe, it, expect } from 'vitest';
import { getEdgeInforesIds } from '@/features/Evidence/utils/inforesApi';
import { makeTestEdge } from '@/features/ResultList/utils/resultTestFixtures';

const SUPPORT = { object: [0, 1] as [number, number], subject: [2, 3] as [number, number], text: 'snippet' };

describe('getEdgeInforesIds', () => {
  it('returns nothing without an edge', () => {
    expect(getEdgeInforesIds(null)).toEqual([]);
  });

  it('collects distinct, sorted ids from provenance and publications', () => {
    const edge = makeTestEdge('e1', {
      provenance: [
        { infores: 'infores:text-mining-provider-targeted', records: [] },
        { infores: 'infores:semmeddb', records: [] },
      ],
      publications: {
        ml: [
          { id: 'PMID:1', support: SUPPORT, infores: 'infores:semmeddb' },
          { id: 'PMID:2', support: SUPPORT, infores: 'infores:aact' },
        ],
      },
    });

    expect(getEdgeInforesIds(edge)).toEqual([
      'infores:aact',
      'infores:semmeddb',
      'infores:text-mining-provider-targeted',
    ]);
  });
});
