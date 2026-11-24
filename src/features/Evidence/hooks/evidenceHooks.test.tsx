import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useCallback, useState } from 'react';
import userReducer from '@/features/UserAuth/slices/userSlice';
import { usePubmedDataFetch, usePublicationMetadataEndpoint } from '@/features/Evidence/hooks/evidenceHooks';
import { PUBLICATION_METADATA_FALLBACK_ENDPOINT } from '@/features/Evidence/utils/publicationMetadataApi';
import { generatePubmedURL } from '@/features/Evidence/utils/utilities';
import type { PublicationObject, PubmedMetadataMap } from '@/features/Evidence/types/evidence';
import type { Config, Preferences } from '@/features/UserAuth/types/user';

const CI_ENDPOINT = 'https://annotator.ci.transltr.io/publications';

const makeConfig = (overrides: Partial<Config> = {}): Config => ({
  cached_queries: [],
  gaID: '',
  include_hashed_parameters: false,
  include_lookup: false,
  include_pathfinder: false,
  include_projects: false,
  include_query_status_polling: false,
  include_summarization: false,
  name_resolver: { endpoint: '' },
  social_providers: {},
  show_novelty_boost: false,
  ...overrides,
});

const makeWrapper = (config: Config | null) => {
  const store = configureStore({
    reducer: { user: userReducer },
    preloadedState: { user: { currentUser: null, currentPrefs: {} as Preferences, currentConfig: config } },
  });
  const queryClient = new QueryClient();
  return ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
};

const makePublication = (id: string, overrides: Partial<PublicationObject> = {}): PublicationObject => ({
  id,
  support: null,
  type: 'PMID',
  url: '',
  ...overrides,
});

const useFetchHarness = (initial: PublicationObject[]) => {
  const [publications, setPublications] = useState(initial);
  const [isLoading, setIsLoading] = useState(true);
  usePubmedDataFetch({ publications, selectedEdgeId: 'e1', setPublications, setIsLoading });
  return { publications, isLoading };
};

const renderFetch = (initial: PublicationObject[], config: Config | null = makeConfig()) =>
  renderHook(() => useFetchHarness(initial), { wrapper: makeWrapper(config) });

const metadataResponse = (results: PubmedMetadataMap | undefined, extra: Record<string, unknown> = {}) =>
  new Response(JSON.stringify({ _meta: {}, results, ...extra }), { status: 200 });

const fetchMock = vi.fn();
const requestedUrls = () => fetchMock.mock.calls.map(([url]) => String(url));

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('usePublicationMetadataEndpoint', () => {
  it('uses the endpoint supplied by config', () => {
    const config = makeConfig({ publication_metadata: { endpoint: CI_ENDPOINT } });
    const { result } = renderHook(() => usePublicationMetadataEndpoint(), { wrapper: makeWrapper(config) });
    expect(result.current).toBe(CI_ENDPOINT);
  });

  it.each([
    ['config has not loaded', null],
    ['config has no publication_metadata entry', makeConfig()],
    ['the configured endpoint is empty', makeConfig({ publication_metadata: { endpoint: '' } })],
  ])('falls back to the production annotator when %s', (_label, config) => {
    const { result } = renderHook(() => usePublicationMetadataEndpoint(), { wrapper: makeWrapper(config) });
    expect(result.current).toBe(PUBLICATION_METADATA_FALLBACK_ENDPOINT);
  });
});

