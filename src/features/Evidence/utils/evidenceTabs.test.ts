import { describe, it, expect } from 'vitest';
import {
  EvidenceCounts,
  NO_EVIDENCE_TAB,
  getEvidenceCounts,
  getFirstTabHeading,
  getTabCount,
  getTabHeading,
  tabHasData,
} from '@/features/Evidence/utils/evidenceTabs';
import type { EdgeEvidence } from '@/features/Evidence/utils/utilities';

const NONE: EvidenceCounts = { pubs: 0, cts: 0, misc: 0, sources: 0 };
const counts = (overrides: Partial<EvidenceCounts> = {}): EvidenceCounts => ({ ...NONE, ...overrides });

describe('getEvidenceCounts', () => {
  it('counts the items in each evidence list', () => {
    const evidence = {
      publications: [{}, {}, {}],
      clinicalTrials: [{}, {}],
      miscEvidence: [{}],
      sources: [{}, {}, {}, {}],
    } as unknown as EdgeEvidence;
    expect(getEvidenceCounts(evidence)).toEqual({ pubs: 3, cts: 2, misc: 1, sources: 4 });
  });

  it('counts empty evidence as zero everywhere', () => {
    const evidence: EdgeEvidence = { publications: [], clinicalTrials: [], miscEvidence: [], sources: [] };
    expect(getEvidenceCounts(evidence)).toEqual(NONE);
  });
});

describe('getTabCount', () => {
  const all = counts({ pubs: 1, cts: 2, misc: 3, sources: 4 });

  it.each([
    ['Publications', 1],
    ['Clinical Trials', 2],
    ['Miscellaneous', 3],
    ['Knowledge Sources', 4],
  ] as const)('returns the %s count', (tab, expected) => {
    expect(getTabCount(tab, all)).toBe(expected);
  });

  it('returns zero for the no-evidence placeholder', () => {
    expect(getTabCount(NO_EVIDENCE_TAB, all)).toBe(0);
  });
});

describe('tabHasData', () => {
  it('is true only for tabs with at least one item', () => {
    const some = counts({ cts: 2 });
    expect(tabHasData('Clinical Trials', some)).toBe(true);
    expect(tabHasData('Publications', some)).toBe(false);
    expect(tabHasData('Knowledge Sources', some)).toBe(false);
  });
});

describe('getTabHeading', () => {
  it.each([
    ['Publications', { pubs: 1 }, '1 Publication'],
    ['Publications', { pubs: 7 }, '7 Publications'],
    ['Clinical Trials', { cts: 1 }, '1 Clinical Trial'],
    ['Clinical Trials', { cts: 2 }, '2 Clinical Trials'],
    ['Knowledge Sources', { sources: 1 }, '1 Knowledge Source'],
    ['Knowledge Sources', { sources: 5 }, '5 Knowledge Sources'],
    ['Publications', {}, '0 Publications'],
  ] as const)('labels %s with %j as "%s"', (tab, overrides, expected) => {
    expect(getTabHeading(tab, counts(overrides))).toBe(expected);
  });

  it('leaves Miscellaneous unchanged for one item or many', () => {
    expect(getTabHeading('Miscellaneous', counts({ misc: 1 }))).toBe('1 Miscellaneous');
    expect(getTabHeading('Miscellaneous', counts({ misc: 3 }))).toBe('3 Miscellaneous');
  });

  it('formats large counts with the locale grouping', () => {
    expect(getTabHeading('Publications', counts({ pubs: 1234 }))).toBe(`${(1234).toLocaleString()} Publications`);
  });
});

describe('getFirstTabHeading', () => {
  it.each([
    [{ pubs: 1, cts: 1, misc: 1, sources: 1 }, 'Publications'],
    [{ cts: 1, misc: 1, sources: 1 }, 'Clinical Trials'],
    [{ misc: 1, sources: 1 }, 'Miscellaneous'],
    [{ sources: 1 }, 'Knowledge Sources'],
  ] as const)('picks the first tab with data for %j', (overrides, expected) => {
    expect(getFirstTabHeading(counts(overrides))).toBe(expected);
  });

  it('returns the placeholder tab, not Knowledge Sources, when nothing has data', () => {
    expect(getFirstTabHeading(NONE)).toBe(NO_EVIDENCE_TAB);
  });
});
