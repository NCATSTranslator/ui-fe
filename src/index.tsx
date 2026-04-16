import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import '@/index.css';
import App from '@/App';
import Page from '@/features/Page/components/Page/Page';
import HelpPage from '@/features/Page/components/Page/HelpPage';
import LoadingWrapper from '@/features/Core/components/LoadingWrapper/LoadingWrapper';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import ResultBreadcrumbLabel from '@/features/Navigation/components/BreadcrumbLabels/ResultBreadcrumbLabel';
import NodeBreadcrumbLabel from '@/features/Navigation/components/BreadcrumbLabels/NodeBreadcrumbLabel';
import PathBreadcrumbLabel from '@/features/Navigation/components/BreadcrumbLabels/PathBreadcrumbLabel';
import PathRedirect from '@/features/Navigation/components/PathRedirect/PathRedirect';
import { resultsLoader } from '@/features/Navigation/utils/navigationUtils';
import QueryBreadcrumbLabel from './features/Navigation/components/BreadcrumbLabels/QueryBreadcrumbLabel';
import { AboutTranslator } from '@/pageRoutes/Articles/AboutTranslator';
import { QueryHistoryArticle } from '@/pageRoutes/Articles/QueryHistoryArticle';
import { SortingAndFiltering } from '@/pageRoutes/Articles/SortingAndFiltering';
import { SecurityAndPrivacy } from '@/pageRoutes/Articles/SecurityAndPrivacy';
import { FrequentlyAskedQuestions } from '@/pageRoutes/Articles/FrequentlyAskedQuestions';
import { AccountAndSettings } from '@/pageRoutes/Articles/AccountAndSettings';
import { ProjectsArticle } from '@/pageRoutes/Articles/ProjectsArticle';
import { SharingResults } from '@/pageRoutes/Articles/SharingResults';
import { BookmarksAndNotes } from '@/pageRoutes/Articles/BookmarksAndNotes';
import { RelationshipEvidence } from '@/pageRoutes/Articles/RelationshipEvidence';
import { PathsAndGraphs } from '@/pageRoutes/Articles/PathsAndGraphs';
import { LoadingAndSyncing } from '@/pageRoutes/Articles/LoadingAndSyncing';
import { SubmittingQueries } from '@/pageRoutes/Articles/SubmittingQueries';
import { HowToUseTranslator } from '@/pageRoutes/Articles/HowToUseTranslator';
const Home = lazy(() => import('@/pageRoutes/Home/Home'));
const ResultsLayout = lazy(() => import('@/pageRoutes/ResultsLayout/ResultsLayout'));
const History = lazy(() => import('@/pageRoutes/History/History'));
const Terms = lazy(() => import('@/pageRoutes/Terms/Terms'));
const Projects = lazy(() => import('@/pageRoutes/Projects/Projects'));
const ProjectDetail = lazy(() => import('@/pageRoutes/ProjectDetail/ProjectDetail'));
const Queries = lazy(() => import('@/pageRoutes/Queries/Queries'));
const LoggingIn = lazy(() => import('@/pageRoutes/Articles/LoggingIn').then(m => ({ default: m.LoggingIn })));
const WhatIs = lazy(() => import('@/pageRoutes/Articles/WhatIs').then(m => ({ default: m.WhatIs })));
const Affiliates = lazy(() => import('@/pageRoutes/Articles/Affiliates').then(m => ({ default: m.Affiliates })));
const SearchHistoryArticle = lazy(() => import('@/pageRoutes/Articles/SearchHistoryArticle').then(m => ({ default: m.SearchHistoryArticle })));
const SendFeedbackArticle = lazy(() => import('@/pageRoutes/Articles/SendFeedbackArticle').then(m => ({ default: m.SendFeedbackArticle })));
const Overview = lazy(() => import('@/pageRoutes/Articles/Overview').then(m => ({ default: m.Overview })));
const ExploringRelationships = lazy(() => import('@/pageRoutes/Articles/ExploringRelationships').then(m => ({ default: m.ExploringRelationships })));
const ReviewIdentify = lazy(() => import('@/pageRoutes/Articles/ReviewIdentify').then(m => ({ default: m.ReviewIdentify })));
const WorkspaceHelp = lazy(() => import('@/pageRoutes/Articles/Workspace').then(m => ({ default: m.WorkspaceHelp })));
const UserPreferences = lazy(() => import('@/pageRoutes/Articles/UserPreferences').then(m => ({ default: m.UserPreferences })));
const NewQuery = lazy(() => import('@/pageRoutes/NewQuery/NewQuery'));
const NodeInformationView = lazy(() => import('@/features/NodeInformationView/components/NodeInformationView/NodeInformationView'));
const EvidenceView = lazy(() => import('@/features/Evidence/components/EvidenceView/EvidenceView'));
const ResultDetailLayout = lazy(() => import('@/pageRoutes/ResultDetailLayout/ResultDetailLayout'));

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const lastReload = sessionStorage.getItem('vite:preloadError');
  if (!lastReload || Date.now() - Number(lastReload) > 10_000) {
    sessionStorage.setItem('vite:preloadError', String(Date.now()));
    window.location.reload();
  }
});

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}
const root = createRoot(container);

