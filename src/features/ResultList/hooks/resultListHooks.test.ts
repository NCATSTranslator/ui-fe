import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQueryChangeReset, QueryChangeResetConfig } from '@/features/ResultList/hooks/resultListHooks';

const makeResets = () => ({
  resetResultsData: vi.fn(),
  resetFilters: vi.fn(),
  resetPagination: vi.fn(),
  closeNotesModal: vi.fn(),
  resetShareState: vi.fn(),
  resetBookmarks: vi.fn(),
});

describe('useQueryChangeReset', () => {
  it('runs every reset once when the query ID changes, and not on rerenders with the same ID', () => {
    const resets = makeResets();
    const prevQueryID: QueryChangeResetConfig['prevQueryID'] = { current: null };
    const { rerender } = renderHook(
      ({ currentQueryID }) => useQueryChangeReset({ currentQueryID, prevQueryID, ...resets }),
      { initialProps: { currentQueryID: 'q1' } },
    );
    expect(prevQueryID.current).toBe('q1');
    Object.values(resets).forEach(fn => expect(fn).toHaveBeenCalledTimes(1));

    rerender({ currentQueryID: 'q1' });
    Object.values(resets).forEach(fn => expect(fn).toHaveBeenCalledTimes(1));

    rerender({ currentQueryID: 'q2' });
    expect(prevQueryID.current).toBe('q2');
    Object.values(resets).forEach(fn => expect(fn).toHaveBeenCalledTimes(2));
  });

  it('does nothing when the query ID matches the one already seen', () => {
    const resets = makeResets();
    renderHook(() => useQueryChangeReset({ currentQueryID: 'q1', prevQueryID: { current: 'q1' }, ...resets }));
    Object.values(resets).forEach(fn => expect(fn).not.toHaveBeenCalled());
  });
});
