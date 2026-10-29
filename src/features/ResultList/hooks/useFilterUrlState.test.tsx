import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useFilterUrlState, useFilterUrlSync } from '@/features/ResultList/hooks/useFilterUrlState';
import { encodeFilterUrlState } from '@/features/ResultFiltering/utils/filterUrlState';
import { getDecodedParamsFromSearch } from '@/features/Core/utils/web';
import { Filter } from '@/features/ResultFiltering/types/filters';

const approved: Filter = { id: 'r/pc/approved', name: 'Approved', value: 'Approved', negated: false };
const aspirin: Filter = { id: 'g/str', name: '', value: 'aspirin', negated: false };

const withRouter = (initialUrl: string) => ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={[initialUrl]}>{children}</MemoryRouter>
);

interface SyncProps {
  activeFilters: Filter[];
  enabled: boolean;
}

const renderSync = (initialUrl: string, initialProps: SyncProps) => renderHook(
  (props: SyncProps) => {
    useFilterUrlSync(props);
    return new URLSearchParams(useLocation().search);
  },
  { wrapper: withRouter(initialUrl), initialProps },
);

describe('useFilterUrlState', () => {
  it('reads the filters encoded in the URL', () => {
    const encoded = encodeFilterUrlState([approved]);
    const { result } = renderHook(() => useFilterUrlState(getDecodedParamsFromSearch(`?q=pk-1&f=${encoded}`)));
    expect(result.current).toEqual({
      filters: [{ id: 'r/pc/approved', name: 'Approved', value: 'Approved', negated: false }],
    });
  });

  it('is null without a usable parameter', () => {
    expect(renderHook(() => useFilterUrlState('q=pk-1')).result.current).toBeNull();
    expect(renderHook(() => useFilterUrlState('q=pk-1&f=garbage')).result.current).toBeNull();
  });
});

describe('useFilterUrlSync', () => {
  it('leaves the URL alone until enabled', () => {
    const { result, rerender } = renderSync('/results?q=pk-1', { activeFilters: [approved], enabled: false });
    expect(result.current.get('f')).toBeNull();

    act(() => { rerender({ activeFilters: [approved], enabled: true }); });
    expect(result.current.get('f')).toBe(encodeFilterUrlState([approved]));
    expect(result.current.get('q')).toBe('pk-1');
  });

  it('follows filter changes and drops the parameter when they are cleared', () => {
    const { result, rerender } = renderSync('/results?q=pk-1', { activeFilters: [], enabled: true });
    expect(result.current.get('f')).toBeNull();

    act(() => { rerender({ activeFilters: [approved, aspirin], enabled: true }); });
    expect(result.current.get('f')).toBe(encodeFilterUrlState([approved, aspirin]));

    act(() => { rerender({ activeFilters: [], enabled: true }); });
    expect(result.current.get('f')).toBeNull();
    expect(result.current.get('q')).toBe('pk-1');
  });

  it('removes a stale parameter from a pasted link once the filters are known to be empty', () => {
    const encoded = encodeFilterUrlState([approved]);
    const { result } = renderSync(`/results?q=pk-1&f=${encoded}`, { activeFilters: [], enabled: true });
    expect(result.current.get('f')).toBeNull();
  });
});
