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
import { ResultSet } from '@/features/ResultList/types/results';

/**
 * Integration harness for ResultList. Mounts it with the same provider stack
 * the app uses and serves result sets through a stubbed fetch, so the real
 * status → result → handleNewResults pipeline runs against fixture data.
 */

/** The filters panel registers into the sidebar rather than rendering inside ResultList; this mounts it alongside. */
const FiltersProbe = () => {
  const { getSidebarItem, getContextPanel } = useSidebar();
  const item = getSidebarItem('filters');
  return item ? <div data-testid="filters-probe">{getContextPanel(item)}</div> : null;
};

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

const urlOf = (input: Parameters<typeof fetch>[0]): string => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
};

/** Routes /query/:id/status and /query/:id/result to the given sets; everything else gets an empty object. */
export const stubResultsFetch = (resultSets: Record<string, ResultSet>) => {
  const fetchMock = vi.fn(async (input: Parameters<typeof fetch>[0]) => {
    const url = urlOf(input);
    const match = url.match(/\/query\/([^/?]+)\/(status|result)/);
    if (match) {
      const [, qid, kind] = match;
      if (kind === 'status') return jsonResponse({ status: 'complete', data: { aras: ['ara-test'], status: 'complete' } });
      return jsonResponse(resultSets[qid] ?? { status: 'error', data: { results: [] } });
    }
    return jsonResponse({});
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
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
  resultSets: Record<string, ResultSet>;
  initialUrl?: string;
}

export const renderResultList = ({
  resultSets,
  initialUrl = '/results?q=Q1&t=0&l=Type%202%20Diabetes&i=MONDO:0005148',
}: RenderResultListOptions) => {
  // ClampedDescription measures with ResizeObserver, which jsdom lacks
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  const fetchMock = stubResultsFetch(resultSets);
  const store = makeTestStore();
  // staleTime 0: the result queries do their work as side effects and return void,
  // so a cached "fresh" query would never re-run when navigating back to it
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } } });
  const router = createMemoryRouter(
    [{
      path: '/results',
      element: (
        <PageTitleProvider baseTitle="Results">
          <ResultList />
          <FiltersProbe />
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
  return { ...render(ui), router, store, queryClient, fetchMock };
};

/** Result row names in display order. */
export const getRowNames = (container: HTMLElement): string[] =>
  Array.from(container.querySelectorAll('[data-result-name]')).map(el => el.getAttribute('data-result-name') ?? '');
