import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import userReducer from '@/features/UserAuth/slices/userSlice';
import { useQuerySubmission } from '@/features/Query/hooks/customQueryHooks';
import { queryTypes } from '@/features/Query/utils/queryTypes';
import { AutocompleteItem, QueryItem } from '@/features/Query/types/querySubmission';

const { navigate, errorToast, trackEvent } = vi.hoisted(() => ({
  navigate: vi.fn(),
  errorToast: vi.fn(),
  trackEvent: vi.fn(),
}));
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));
vi.mock('@/features/Core/utils/toastMessages', () => ({ errorToast, unsupportedSmartQueryCategoryToast: vi.fn() }));
vi.mock('@/features/Analytics/utils/dataLayer', () => ({ trackEvent }));

const disease: AutocompleteItem = { id: 'MONDO:0005148', label: 'Type 2 Diabetes', isExact: true, score: 1, types: ['biolink:Disease'] };
const drug: AutocompleteItem = { id: 'CHEBI:1', label: 'Aspirin', isExact: true, score: 1, types: ['biolink:Drug'] };
const singleItem: QueryItem = { type: queryTypes[0], node: disease };

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={configureStore({ reducer: { user: userReducer } })}>
    <MemoryRouter>{children}</MemoryRouter>
  </Provider>
);

describe('useQuerySubmission', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    navigate.mockReset();
    errorToast.mockReset();
    trackEvent.mockReset();
  });

  it('navigates to the results page when a single query is accepted', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ status: 'complete', data: 'PK1' })));
    const { result } = renderHook(() => useQuerySubmission('single'), { wrapper });

    await act(() => result.current.submitQuery!(singleItem));

    expect(navigate).toHaveBeenCalledWith(expect.stringContaining('PK1'));
    expect(errorToast).not.toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith('query_submitted', expect.objectContaining({ query_type: 'single' }));
  });

  it('clears the loading state and reports an error when the backend does not accept a single query', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ status: 'error' })));
    const { result } = renderHook(() => useQuerySubmission('single'), { wrapper });

    await act(() => result.current.submitQuery!(singleItem));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(navigate).not.toHaveBeenCalled();
    expect(errorToast).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('query_submission_failed', expect.objectContaining({ query_type: 'single' }));
    expect(trackEvent).not.toHaveBeenCalledWith('query_submitted', expect.anything());
  });

  it.each([
    ['pathfinder', (hook: ReturnType<typeof useQuerySubmission>) => hook.submitPathfinderQuery!(disease, drug)],
    ['lookup', (hook: ReturnType<typeof useQuerySubmission>) => hook.submitLookupQuery!(disease, 'biolink:Drug')],
  ] as const)('resolves rather than rejecting when a %s submission fails, after reporting the error', async (type, submit) => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down'); }));
    const { result } = renderHook(() => useQuerySubmission(type), { wrapper });

    await act(async () => {
      await expect(submit(result.current)).resolves.toBeUndefined();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(navigate).not.toHaveBeenCalled();
    expect(errorToast).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('query_submission_failed', expect.objectContaining({ query_type: type, error_message: 'network down' }));
  });
});
