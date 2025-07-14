import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import '@/index.css';
import App from '@/App';
import Page from '@/features/Page/components/Page/Page';
import FAQPage from '@/features/Page/components/Page/FAQPage';
import LoadingWrapper from '@/features/Common/components/LoadingWrapper/LoadingWrapper';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';
const Home = lazy(() => import('@/pageRoutes/Home/Home'));
const Results = lazy(() => import('@/pageRoutes/Results/Results'));
const History = lazy(() => import('@/pageRoutes/History/History'));
const Terms = lazy(() => import('@/pageRoutes/Terms/Terms'));
const UserPrefs = lazy(() => import('@/pageRoutes/UserPrefs/UserPrefs'));
const Workspace = lazy(() => import('@/pageRoutes/Workspace/Workspace'));
const SendFeedbackPage = lazy(() => import('@/pageRoutes/SendFeedback/SendFeedback'));
const Projects = lazy(() => import('@/pageRoutes/Projects/Projects'));
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
    element: <FAQPage title="Frequently Asked Questions"><Suspense fallback={<LoadingWrapper />}><Help /></Suspense></FAQPage>
  },
  {
    path: "logging-in",
    element: <FAQPage title="Frequently Asked Questions"><Suspense fallback={<LoadingWrapper  />}><LoggingIn /></Suspense></FAQPage>
  },
  {
    path: "overview",
    element: <FAQPage title="Overview"><Suspense fallback={<LoadingWrapper />}><Overview /></Suspense></FAQPage>
  },
  {
    path: 'exploring-relationships',
    element: <FAQPage title="Exploring Relationships"><Suspense fallback={<LoadingWrapper />}><ExploringRelationships/></Suspense></FAQPage>
  },
  {
    path: 'review-and-identify',
    element: <FAQPage title="Review and Identify Favorite Results"><Suspense fallback={<LoadingWrapper />}><ReviewIdentify/></Suspense></FAQPage>
  },
  {
    path: 'workspace-help',
    element: <FAQPage title="Workspace"><Suspense fallback={<LoadingWrapper />}><WorkspaceHelp/></Suspense></FAQPage>
  },
  {
    path: 'user-preferences',
    element: <FAQPage title="User Preferences"><Suspense fallback={<LoadingWrapper />}><UserPreferences/></Suspense></FAQPage>
  },
  {
    path: "what-is-translational-science",
    element: <FAQPage title="What is Translational Science"><Suspense fallback={<LoadingWrapper />}><WhatIs /></Suspense></FAQPage>
  },
  {
    path: "funding-information",
    element: <FAQPage title="Funding Information"><Suspense fallback={<LoadingWrapper />}><Affiliates /></Suspense></FAQPage>
  },
  {
    path: "search-history",
    element: <FAQPage title="Search History"><Suspense fallback={<LoadingWrapper />}><SearchHistoryArticle /></Suspense></FAQPage>
  },
  {
    path: "send-feedback-help",
    element: <FAQPage title="Send Feedback"><Suspense fallback={<LoadingWrapper />}><SendFeedbackArticle /></Suspense></FAQPage>
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
    path: "preferences",
    element: <Page title="User Preferences"><Suspense fallback={<LoadingWrapper />}><UserPrefs /></Suspense></Page>
  },
  {
    path: "workspace",
    element: <Page title="User Workspace"><Suspense fallback={<LoadingWrapper />}><Workspace /></Suspense></Page>
  },
  {
    path: "send-feedback",
    element: <Page title="Send Feedback"><Suspense fallback={<LoadingWrapper />}><SendFeedbackPage /></Suspense></Page>
  },
  {
    path: "projects",
    element: <Page title="Projects"><Suspense fallback={<LoadingWrapper />}><Projects /></Suspense></Page>
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

