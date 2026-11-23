import { describe, it, expect } from 'vitest';
import {
  EvidenceSectionCounts,
  getEvidenceLayout,
  getEvidenceSectionCounts,
  getSectionHeading,
  getSectionKey,
  parseEvidenceSectionName,
} from '@/features/Evidence/utils/evidenceSections';
import { EdgeEvidence } from '@/features/Evidence/utils/utilities';

const NO_COUNTS: EvidenceSectionCounts = {
  publications: 0, clinicalTrials: 0, drugLabels: 0, acceptedOntologies: 0, misc: 0, sources: 0,
};

const LINK = { id: 'a', url: 'https://example.org/a' };
const EVIDENCE: EdgeEvidence = {
  publications: [],
  clinicalTrials: [],
  drugLabels: [LINK, { id: 'b', url: 'https://example.org/b' }],
  miscEvidence: [LINK],
  sources: [],
};

describe('parseEvidenceSectionName', () => {
  it('accepts every section name', () => {
    for (const name of ['Publications', 'Clinical Trials', 'Drug Labels', 'Accepted Ontology', 'Miscellaneous', 'Databases'])
      expect(parseEvidenceSectionName(name)).toBe(name);
  });

  it('maps the name older links use for databases', () => {
    expect(parseEvidenceSectionName('Knowledge Sources')).toBe('Databases');
  });

  it('rejects anything else', () => {
    expect(parseEvidenceSectionName('Nonsense')).toBeUndefined();
    expect(parseEvidenceSectionName('constructor')).toBeUndefined();
    expect(parseEvidenceSectionName('')).toBeUndefined();
    expect(parseEvidenceSectionName(null)).toBeUndefined();
  });
});

describe('getSectionKey', () => {
  it('returns the evidence type behind a section', () => {
    expect(getSectionKey('Databases')).toBe('sources');
    expect(getSectionKey('Accepted Ontology')).toBe('acceptedOntologies');
  });
});

describe('getEvidenceSectionCounts', () => {
  it('counts the items in each list', () => {
    expect(getEvidenceSectionCounts(EVIDENCE, false)).toEqual({ ...NO_COUNTS, drugLabels: 2, misc: 1 });
  });

  it('counts accepted ontology once when the edge is one', () => {
    expect(getEvidenceSectionCounts(EVIDENCE, true).acceptedOntologies).toBe(1);
  });
});

describe('getEvidenceLayout', () => {
  it('puts publications, trials, labels, and ontology on the left and the rest on the right, in order', () => {
    const all: EvidenceSectionCounts = {
      publications: 1, clinicalTrials: 1, drugLabels: 1, acceptedOntologies: 1, misc: 1, sources: 1,
    };
    expect(getEvidenceLayout(all)).toEqual({
      primary: ['publications', 'clinicalTrials', 'drugLabels', 'acceptedOntologies'],
      secondary: ['misc', 'sources'],
    });
  });

  it('leaves out sections with nothing in them', () => {
    expect(getEvidenceLayout({ ...NO_COUNTS, clinicalTrials: 3, sources: 2 })).toEqual({
      primary: ['clinicalTrials'],
      secondary: ['sources'],
    });
  });

  it('has an empty left column when there is only miscellaneous evidence and databases', () => {
    expect(getEvidenceLayout({ ...NO_COUNTS, misc: 1, sources: 2 })).toEqual({
      primary: [],
      secondary: ['misc', 'sources'],
    });
  });

  it('has an empty right column when there are no miscellaneous evidence or databases', () => {
    expect(getEvidenceLayout({ ...NO_COUNTS, publications: 4 }).secondary).toEqual([]);
  });

  it('has no sections without evidence', () => {
    expect(getEvidenceLayout(NO_COUNTS)).toEqual({ primary: [], secondary: [] });
  });
});

describe('getSectionHeading', () => {
  it.each([
    ['publications', 1, '1 Publication'],
    ['publications', 1200, '1,200 Publications'],
    ['drugLabels', 300, '300 Drug Labels'],
    ['misc', 3, '3 Miscellaneous'],
    ['sources', 1, '1 Database'],
    ['sources', 6, '6 Databases'],
  ] as const)('labels %s with a count of %i as "%s"', (key, count, heading) => {
    expect(getSectionHeading(key, count)).toBe(heading);
  });

  it('gives accepted ontology no count', () => {
    expect(getSectionHeading('acceptedOntologies', 1)).toBe('Accepted Ontology');
  });
});
