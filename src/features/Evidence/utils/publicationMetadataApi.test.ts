import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildPublicationMetadataUrl,
  fetchPublicationMetadata,
  isSupportedPublicationId,
  toPublicationCurie,
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

  it('sends ids unencoded so colons reach the endpoint literally', () => {
    expect(buildPublicationMetadataUrl(ENDPOINT, ['PMID:1', 'PMC:PMC2']))
      .toBe(`${ENDPOINT}?pubids=PMID:1,PMC:PMC2`);
  });

  it('sends PMC ids in the PMC:PMC form the endpoint requires', () => {
    expect(buildPublicationMetadataUrl(ENDPOINT, ['PMID:8928190', 'PMC2490599']))
      .toBe(`${ENDPOINT}?pubids=PMID:8928190,PMC:PMC2490599`);
  });
});

describe('toPublicationCurie', () => {
  it.each([
    ['PMC2490599', 'PMC:PMC2490599'],
    ['PMC:2490599', 'PMC:PMC2490599'],
    ['PMC:PMC2490599', 'PMC:PMC2490599'],
    ['pmc2490599', 'PMC:PMC2490599'],
    ['PMID:8928190', 'PMID:8928190'],
    [' PMID:8928190 ', 'PMID:8928190'],
    ['doi:10.1242/jcs.03153', 'doi:10.1242/jcs.03153'],
  ])('converts %s to %s', (id, expected) => {
    expect(toPublicationCurie(id)).toBe(expected);
  });
});

describe('isSupportedPublicationId', () => {
  it.each([
    'PMID:8928190', 'pmid:8928190', 'PMC2490599', 'PMC:PMC2490599', 'doi:10.1242/jcs.03153', 'DOI:10.1242/jcs.03153',
  ])('accepts %s', (id) => {
    expect(isSupportedPublicationId(id)).toBe(true);
  });

  it.each([
    '', 'PMID:', 'PMID:abc', '8928190', 'NCT00000102', 'clinicaltrials:NCT00000102', 'PMC:', 'doi:',
    'doi:10.1000/a&b', 'doi:10.1000/a,b', 'doi:10.1000/a#b', 'https://example.com/paper',
  ])('rejects %j', (id) => {
    expect(isSupportedPublicationId(id)).toBe(false);
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

  it('keys PMC metadata by the id that was requested, not the normalized CURIE', async () => {
    fetchMock.mockResolvedValue(jsonResponse({
      results: { 'PMID:1': METADATA, 'PMC:PMC2490599': METADATA },
    }));

    const result = await fetchPublicationMetadata(ENDPOINT, ['PMID:1', 'PMC2490599']);

    expect(fetchMock.mock.calls[0][0]).toBe(`${ENDPOINT}?pubids=PMID:1,PMC:PMC2490599`);
    expect(result).toEqual({
      success: true,
      data: { 'PMID:1': METADATA, PMC2490599: METADATA },
      processedCount: 2,
    });
  });

  it('leaves unsupported ids out of the request so they cannot fail the batch', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ results: { 'PMID:1': METADATA } }));

    const result = await fetchPublicationMetadata(ENDPOINT, ['clinicaltrials:NCT00000102', 'PMID:1', 'PMID:abc']);

    expect(fetchMock.mock.calls[0][0]).toBe(`${ENDPOINT}?pubids=PMID:1`);
    expect(result).toEqual({ success: true, data: { 'PMID:1': METADATA }, processedCount: 1 });
  });

  it('makes no request when no id is supported', async () => {
    expect(await fetchPublicationMetadata(ENDPOINT, ['clinicaltrials:NCT00000102', '']))
      .toEqual({ success: true, data: {}, processedCount: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
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
