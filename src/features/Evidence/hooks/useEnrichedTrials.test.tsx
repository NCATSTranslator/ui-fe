import { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { TrialObject } from '@/features/Evidence/types/evidence.d';
import useEnrichedTrials from '@/features/Evidence/hooks/useEnrichedTrials';

const makeTrial = (id: string, overrides: Partial<TrialObject> = {}): TrialObject => ({
  child: false, id, phase: 0, size: 0, start_date: '', status: 'UNKNOWN', url: '', ...overrides,
});

const COMPLETE = makeTrial('NCT2', {
  title: 'Already complete', phase: 2, size: 40, start_date: '2019-01-01', status: 'COMPLETED',
});

const protocolFor = (title: string) => ({
  protocolSection: {
    identificationModule: { briefTitle: title },
    statusModule: { startDateStruct: { date: '2021-05-01' }, overallStatus: 'RECRUITING' },
    designModule: { phases: ['PHASE3'], enrollmentInfo: { count: 250, type: 'ACTUAL' } },
  },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('useEnrichedTrials', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('fills in the trials missing details, in the order given, and reports them pending until then', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => protocolFor('Fetched title') }));
    vi.stubGlobal('fetch', fetchMock);
    const trials = [makeTrial('NCT1'), COMPLETE];

    const { result } = renderHook(() => useEnrichedTrials(trials), { wrapper });
    expect(result.current.isLoading).toBe(true);
    expect([...result.current.metadata.pendingIds]).toEqual(['NCT1']);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.metadata.pendingIds.size).toBe(0);
    expect(result.current.trials.map((trial) => trial.id)).toEqual(['NCT1', 'NCT2']);
    expect(result.current.trials[0]).toMatchObject({
      title: 'Fetched title', start_date: '2021-05-01', phase: 3, size: 250, status: 'RECRUITING',
    });
    expect(result.current.trials[1]).toBe(COMPLETE);
  });

  it('keeps the same lists between renders when nothing has changed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => protocolFor('Fetched title') })));
    const trials = [makeTrial('NCT1'), COMPLETE];

    const { result, rerender } = renderHook(() => useEnrichedTrials(trials), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const before = result.current;
    rerender();
    expect(result.current.trials).toBe(before.trials);
    expect(result.current.metadata).toBe(before.metadata);
  });
});