const routes = [
  {
    path: "",
    element: <Page title="Home"><Suspense fallback={<LoadingWrapper />}><Home /></Suspense></Page>
  },
  {
    path: "terms-of-use",
    element: <Page title="Terms of Use"><Suspense fallback={<LoadingWrapper />}><Terms /></Suspense></Page>
  },
  {
    // old help page, redirect to frequently asked questions
    path: "help",
    element: <Navigate to="/frequently-asked-questions" replace />
  },
  {
    path: "about-translator",
    element: <HelpPage title="About Translator"><AboutTranslator /></HelpPage>
  },
  {
    path: "logging-in",
    element: <HelpPage title="Logging In"><Suspense fallback={<LoadingWrapper />}><LoggingIn /></Suspense></HelpPage>
  },
  {
    path: "query-history-article",
    element: <HelpPage title="Query History"><QueryHistoryArticle /></HelpPage>
  },
  {
    path: "projects-article",
    element: <HelpPage title="Projects"><ProjectsArticle /></HelpPage>
  },
  {
    path: "overview",
    element: <HelpPage title="Overview"><Suspense fallback={<LoadingWrapper />}><Overview /></Suspense></HelpPage>
  },
  {
    path: 'exploring-relationships',
    element: <HelpPage title="Exploring Relationships"><Suspense fallback={<LoadingWrapper />}><ExploringRelationships/></Suspense></HelpPage>
  },
  {
    path: 'paths-and-graphs',
    element: <HelpPage title="Paths and Graphs"><PathsAndGraphs/></HelpPage>
  },
  {
    path: 'submitting-queries',
    element: <HelpPage title="Submitting Queries"><SubmittingQueries/></HelpPage>
  },
  {
    path: 'loading-and-syncing',
    element: <HelpPage title="Loading and Syncing"><LoadingAndSyncing/></HelpPage>
  },
  {
    path: 'relationship-evidence',
    element: <HelpPage title="Relationship Evidence"><RelationshipEvidence/></HelpPage>
  },
  {
    path: 'review-and-identify',
    element: <HelpPage title="Review and Identify Favorite Results"><Suspense fallback={<LoadingWrapper />}><ReviewIdentify/></Suspense></HelpPage>
  },
  {
    path: 'workspace-help',
    element: <HelpPage title="Workspace"><Suspense fallback={<LoadingWrapper />}><WorkspaceHelp/></Suspense></HelpPage>
  },
  {
    path: 'user-preferences',
    element: <HelpPage title="User Preferences"><Suspense fallback={<LoadingWrapper />}><UserPreferences/></Suspense></HelpPage>
  },
  {
    path: "what-is-translational-science",
    element: <HelpPage title="What is Translational Science"><Suspense fallback={<LoadingWrapper />}><WhatIs /></Suspense></HelpPage>
  },
  {
    path: "funding-information",
    element: <HelpPage title="Funding Information"><Suspense fallback={<LoadingWrapper />}><Affiliates /></Suspense></HelpPage>
  },
  {
    path: "search-history",
    element: <HelpPage title="Search History"><Suspense fallback={<LoadingWrapper />}><SearchHistoryArticle /></Suspense></HelpPage>
  },
  {
    path: "send-feedback-help",
    element: <HelpPage title="Send Feedback"><Suspense fallback={<LoadingWrapper />}><SendFeedbackArticle /></Suspense></HelpPage>
  },
  {
    path: "bookmarks-and-notes",
    element: <HelpPage title="Bookmarks and Notes"><BookmarksAndNotes /></HelpPage>
  },
  {
    path: "how-to-use-translator",
    element: <HelpPage title="How to Use Translator"><HowToUseTranslator /></HelpPage>
  },
  {
    path: "sorting-and-filtering",
    element: <HelpPage title="Sorting and Filtering"><SortingAndFiltering /></HelpPage>
  },
  {
    path: "security-and-privacy",
    element: <HelpPage title="Security and Privacy"><SecurityAndPrivacy /></HelpPage>
  },
  {
    path: "frequently-asked-questions",
    element: <HelpPage title="Frequently Asked Questions"><FrequentlyAskedQuestions /></HelpPage>
  },
  {
    path: "account-and-settings",
    element: <HelpPage title="Account and Settings"><AccountAndSettings /></HelpPage>
  },
  {
    path: "sharing-results",
    element: <HelpPage title="Sharing Results"><SharingResults /></HelpPage>
  },
  {
    path: "results",
    loader: resultsLoader,
    element: <Page title="Results"><Suspense fallback={<LoadingWrapper />}><ResultsLayout /></Suspense></Page>,
    handle: { breadcrumb: QueryBreadcrumbLabel },
    children: [
      { index: true, element: null },
      {
        path: ":resultId",
        element: <Suspense fallback={<LoadingWrapper />}><ResultDetailLayout /></Suspense>,
        handle: { breadcrumb: ResultBreadcrumbLabel },
        children: [
          {
            path: "node/:nodeId",
            element: <Suspense fallback={<LoadingWrapper />}><NodeInformationView /></Suspense>,
            handle: { breadcrumb: NodeBreadcrumbLabel },
          },
          {
            path: "path/:pathId",
            handle: { breadcrumb: PathBreadcrumbLabel },
            children: [
              { index: true, element: <PathRedirect /> },
              {
                path: "evidence/:edgeId",
                element: <Suspense fallback={<LoadingWrapper />}><EvidenceView /></Suspense>,
                // no breadcrumb label for evidence in path view
                // handle: { breadcrumb: ':)' },
              },
            ],
          },
          // Evidence view for edges outside of paths (graph view)
          {
            path: "evidence/:edgeId",
            element: <Suspense fallback={<LoadingWrapper />}><EvidenceView /></Suspense>,
            handle: { breadcrumb: 'Graph Evidence' },
          },
        ],
      },
    ],
  },
  // Evidence view for edges outside of results (canvas view)
  {
    path: "evidence/:edgeId",
    element: <Suspense fallback={<LoadingWrapper />}><EvidenceView /></Suspense>,
    handle: { breadcrumb: 'Canvas Evidence' },
  },
  {
    path: "history",
    element: <Page title="History"><Suspense fallback={<LoadingWrapper />}><History /></Suspense></Page>
  },
  {
    path: "projects",
    element: <Page title="Projects"><Suspense fallback={<LoadingWrapper />}><Projects /></Suspense></Page>
  },
  {
    path: "projects/:projectId",
    element: <Page title="Project"><Suspense fallback={<LoadingWrapper />}><ProjectDetail /></Suspense></Page>
  },
  {
    path: "queries",
    element: <Navigate to="/query-history" replace />
  },
  {
    path: "query-history",
    element: <Page title="Query History"><Suspense fallback={<LoadingWrapper />}><Queries /></Suspense></Page>
  },
  {
    path: "new-query",
    element: <Page title="New Query"><Suspense fallback={<LoadingWrapper />}><NewQuery /></Suspense></Page>
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  },
]

const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
    children: routes
  },
]);

root.render(
  <Provider store={store}>
    <RouterProvider
      router={router}
    />
  </Provider>
);
