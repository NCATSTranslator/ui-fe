import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';
import resultsReducer from '@/features/ResultList/slices/resultsSlice';
import seenStatusReducer from '@/features/ResultList/slices/seenStatusSlice';
import queryStatusReducer from '@/features/ResultList/slices/queryStatusSlice';
import userReducer from '@/features/UserAuth/slices/userSlice';
import canvasReducer from '@/features/Canvas/slices/canvasSlice';
import colorModeReducer from '@/features/Core/slices/colorModeSlice';
import { defaultPrefs } from '@/features/UserAuth/utils/userDefaults';
import { PageTitleProvider } from '@/features/Page/components/PageTitleProvider/PageTitleProvider';
import SidebarProvider from '@/features/Sidebar/components/SidebarProvider/SidebarProvider';
import { CanvasContextMenuProvider } from '@/features/Canvas/components/CanvasContextMenu/CanvasContextMenu';
import { useSidebar } from '@/features/Sidebar/hooks/sidebarHooks';
import ResultList from '@/features/ResultList/components/ResultList/ResultList';
import { ARAStatusResponse, ResultSet } from '@/features/ResultList/types/results';

/**
 * Integration harness for ResultList. Mounts it with the same provider stack
 * the app uses and serves result sets through a stubbed fetch, so the real
 * status → result → handleNewResults pipeline runs against fixture data.
 */

/**
 * The filters and status panels register into the sidebar rather than rendering
 * inside ResultList; this mounts whatever ResultList registered for each.
 */
const SidebarProbe = () => {
  const { getSidebarItem, getContextPanel } = useSidebar();
  const filters = getSidebarItem('filters');
  const status = getSidebarItem('queryStatus');
  return (
    <>
      {filters && <div data-testid="filters-probe">{getContextPanel(filters)}</div>}
      {status && <div data-testid="status-probe">{getContextPanel(status)}</div>}
    </>
  );
};

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
const errorResponse = () => new Response('{}', { status: 500, statusText: 'Server Error', headers: { 'content-type': 'application/json' } });

export const runningStatus = (aras: string[]): ARAStatusResponse => ({ status: 'running', data: { aras, status: 'running' } });
export const completeStatus = (aras: string[]): ARAStatusResponse => ({ status: 'complete', data: { aras, status: 'complete' } });

/** A scripted response that is held for `delayMs` before it resolves, to simulate a slow endpoint. */
export interface DelayedResponse<T> {
  response: T | 'error';
  delayMs: number;
}
type ScriptEntry<T> = T | 'error' | DelayedResponse<T>;
const isDelayed = <T,>(entry: ScriptEntry<T>): entry is DelayedResponse<T> =>
  typeof entry === 'object' && entry !== null && 'delayMs' in entry;

/** Responses for one query, in the order its endpoints are hit; the last entry repeats. */
export interface QueryFetchScript {
  status?: Array<ScriptEntry<ARAStatusResponse>>;
  result?: Array<ScriptEntry<ResultSet>>;
}

const urlOf = (input: Parameters<typeof fetch>[0]): string => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
};

/** Routes /query/:id/status and /query/:id/result to each query's script; everything else gets an empty object. */
export const stubResultsFetch = (scripts: Record<string, QueryFetchScript>) => {
  const calls: Record<string, number> = {};
  const fetchMock = vi.fn(async (input: Parameters<typeof fetch>[0]) => {
    const url = urlOf(input);
    const match = url.match(/\/query\/([^/?]+)\/(status|result)/);
    if (!match) return jsonResponse({});
    const [, qid, kind] = match;
    const key = `${qid}/${kind}`;
    const index = calls[key] ?? 0;
    calls[key] = index + 1;
    const sequence = scripts[qid]?.[kind as 'status' | 'result'];
    if (!sequence || sequence.length === 0)
      return kind === 'status' ? jsonResponse(completeStatus(['ara-test'])) : jsonResponse({ status: 'error', data: { results: [] } });
    const entry = sequence[Math.min(index, sequence.length - 1)];
    const body = isDelayed(entry) ? entry.response : entry;
    if (isDelayed(entry)) await new Promise(resolve => setTimeout(resolve, entry.delayMs));
    return body === 'error' ? errorResponse() : jsonResponse(body);
  });
  vi.stubGlobal('fetch', fetchMock);
  /** Number of fetches so far for one query's endpoint. */
  const countCalls = (qid: string, kind: 'status' | 'result') => calls[`${qid}/${kind}`] ?? 0;
  return { fetchMock, countCalls };
};

export const makeTestStore = () => configureStore({
  reducer: {
    resultSets: resultsReducer,
    seenStatus: seenStatusReducer,
    queryStatus: queryStatusReducer,
    user: userReducer,
    canvas: canvasReducer,
    colorMode: colorModeReducer,
  },
  // A null user (not undefined) disables the user-queries/projects/saves fetches
  preloadedState: { user: { currentUser: null, currentPrefs: defaultPrefs, currentConfig: null } },
});

interface RenderResultListOptions {
  /** Shorthand: each query completes on the first status check and serves this set. */
  resultSets?: Record<string, ResultSet>;
  /** Full control over the status/result responses per query; overrides resultSets for the same ID. */
  scripts?: Record<string, QueryFetchScript>;
  initialUrl?: string;
}

export const renderResultList = ({
  resultSets = {},
  scripts = {},
  initialUrl = '/results?q=Q1&t=0&l=Type%202%20Diabetes&i=MONDO:0005148',
}: RenderResultListOptions) => {
  // ClampedDescription and the status panel observe layout with APIs jsdom lacks
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } });
  const allScripts: Record<string, QueryFetchScript> = {
    ...Object.fromEntries(Object.entries(resultSets).map(([qid, set]) => [qid, { status: [completeStatus(['ara-test'])], result: [set] }])),
    ...scripts,
  };
  const { fetchMock, countCalls } = stubResultsFetch(allScripts);
  const store = makeTestStore();
  // The polled status/result queries pin staleTime/gcTime 0 themselves (see
  // resultListHooks). This default covers the other queries (user queries, saves)
  // so a test never serves cached data when navigating between query IDs.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } } });
  const router = createMemoryRouter(
    [{
      path: '/results',
      element: (
        <PageTitleProvider baseTitle="Results">
          <ResultList />
          <SidebarProbe />
        </PageTitleProvider>
      ),
    }],
    { initialEntries: [initialUrl] },
  );
  const ui: ReactElement = (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <CanvasContextMenuProvider>
            <RouterProvider router={router} />
          </CanvasContextMenuProvider>
        </SidebarProvider>
      </QueryClientProvider>
    </Provider>
  );
  return { ...render(ui), router, store, queryClient, fetchMock, countCalls };
};

/** Result row names in display order. */
export const getRowNames = (container: HTMLElement): string[] =>
  Array.from(container.querySelectorAll('[data-result-name]')).map(el => el.getAttribute('data-result-name') ?? '');
