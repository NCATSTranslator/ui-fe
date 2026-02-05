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
const Home = lazy(() => import('@/pageRoutes/Home/Home'));
const Results = lazy(() => import('@/pageRoutes/Results/Results'));
const History = lazy(() => import('@/pageRoutes/History/History'));
const Terms = lazy(() => import('@/pageRoutes/Terms/Terms'));
const Workspace = lazy(() => import('@/pageRoutes/Workspace/Workspace'));
const Projects = lazy(() => import('@/pageRoutes/Projects/Projects'));
const ProjectDetail = lazy(() => import('@/pageRoutes/ProjectDetail/ProjectDetail'));
const Queries = lazy(() => import('@/pageRoutes/Queries/Queries'));
const Help = lazy(() => import('@/pageRoutes/Articles/Help').then(m => ({ default: m.Help })));
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
    path: "help",
    element: <HelpPage title="Frequently Asked Questions"><Suspense fallback={<LoadingWrapper />}><Help /></Suspense></HelpPage>
  },
  {
    path: "logging-in",
    element: <HelpPage title="Logging In"><Suspense fallback={<LoadingWrapper />}><LoggingIn /></Suspense></HelpPage>
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
    path: "results",
    element: <Page title="Results"><Suspense fallback={<LoadingWrapper />}><Results /></Suspense></Page>
  },
  {
    path: "history",
    element: <Page title="History"><Suspense fallback={<LoadingWrapper />}><History /></Suspense></Page>
  },
  {
    path: "workspace",
    element: <Page title="User Workspace"><Suspense fallback={<LoadingWrapper />}><Workspace /></Suspense></Page>
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
    element: <Page title="Queries"><Suspense fallback={<LoadingWrapper />}><Queries /></Suspense></Page>
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

