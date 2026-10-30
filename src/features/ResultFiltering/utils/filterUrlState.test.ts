import { describe, it, expect } from 'vitest';
import { encodeFilterUrlState, decodeFilterUrlState } from '@/features/ResultFiltering/utils/filterUrlState';
import { WORKING_VIEW_VERSION } from '@/features/ResultFiltering/utils/workingViewApi';
import { decodeBase64Url } from '@/features/Core/utils/web';

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

  it('carries the same versioned envelope as the working view API', () => {
    const encoded = encodeFilterUrlState([{ id: 'g/str', name: '', value: 'aspirin' }]);
    expect(JSON.parse(decodeBase64Url(encoded ?? ''))).toEqual({
      version: WORKING_VIEW_VERSION,
      state: { filters: [{ id: 'g/str', name: '', value: 'aspirin', negated: false }] },
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
    const b64 = (value: unknown) => window.btoa(JSON.stringify(value));
    expect(decodeFilterUrlState(null)).toBeNull();
    expect(decodeFilterUrlState('')).toBeNull();
    expect(decodeFilterUrlState('not base64!')).toBeNull();
    expect(decodeFilterUrlState(b64('a string'))).toBeNull();
    expect(decodeFilterUrlState(b64({ version: 1, filters: [] }))).toBeNull();
    expect(decodeFilterUrlState(b64({ version: 2, state: { filters: [] } }))).toBeNull();
    expect(decodeFilterUrlState(b64({ version: 1, state: { filters: [{ id: 1 }] } }))).toBeNull();
  });
});
