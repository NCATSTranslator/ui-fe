import { describe, it, expect } from 'vitest';
import { encodeFilterUrlState, decodeFilterUrlState } from '@/features/ResultFiltering/utils/filterUrlState';

describe('filter URL state', () => {
  it('round-trips filters through a URL-safe string', () => {
    const encoded = encodeFilterUrlState([
      { id: 'r/pc/approved', name: 'Approved', value: 'Approved', negated: true, count: 3 },
      { id: 'g/str', name: '', value: 'aspirin' },
    ]);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeFilterUrlState(encoded)).toEqual({
      filters: [
        { id: 'r/pc/approved', name: 'Approved', value: 'Approved', negated: true },
        { id: 'g/str', name: '', value: 'aspirin', negated: false },
      ],
    });
  });

  it('keeps non-ASCII filter values intact', () => {
    const encoded = encodeFilterUrlState([{ id: 'g/str', name: '', value: 'β-blocker café' }]);
    expect(decodeFilterUrlState(encoded)?.filters[0].value).toBe('β-blocker café');
  });

  it('encodes no filters as nothing', () => {
    expect(encodeFilterUrlState([])).toBeNull();
    expect(encodeFilterUrlState([{ name: 'no id' }])).toBeNull();
  });

  it('rejects anything that is not a current filter state', () => {
    expect(decodeFilterUrlState(null)).toBeNull();
    expect(decodeFilterUrlState('')).toBeNull();
    expect(decodeFilterUrlState('not base64!')).toBeNull();
    expect(decodeFilterUrlState(window.btoa('"a string"'))).toBeNull();
    expect(decodeFilterUrlState(window.btoa(JSON.stringify({ version: 2, filters: [] })))).toBeNull();
    expect(decodeFilterUrlState(window.btoa(JSON.stringify({ version: 1, filters: [{ id: 1 }] })))).toBeNull();
  });
});
