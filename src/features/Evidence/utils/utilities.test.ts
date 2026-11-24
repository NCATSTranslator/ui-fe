import { describe, it, expect } from 'vitest';
import { makeTestEdge, makeTestPath, makeTestResult, makeTestResultSet } from '@/features/ResultList/utils/resultTestFixtures';
import { isDrugLabelUrl, resolveEvidenceUrl } from '@/features/Evidence/types/checkers';
import {
  buildEdgeEvidence,
  getEvidenceCounts,
  getEvidenceCountsFromCanvasEdge,
  getTrialSources,
  getPublicationDisplaySnippet,
  groupSourcesByName,
  hasEdgeEvidence,
} from '@/features/Evidence/utils/utilities';
import { PublicationObject } from '@/features/Evidence/types/evidence';

const RAW_EMPTY = { publications: [], clinicalTrials: [], drugLabels: [], miscEvidence: [], sources: [] };
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

  it('counts drug labels as evidence and deduplicates them by URL', () => {
    const url = 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=abc';
    const evidence = buildEdgeEvidence({
      ...RAW_EMPTY,
      drugLabels: [
        { id: 'label1', support: null, type: 'other', url },
        { id: 'label2', support: null, type: 'other', url },
      ],
    });
    expect(evidence.drugLabels).toEqual([{ id: 'label1', url }]);
    expect(evidence.miscEvidence).toEqual([]);
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

describe('isDrugLabelUrl', () => {
  it('recognizes DailyMed links', () => {
    expect(isDrugLabelUrl('https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=abc')).toBe(true);
    expect(isDrugLabelUrl('https://DailyMed.NLM.NIH.gov/dailymed/lookup.cfm?setid=abc')).toBe(true);
  });

  it('rejects other links, including ones that only mention DailyMed', () => {
    expect(isDrugLabelUrl('https://www.ebi.ac.uk/chembl/explore/document/CHEMBL1')).toBe(false);
    expect(isDrugLabelUrl('https://example.org/?ref=dailymed.nlm.nih.gov')).toBe(false);
    expect(isDrugLabelUrl('https://dailymed.nlm.nih.gov.example.org/label')).toBe(false);
  });

  it('rejects missing or malformed links', () => {
    expect(isDrugLabelUrl('')).toBe(false);
    expect(isDrugLabelUrl(undefined)).toBe(false);
    expect(isDrugLabelUrl('not a url')).toBe(false);
  });
});

describe('resolveEvidenceUrl', () => {
  const SET_ID = 'e1ada3ec-c2c0-4f43-9b4b-1234567890ab';
  const LABEL_URL = `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${SET_ID}`;
  const BROKEN_URL = 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=dailymed';

  it('builds a drug label link from the set id in the evidence id', () => {
    expect(resolveEvidenceUrl(`dailymed:${SET_ID}`, BROKEN_URL)).toBe(LABEL_URL);
    expect(resolveEvidenceUrl(`DAILYMED:dailymed:${SET_ID.toUpperCase()}`, BROKEN_URL)).toBe(LABEL_URL);
    // No result set to supply a link, so the link arrives as the id itself
    expect(resolveEvidenceUrl(`dailymed:${SET_ID}`, `dailymed:${SET_ID}`)).toBe(LABEL_URL);
  });

  it('keeps the arriving link when the id has no set id', () => {
    expect(resolveEvidenceUrl('dailymed:unknown', BROKEN_URL)).toBe(BROKEN_URL);
    expect(resolveEvidenceUrl(undefined, LABEL_URL)).toBe(LABEL_URL);
  });

  it('leaves other evidence alone, even when its id holds a UUID', () => {
    const url = 'https://example.org/article';
    expect(resolveEvidenceUrl(`DOC:${SET_ID}`, url)).toBe(url);
    expect(resolveEvidenceUrl('PMID:1', 'https://www.ncbi.nlm.nih.gov/pubmed/1')).toBe('https://www.ncbi.nlm.nih.gov/pubmed/1');
  });
});

describe('getEvidenceCounts', () => {
  it('counts DailyMed links as drug labels rather than miscellaneous evidence', () => {
    const edge = makeTestEdge('e1', {
      publications: {
        trusted: [
          { id: 'PMID:1', infores: 'infores:a', support: null },
          { id: 'label1', infores: 'infores:a', support: null },
          { id: 'label2', infores: 'infores:a', support: null },
          { id: 'misc1', infores: 'infores:a', support: null },
        ],
      },
    });
    const resultSet = makeTestResultSet({ e1: edge });
    resultSet.data.paths = { p1: makeTestPath() };
    resultSet.data.publications = {
      'PMID:1': { support: null, type: 'PMID', url: 'https://pubmed.example/1', infores: ['infores:a'] },
      label1: { support: null, type: 'other', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=1' },
      label2: { support: null, type: 'other', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=2' },
      misc1: { support: null, type: 'other', url: 'https://misc.example/1' },
    };

    const counts = getEvidenceCounts(resultSet, makeTestResult('r1', { paths: ['p1'] }));
    expect(counts.publicationCount).toBe(1);
    expect(counts.drugLabelCount).toBe(2);
    expect(counts.miscCount).toBe(1);
  });
});

describe('getTrialSources', () => {
  const OWN = { infores: 'infores:multiomics-clinicaltrials', records: [] };
  const OTHER = { infores: 'infores:other', records: [] };
  const CATALOG = {
    'infores:multiomics-clinicaltrials': { knowledge_level: 'trusted' as const, name: 'Trials KP', url: 'https://trials.example', wiki: null },
    'infores:other': { knowledge_level: 'trusted' as const, name: 'Other KP', url: 'https://other.example', wiki: null },
  };

  it('returns nothing for an edge without trials', () => {
    const edge = makeTestEdge('e1', { provenance: [OWN] });
    expect(getTrialSources(null, edge, CATALOG)).toEqual([]);
  });

  it("uses the edge's own sources, leaving out those merged in from compressed edges", () => {
    const stored = makeTestEdge('e1', { provenance: [OWN], trials: ['NCT1'] });
    const resultSet = makeTestResultSet({ e1: stored });
    resultSet.data.provenance = CATALOG;
    const compressed = { ...stored, provenance: [OWN, OTHER] };

    expect(getTrialSources(resultSet, compressed).map(source => source.name)).toEqual(['Trials KP']);
  });

  it('lists nothing when the clinical trials source is not one of the edge sources', () => {
    const edge = makeTestEdge('e1', { provenance: [OTHER], trials: ['NCT1'] });
    expect(getTrialSources(null, edge, CATALOG)).toEqual([]);
  });

  it('lists only the clinical trials source when the edge has others too', () => {
    const edge = makeTestEdge('e1', { provenance: [OTHER, OWN], trials: ['NCT1'] });
    expect(getTrialSources(null, edge, CATALOG).map(source => source.name)).toEqual(['Trials KP']);
  });

  it('falls back to the given edge and catalog without a result set', () => {
    const edge = makeTestEdge('e1', { provenance: [OWN], trials: ['NCT1'] });
    expect(getTrialSources(null, edge, CATALOG)).toEqual([
      { infores: 'infores:multiomics-clinicaltrials', knowledge_level: 'trusted', name: 'Trials KP', url: 'https://trials.example', wiki: null },
    ]);
  });
});

describe('getEvidenceCountsFromCanvasEdge', () => {
  const ref = (id: string) => ({ id, support: null, infores: 'infores:test' });
  const setId = '0a1b2c3d-0000-4000-8000-000000000001';

  it('counts publications, drug labels, and trials apart, leaving other links out', () => {
    const counts = getEvidenceCountsFromCanvasEdge({
      publications: {
        a: [ref('PMID:1'), ref('PMC:2'), ref(`dailymed:${setId}`), ref('https://example.com/other')],
        b: [ref('PMID:1'), ref(`DailyMed:${setId.toUpperCase()}`)],
        c: [ref(`https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${setId}`)],
        d: [ref('https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=0a1b2c3d-0000-4000-8000-000000000002')],
      },
      trials: ['NCT1', 'NCT1', 'NCT2'],
    });
    expect(counts).toEqual({ pubCount: 2, ctCount: 2, drugLabelCount: 2 });
  });

  it('returns zeroes for an edge with no evidence', () => {
    expect(getEvidenceCountsFromCanvasEdge({})).toEqual({ pubCount: 0, ctCount: 0, drugLabelCount: 0 });
  });
});
