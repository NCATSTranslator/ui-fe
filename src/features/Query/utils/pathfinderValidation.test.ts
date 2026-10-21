import { describe, it, expect } from 'vitest';
import { validatePathfinderTerms } from '@/features/Query/utils/pathfinderValidation';
import { AutocompleteItem } from '@/features/Query/types/querySubmission';

const item = (id: string): AutocompleteItem => ({ id, label: id } as AutocompleteItem);

describe('validatePathfinderTerms', () => {
  it('accepts two selected terms', () => {
    expect(validatePathfinderTerms(item('a'), item('b'))).toEqual({ ok: true, itemOne: item('a'), itemTwo: item('b') });
  });
  it('asks for both terms when neither is selected', () => {
    expect(validatePathfinderTerms(null, null)).toMatchObject({ ok: false, error: expect.stringContaining('two search terms') });
  });
  it('flags a missing or empty first term before the second', () => {
    expect(validatePathfinderTerms(null, item('b'))).toMatchObject({ ok: false, error: expect.stringContaining('First') });
    expect(validatePathfinderTerms(item(''), null)).toMatchObject({ ok: false, error: expect.stringContaining('First') });
  });
  it('flags a missing or empty second term', () => {
    expect(validatePathfinderTerms(item('a'), null)).toMatchObject({ ok: false, error: expect.stringContaining('Second') });
    expect(validatePathfinderTerms(item('a'), item(''))).toMatchObject({ ok: false, error: expect.stringContaining('Second') });
  });
});
