import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useStateSyncedTo } from './useStateSyncedTo';
import { getDefaultLookupObjectCategory } from '@/features/Query/utils/biolinkCategories';

describe('useStateSyncedTo', () => {
  it('resets state when the source value changes', () => {
    const { result, rerender } = renderHook(
      ({ source }) => useStateSyncedTo(source),
      { initialProps: { source: 'alpha' } },
    );

    act(() => {
      result.current[1]('beta');
    });
    expect(result.current[0]).toBe('beta');

    rerender({ source: 'gamma' });
    expect(result.current[0]).toBe('gamma');
  });

  it('resets state when resetKey changes even if source value is unchanged', () => {
    const { result, rerender } = renderHook(
      ({ resetKey }) => useStateSyncedTo(getDefaultLookupObjectCategory('biolink:Gene'), resetKey),
      { initialProps: { resetKey: 'gene-a' } },
    );

    act(() => {
      result.current[1]('biolink:Disease');
    });
    expect(result.current[0]).toBe('biolink:Disease');

    rerender({ resetKey: 'gene-b' });
    expect(result.current[0]).toBe('biolink:ChemicalEntity');
  });
});
