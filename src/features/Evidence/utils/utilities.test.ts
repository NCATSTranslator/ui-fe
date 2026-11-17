import { describe, it, expect } from 'vitest';
import { makeTestEdge } from '@/features/ResultList/utils/resultTestFixtures';
import {
  buildEdgeEvidence,
  getPublicationDisplaySnippet,
  groupSourcesByName,
  hasEdgeEvidence,
} from '@/features/Evidence/utils/utilities';
import { PublicationObject } from '@/features/Evidence/types/evidence';

const RAW_EMPTY = { publications: [], clinicalTrials: [], miscEvidence: [], sources: [] };
const EMPTY_SUPPORT = { object: [0, 1] as [number, number], subject: [2, 3] as [number, number], text: '' };
const SUPPORT = { ...EMPTY_SUPPORT, text: 'edge support text' };

describe('buildEdgeEvidence / hasEdgeEvidence', () => {
  it('has no evidence when every type is empty', () => {
    expect(hasEdgeEvidence(buildEdgeEvidence(RAW_EMPTY))).toBe(false);
  });

  it('deduplicates miscellaneous links by URL', () => {
    const evidence = buildEdgeEvidence({
      ...RAW_EMPTY,
      miscEvidence: [
        { id: 'misc1', support: null, type: 'other', url: 'https://misc.example/1' },
        { id: 'misc2', support: null, type: 'other', url: 'https://misc.example/1' },
      ],
    });
    expect(evidence.miscEvidence).toEqual([{ id: 'misc1', url: 'https://misc.example/1' }]);
    expect(hasEdgeEvidence(evidence)).toBe(true);
  });

  it('does not count miscellaneous items without URLs', () => {
    expect(hasEdgeEvidence(buildEdgeEvidence({
      ...RAW_EMPTY,
      miscEvidence: [{ id: 'misc', support: null, type: 'other', url: '' }],
    }))).toBe(false);
  });

  it('does not count sources without names', () => {
    expect(hasEdgeEvidence(buildEdgeEvidence({
      ...RAW_EMPTY,
      sources: [{ infores: 'infores:x', knowledge_level: 'trusted', name: null, url: 'https://x.example', wiki: null }],
    }))).toBe(false);
  });
});

describe('groupSourcesByName', () => {
  it('drops unnamed sources', () => {
    expect(groupSourcesByName([
      { infores: 'infores:x', knowledge_level: 'trusted', name: null, url: 'https://x.example', wiki: null },
      { infores: 'infores:y', knowledge_level: 'ml', name: '  ', url: 'https://y.example', wiki: null },
    ])).toEqual([]);
  });

  it('merges by name and keeps distinct knowledge levels', () => {
    const grouped = groupSourcesByName([
      { infores: 'infores:a', knowledge_level: 'trusted', name: 'Source A', url: 'https://a.example', wiki: 'https://wiki.example/a' },
      { infores: 'infores:a2', knowledge_level: 'ml', name: 'Source A', url: 'https://a2.example', wiki: null },
      { infores: 'infores:a', knowledge_level: 'trusted', name: 'Source A', url: 'https://a.example', wiki: null },
    ]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]).toEqual({
      name: 'Source A',
      wiki: 'https://wiki.example/a',
      urls: ['https://a.example', 'https://a2.example'],
      infores: ['infores:a', 'infores:a2'],
      knowledgeLevels: ['trusted', 'ml'],
    });
  });
});

describe('getPublicationDisplaySnippet', () => {
  const pub: PublicationObject = {
    id: 'PMID:1',
    snippet: 'generic snippet',
    support: null,
    type: 'PMID',
    url: 'https://pubmed.example/1',
  };

  it('falls back to the publication snippet when support is null', () => {
    const edge = makeTestEdge('e1', { publications: { PMID: [{ id: 'PMID:1', infores: 'infores:a', support: null }] } });
    expect(getPublicationDisplaySnippet(pub, edge)).toBe('generic snippet');
  });

  it('falls back to the publication snippet when support text is empty or blank', () => {
    const emptyEdge = makeTestEdge('e1', { publications: { PMID: [{ id: 'PMID:1', infores: 'infores:a', support: EMPTY_SUPPORT }] } });
    const blankEdge = makeTestEdge('e2', { publications: { PMID: [{ id: 'PMID:1', infores: 'infores:a', support: { ...EMPTY_SUPPORT, text: '   ' } }] } });
    expect(getPublicationDisplaySnippet(pub, emptyEdge)).toBe('generic snippet');
    expect(getPublicationDisplaySnippet(pub, blankEdge)).toBe('generic snippet');
  });

  it('uses the edge support text when it has content', () => {
    const edge = makeTestEdge('e1', { publications: { PMID: [{ id: 'PMID:1', infores: 'infores:a', support: SUPPORT }] } });
    expect(getPublicationDisplaySnippet(pub, edge)).toBe('edge support text');
  });

  it('returns an empty string when there is neither support text nor a snippet', () => {
    const edge = makeTestEdge('e1', { publications: { PMID: [{ id: 'PMID:1', infores: 'infores:a', support: EMPTY_SUPPORT }] } });
    expect(getPublicationDisplaySnippet({ ...pub, snippet: undefined }, edge)).toBe('');
  });
});
