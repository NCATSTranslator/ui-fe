import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildPublicationMetadataUrl,
  fetchPublicationMetadata,
} from '@/features/Evidence/utils/publicationMetadataApi';

const ENDPOINT = 'https://annotator.ci.transltr.io/publications';

const METADATA = {
  abstract: 'An abstract.',
  article_title: 'A title.',
  issue: '1',
  journal_abbrev: 'BMC Neurosci',
  journal_name: 'BMC neuroscience',
  pub_day: '28',
  pub_month: 'Dec',
  pub_year: '2019',
  volume: '20',
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('buildPublicationMetadataUrl', () => {
  it('requests every id in one comma separated pubids parameter', () => {
    const url = new URL(buildPublicationMetadataUrl(ENDPOINT, ['PMID:1', 'PMC:PMC2']));
    expect(`${url.origin}${url.pathname}`).toBe(ENDPOINT);
    expect(url.searchParams.get('pubids')).toBe('PMID:1,PMC:PMC2');
    expect([...url.searchParams.keys()]).toEqual(['pubids']);
  });

  it('encodes ids so reserved characters cannot corrupt the batch', () => {
    const ids = ['DOI:10.1000/a&b#c+d', 'PMID:1'];
    const url = buildPublicationMetadataUrl(ENDPOINT, ids);
    expect(new URL(url).searchParams.get('pubids')).toBe(ids.join(','));
    expect([...new URL(url).searchParams.keys()]).toEqual(['pubids']);
    expect(new URL(url).hash).toBe('');
  });
});

describe('fetchPublicationMetadata', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('calls the given endpoint and returns the metadata keyed by id', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ _meta: { n_results: 1 }, results: { 'PMID:1': METADATA } }));
    const signal = new AbortController().signal;

    const result = await fetchPublicationMetadata(ENDPOINT, ['PMID:1'], signal);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(buildPublicationMetadataUrl(ENDPOINT, ['PMID:1']));
    expect(init.signal).toBe(signal);
    expect(result).toEqual({ success: true, data: { 'PMID:1': METADATA }, processedCount: 1 });
  });

  it('omits ids the service did not find', async () => {
    fetchMock.mockResolvedValue(jsonResponse({
      _meta: { n_results: 1 },
      results: { 'PMID:1': METADATA },
      not_found: ['PMID:999999999999'],
    }));

    const result = await fetchPublicationMetadata(ENDPOINT, ['PMID:1', 'PMID:999999999999']);

    expect(result.success).toBe(true);
    expect(result.processedCount).toBe(1);
    expect(result.data).not.toHaveProperty('PMID:999999999999');
  });

  it('succeeds with an empty map when nothing is found', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ _meta: { n_results: 0 }, results: {}, not_found: ['PMID:9'] }));
    expect(await fetchPublicationMetadata(ENDPOINT, ['PMID:9']))
      .toEqual({ success: true, data: {}, processedCount: 0 });
  });

  it.each([
    ['a missing results key', { _meta: {} }],
    ['null results', { results: null }],
    ['array results', { results: [METADATA] }],
    ['a null body', null],
    ['a non-object body', 'nope'],
  ])('treats %s as no metadata', async (_label, body) => {
    fetchMock.mockResolvedValue(jsonResponse(body));
    expect(await fetchPublicationMetadata(ENDPOINT, ['PMID:1']))
      .toEqual({ success: true, data: {}, processedCount: 0 });
  });

  it.each([404, 500, 503])('reports an HTTP %i response as a failure', async (status) => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'nope' }, status));
    const result = await fetchPublicationMetadata(ENDPOINT, ['PMID:1']);
    expect(result).toEqual({ success: false, error: `HTTP error! status: ${status}`, processedCount: 0 });
  });

  it('reports a network error as a failure instead of throwing', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await fetchPublicationMetadata(ENDPOINT, ['PMID:1']))
      .toEqual({ success: false, error: 'Failed to fetch', processedCount: 0 });
  });

  it('reports a body that is not JSON as a failure', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 200 }));
    const result = await fetchPublicationMetadata(ENDPOINT, ['PMID:1']);
    expect(result.success).toBe(false);
    expect(result.processedCount).toBe(0);
  });

  it('reports an aborted request as aborted', async () => {
    fetchMock.mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));
    expect(await fetchPublicationMetadata(ENDPOINT, ['PMID:1']))
      .toEqual({ success: false, error: 'aborted', processedCount: 0 });
  });

  it('reports a non-Error rejection with a generic message', async () => {
    fetchMock.mockRejectedValue('boom');
    expect(await fetchPublicationMetadata(ENDPOINT, ['PMID:1']))
      .toEqual({ success: false, error: 'Unknown error', processedCount: 0 });
  });
});
