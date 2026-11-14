import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  toWorkingViewState,
  filtersFromWorkingView,
  getWorkingView,
  setWorkingView,
  isWorkingView,
  parseVersionedWorkingViewState,
  WorkingView,
} from '@/features/ResultFiltering/utils/workingViewApi';
import { Filters } from '@/features/ResultFiltering/types/filters';

type FetchCall = [string, { method?: string; body?: unknown }];

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const makeView = (state: unknown, version = 1): WorkingView => ({
  user_id: 'user-1',
  pk: 'pk-1',
  version,
  state,
  time_updated: '2026-10-28T00:00:00.000Z',
});

const available: Filters = {
  'r/pc/approved': { name: 'Approved', count: 3, includeWeight: 1, excludeWeight: 2 },
};

describe('toWorkingViewState', () => {
  it('keeps the identifying fields of each filter and fills in defaults', () => {
    expect(toWorkingViewState([
      { id: 'r/pc/approved', name: 'Approved', value: 'Approved', negated: true, count: 3 },
      { id: 'g/str', name: '', value: 'aspirin' },
    ])).toEqual({
      filters: [
        { id: 'r/pc/approved', name: 'Approved', value: 'Approved', negated: true },
        { id: 'g/str', name: '', value: 'aspirin', negated: false },
      ],
    });
  });

  it('drops filters without an id', () => {
    expect(toWorkingViewState([{ name: 'orphan', value: 'x' }])).toEqual({ filters: [] });
  });
});

describe('filtersFromWorkingView', () => {
  it('rehydrates a facet from the available filters the way a facet click does', () => {
    const view = makeView({ filters: [{ id: 'r/pc/approved', name: 'Approved', value: 'Approved', negated: false }] });
    expect(filtersFromWorkingView(view, available)).toEqual([
      { id: 'r/pc/approved', name: 'Approved', count: 3, includeWeight: 1, excludeWeight: 2, value: 'Approved', negated: false },
    ]);
  });

  it('rebuilds an entity search with its weights', () => {
    const view = makeView({ filters: [{ id: 'g/str', name: '', value: 'aspirin', negated: true }] });
    const [filter] = filtersFromWorkingView(view, available) ?? [];
    expect(filter).toMatchObject({ id: 'g/str', value: 'aspirin', negated: true });
    expect(filter.includeWeight).toBeGreaterThan(0);
    expect(filter.excludeWeight).toBeGreaterThan(0);
  });

  it('skips a filter the current results do not offer and logs it', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const view = makeView({ filters: [
      { id: 'r/di/old', name: 'Old Facet', value: 'Old Facet', negated: false },
      { id: 'r/pc/approved', name: 'Approved', value: 'Approved', negated: true },
    ] });
    expect(filtersFromWorkingView(view, available)).toEqual([
      { id: 'r/pc/approved', name: 'Approved', count: 3, includeWeight: 1, excludeWeight: 2, value: 'Approved', negated: true },
    ]);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toContain('r/di/old');
    consoleError.mockRestore();
  });

  it('returns null for another version or a malformed state', () => {
    expect(filtersFromWorkingView(makeView({ filters: [] }, 2), available)).toBeNull();
    expect(filtersFromWorkingView(makeView({ filters: [{ id: 1 }] }), available)).toBeNull();
    expect(filtersFromWorkingView(makeView('not a state'), available)).toBeNull();
  });
});

describe('isWorkingView', () => {
  it('accepts the server shape and rejects partial objects', () => {
    expect(isWorkingView(makeView({ filters: [] }))).toBe(true);
    expect(isWorkingView({ pk: 'pk-1', version: 1 })).toBe(false);
    expect(isWorkingView(null)).toBe(false);
  });
});

describe('working view requests', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reads the working view of a query', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(makeView({ filters: [] })));
    vi.stubGlobal('fetch', fetchMock);
    const view = await getWorkingView('pk-1');
    expect(view?.pk).toBe('pk-1');
    const [url, options] = fetchMock.mock.calls[0] as unknown as FetchCall;
    expect(url).toBe('/api/v1/users/me/queries/pk-1/working-view');
    expect(options.method).toBe('GET');
  });

  it('treats a missing working view as null without logging an error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'Not Found', message: 'none', status: 404 }, 404)));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await getWorkingView('pk-1')).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('rejects other failures after logging them', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({}, 500)));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(getWorkingView('pk-1')).rejects.toThrow();
    expect(consoleError).toHaveBeenCalled();
  });

  it('writes the versioned state with a PUT', async () => {
    const state = { filters: [{ id: 'g/str', name: '', value: 'aspirin', negated: false }] };
    const fetchMock = vi.fn(async () => jsonResponse(makeView(state)));
    vi.stubGlobal('fetch', fetchMock);
    await setWorkingView('pk-1', state);
    const [url, options] = fetchMock.mock.calls[0] as unknown as FetchCall;
    expect(url).toBe('/api/v1/users/me/queries/pk-1/working-view');
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body as string)).toEqual({ version: 1, state });
  });
});

describe('parseVersionedWorkingViewState', () => {
  it('unwraps a current, well-formed envelope and nothing else', () => {
    const state = { filters: [{ id: 'g/str', name: '', value: 'aspirin', negated: false }] };
    expect(parseVersionedWorkingViewState({ version: 1, state })).toEqual(state);
    expect(parseVersionedWorkingViewState(makeView(state))).toEqual(state);
    expect(parseVersionedWorkingViewState({ version: 2, state })).toBeNull();
    expect(parseVersionedWorkingViewState({ version: 1, state: { filters: [{ id: 1 }] } })).toBeNull();
    expect(parseVersionedWorkingViewState({ version: 1 })).toBeNull();
    expect(parseVersionedWorkingViewState('not an envelope')).toBeNull();
  });
});