describe('usePubmedDataFetch', () => {
  it('requests metadata from the configured endpoint and merges it into the publications', async () => {
    fetchMock.mockImplementation(async () => metadataResponse({
      'PMID:1': { article_title: 'first [title]', journal_name: 'bmc neuroscience', abstract: 'Abstract one.', pub_year: '2019' },
      'PMID:2': { article_title: 'second title', journal_name: 'nature', abstract: 'Abstract two.', pub_year: '2021' },
    }));
    const config = makeConfig({ publication_metadata: { endpoint: CI_ENDPOINT } });

    const { result } = renderFetch([makePublication('PMID:1'), makePublication('PMID:2')], config);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const urls = requestedUrls();
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url.startsWith(`${CI_ENDPOINT}?`)).toBe(true);
      expect(new URL(url).searchParams.get('pubids')).toBe('PMID:1,PMID:2');
    }

    const byId = Object.fromEntries(result.current.publications.map(p => [p.id, p]));
    expect(byId['PMID:1']).toMatchObject({
      title: 'First Title',
      journal: 'Bmc Neuroscience',
      snippet: 'Abstract one.',
      pubdate: '2019',
      url: generatePubmedURL('PMID:1'),
    });
    expect(byId['PMID:2']).toMatchObject({ title: 'Second Title', pubdate: '2021' });
    // Ordering is the evidence view's job, so the hook leaves the list as it was given.
    expect(result.current.publications.map(p => p.id)).toEqual(['PMID:1', 'PMID:2']);
  });

  it('falls back to the production annotator when config supplies no endpoint', async () => {
    fetchMock.mockImplementation(async () => metadataResponse({}));

    const { result } = renderFetch([makePublication('PMID:1')], null);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(requestedUrls().every(url => url.startsWith(`${PUBLICATION_METADATA_FALLBACK_ENDPOINT}?`))).toBe(true);
    expect(requestedUrls().length).toBeGreaterThan(0);
  });

  it('keeps existing values and leaves publications the service did not return untouched', async () => {
    fetchMock.mockImplementation(async () => metadataResponse(
      { 'PMID:1': { article_title: 'service title', journal_name: 'service journal', abstract: 'Service abstract.', pub_year: '2019' } },
      { not_found: ['PMID:404'] },
    ));
    const known = makePublication('PMID:1', { title: 'Existing Title', url: 'https://example.org/1' });
    const unknown = makePublication('PMID:404');

    const { result } = renderFetch([known, unknown]);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const byId = Object.fromEntries(result.current.publications.map(p => [p.id, p]));
    expect(byId['PMID:1']).toMatchObject({
      title: 'Existing Title',
      url: 'https://example.org/1',
      journal: 'Service Journal',
      snippet: 'Service abstract.',
    });
    expect(byId['PMID:404']).toEqual(unknown);
  });

  it('tolerates metadata entries with missing or empty fields', async () => {
    fetchMock.mockImplementation(async () => metadataResponse({
      'PMID:1': {},
      'PMC:PMC2': { article_title: 'only a title', pub_year: '' },
    }));

    const { result } = renderFetch([makePublication('PMID:1'), makePublication('PMC:PMC2', { type: 'PMC' })]);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const byId = Object.fromEntries(result.current.publications.map(p => [p.id, p]));
    expect(byId['PMID:1']).toMatchObject({ title: '', journal: '', snippet: '', pubdate: '0' });
    expect(byId['PMC:PMC2']).toMatchObject({ title: 'Only A Title', journal: '', pubdate: '0' });
    expect(byId['PMC:PMC2'].url).toContain('PMC2');
  });

  it.each([
    ['nothing is found', async () => metadataResponse({}, { not_found: ['PMID:1'] })],
    ['the response has no results', async () => metadataResponse(undefined)],
    ['the service errors', async () => new Response('Internal Server Error', { status: 500 })],
    ['the network fails', async () => { throw new TypeError('Failed to fetch'); }],
  ])('stops loading and leaves publications unchanged when %s', async (_label, respond) => {
    fetchMock.mockImplementation(respond);
    const initial = [makePublication('PMID:1')];

    const { result } = renderFetch(initial);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchMock).toHaveBeenCalled();
    expect(result.current.publications).toEqual(initial);
  });

  it('keeps metadata from successful batches when another batch fails', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const ids = new URL(url).searchParams.get('pubids')?.split(',') ?? [];
      if (ids.includes('PMID:0')) return new Response('Bad gateway', { status: 502 });
      return metadataResponse(Object.fromEntries(ids.map(id => [id, { article_title: `title ${id}`, pub_year: '2020' }])));
    });
    // 100 ids per request, so 201 publications span three batches; the first batch fails.
    const initial = Array.from({ length: 201 }, (_, i) => makePublication(`PMID:${i}`));

    const { result } = renderFetch(initial);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const byId = Object.fromEntries(result.current.publications.map(p => [p.id, p]));
    expect(byId['PMID:0'].title).toBeUndefined();
    expect(byId['PMID:100'].title).toBe('Title PMID:100');
    expect(byId['PMID:200'].title).toBe('Title PMID:200');
  });

  it('never asks for more than the 100 ids the endpoint allows per request', async () => {
    fetchMock.mockImplementation(async () => metadataResponse({}));

    const { result } = renderFetch(Array.from({ length: 250 }, (_, i) => makePublication(`PMID:${i}`)));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const batchSizes = requestedUrls().map(url => new URL(url).searchParams.get('pubids')?.split(',').length);
    expect(batchSizes).toEqual([100, 100, 50]);
  });

  it('discards an aborted fetch instead of writing its publications over the next edge', async () => {
    let staleFetchAborted = false;
    fetchMock.mockImplementation(async (url: string, init?: { signal?: AbortSignal }) => {
      const ids = new URL(url).searchParams.get('pubids')?.split(',') ?? [];
      // Last batch of the first edge: hangs until the edge change aborts it.
      if (ids.includes('PMID:200')) {
        return new Promise<Response>((_resolve, reject) => {
          const abort = () => {
            staleFetchAborted = true;
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          };
          if (init?.signal?.aborted) abort();
          else init?.signal?.addEventListener('abort', abort);
        });
      }
      // The earlier batches of the first edge succeed, so the aborted run holds metadata it could apply.
      if (ids.includes('PMID:0')) {
        return metadataResponse(Object.fromEntries(ids.map(id => [id, { article_title: `title ${id}`, pub_year: '2020' }])));
      }
      return metadataResponse({});
    });
    const firstEdgePublications = Array.from({ length: 201 }, (_, i) => makePublication(`PMID:${i}`));
    const secondEdgePublications = [makePublication('PMID:900')];
    // Every list the hook writes back, so a stale write is caught even if a later one replaces it.
    const hookWrites: PublicationObject[][] = [];

    const { result, rerender } = renderHook(
      ({ edgeId }: { edgeId: string }) => {
        const [publications, setPublications] = useState(firstEdgePublications);
        const [isLoading, setIsLoading] = useState(true);
        const recordingSetPublications = useCallback<typeof setPublications>((next) => {
          if (Array.isArray(next)) hookWrites.push(next);
          setPublications(next);
        }, []);
        usePubmedDataFetch({
          publications, selectedEdgeId: edgeId,
          setPublications: recordingSetPublications, setIsLoading,
        });
        return { publications, isLoading, setPublications };
      },
      { wrapper: makeWrapper(makeConfig()), initialProps: { edgeId: 'e1' } },
    );

    await waitFor(() => expect(requestedUrls().some(url => url.includes('PMID:200'))).toBe(true));

    hookWrites.length = 0;
    act(() => {
      result.current.setPublications(secondEdgePublications);
      rerender({ edgeId: 'e2' });
    });

    await waitFor(() => expect(staleFetchAborted).toBe(true));
    await waitFor(() => expect(requestedUrls().some(url => url.includes('900'))).toBe(true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // Let the aborted run finish unwinding before checking it wrote nothing.
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });

    expect(result.current.publications).toEqual(secondEdgePublications);
    expect(hookWrites.filter(written => written.some(p => p.id === 'PMID:0'))).toEqual([]);
  });
});
