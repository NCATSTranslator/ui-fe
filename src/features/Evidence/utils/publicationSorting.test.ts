import { describe, it, expect } from 'vitest';
import { sortPublications } from '@/features/Evidence/utils/publicationSorting';
import { PUBLICATION_SORT_OPTIONS, PublicationSortOption } from '@/features/Evidence/utils/evidenceSortOptions';
import type { PublicationObject } from '@/features/Evidence/types/evidence';

const makePub = (id: string, overrides: Partial<PublicationObject> = {}): PublicationObject => ({
  id, support: null, type: 'PMID', url: '', ...overrides,
});

// "0" is the year given to publications whose year could not be found
const PUBS = [
  makePub('b', { title: 'Beta', journal: 'Nature', pubdate: '2019' }),
  makePub('unknown', { title: '', journal: '', pubdate: '0' }),
  makePub('a', { title: 'Alpha', journal: 'Science', pubdate: '2023' }),
  makePub('c', { title: 'Gamma', journal: 'Cell', pubdate: '2001' }),
];

const sortedIds = (preference: PublicationSortOption) =>
  sortPublications(PUBS, preference).map(pub => pub.id);

describe('sortPublications', () => {
  it.each<[PublicationSortOption, string[]]>([
    ['dateHighLow', ['a', 'b', 'c', 'unknown']],
    ['dateLowHigh', ['c', 'b', 'a', 'unknown']],
    ['titleLowHigh', ['a', 'b', 'c', 'unknown']],
    ['titleHighLow', ['c', 'b', 'a', 'unknown']],
    ['sourceLowHigh', ['c', 'b', 'a', 'unknown']],
    ['sourceHighLow', ['a', 'b', 'c', 'unknown']],
  ])('orders by %s, with publications missing that detail last', (preference, expected) => {
    expect(sortedIds(preference)).toEqual(expected);
  });

  it('puts every publication in some order for each order offered', () => {
    for (const option of PUBLICATION_SORT_OPTIONS) {
      expect(sortedIds(option).slice().sort()).toEqual(['a', 'b', 'c', 'unknown']);
    }
  });

  it('returns a new array and leaves the original order alone', () => {
    const before = PUBS.map(pub => pub.id);
    expect(sortPublications(PUBS, 'titleLowHigh')).not.toBe(PUBS);
    expect(PUBS.map(pub => pub.id)).toEqual(before);
  });
});
