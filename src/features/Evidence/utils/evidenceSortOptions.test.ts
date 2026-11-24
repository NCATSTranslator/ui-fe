import { describe, expect, it } from 'vitest';
import { defaultPrefs } from '@/features/UserAuth/utils/userDefaults';
import {
  PUBLICATION_SORT_OPTIONS,
  TRIAL_SORT_OPTIONS,
  resolveEvidenceSort,
} from '@/features/Evidence/utils/evidenceSortOptions';

describe('evidence sort options', () => {
  it('offers every evidence_sort preference value for publications', () => {
    expect([...PUBLICATION_SORT_OPTIONS].sort()).toEqual([...defaultPrefs.evidence_sort.possible_values].sort());
  });

  it('keeps a preference the section offers', () => {
    expect(resolveEvidenceSort('titleLowHigh', TRIAL_SORT_OPTIONS)).toBe('titleLowHigh');
    expect(resolveEvidenceSort('sourceHighLow', PUBLICATION_SORT_OPTIONS)).toBe('sourceHighLow');
  });

  it('falls back to newest first for a preference the section does not offer', () => {
    expect(resolveEvidenceSort('sourceHighLow', TRIAL_SORT_OPTIONS)).toBe('dateHighLow');
    expect(resolveEvidenceSort(undefined, PUBLICATION_SORT_OPTIONS)).toBe('dateHighLow');
    expect(resolveEvidenceSort('bogus', PUBLICATION_SORT_OPTIONS)).toBe('dateHighLow');
  });

  it.each(['', 'notASort', 5, 'toString'])('falls back to newest first for the unknown value %s', (preference) => {
    expect(resolveEvidenceSort(preference, PUBLICATION_SORT_OPTIONS)).toBe('dateHighLow');
    expect(resolveEvidenceSort(preference, TRIAL_SORT_OPTIONS)).toBe('dateHighLow');
  });
});
