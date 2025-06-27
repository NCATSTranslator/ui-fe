import {createRoot} from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import '@/index.css';
import App from '@/App';
import Page from '@/features/Page/components/Page/Page';
import FAQPage from '@/features/Page/components/Page/FAQPage';
import Home from '@/pageRoutes/Home/Home';
import Results from '@/pageRoutes/Results/Results';
import History from '@/pageRoutes/History/History';
import Terms from '@/pageRoutes/Terms/Terms';
import UserPrefs from '@/pageRoutes/UserPrefs/UserPrefs';
import Workspace from '@/pageRoutes/Workspace/Workspace';
import SendFeedbackPage from '@/pageRoutes/SendFeedback/SendFeedback';
import { Help } from '@/pageRoutes/Articles/Help';
import { LoggingIn } from '@/pageRoutes/Articles/LoggingIn';
import { WhatIs } from '@/pageRoutes/Articles/WhatIs';
import { Affiliates } from '@/pageRoutes/Articles/Affiliates';
import { SearchHistoryArticle } from '@/pageRoutes/Articles/SearchHistoryArticle';
import { SendFeedbackArticle } from '@/pageRoutes/Articles/SendFeedbackArticle';
import {Provider} from 'react-redux';
import {store} from '@/redux/store';
import { Overview } from '@/pageRoutes/Articles/Overview';
import { ExploringRelationships } from '@/pageRoutes/Articles/ExploringRelationships';
import { ReviewIdentify } from '@/pageRoutes/Articles/ReviewIdentify';
import { WorkspaceHelp } from '@/pageRoutes/Articles/Workspace';
import { UserPreferences } from '@/pageRoutes/Articles/UserPreferences';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}
const root = createRoot(container);

const routes = [
  {
    path: "",
    element: <Page title="Home"><Home /></Page>
  },
  {
    path: "terms-of-use",
    element: <Page title="Terms of Use"><Terms /></Page>
  },
  {
    path: "help",
    element: <FAQPage title="Frequently Asked Questions"><Help /></FAQPage>
  },
  {
    path: "logging-in",
    element: <FAQPage title="Frequently Asked Questions"><LoggingIn /></FAQPage>
  },
  {
    path: "overview",
    element: <FAQPage title="Overview"><Overview /></FAQPage>
  },
  {
    path: 'exploring-relationships',
    element: <FAQPage title="Exploring Relationships"><ExploringRelationships/></FAQPage>
  },
  {
    path: 'review-and-identify',
    element: <FAQPage title="Review and Identify Favorite Results"><ReviewIdentify/></FAQPage>
  },
  {
    path: 'workspace-help',
    element: <FAQPage title="Workspace"><WorkspaceHelp/></FAQPage>
  },
  {
    path: 'user-preferences',
    element: <FAQPage title="User Preferences"><UserPreferences/></FAQPage>
  },
  {
    path: "what-is-translational-science",
    element: <FAQPage title="What is Translational Science"><WhatIs /></FAQPage>
  },
  {
    path: "funding-information",
    element: <FAQPage title="Funding Information"><Affiliates /></FAQPage>
  },
  {
    path: "search-history",
    element: <FAQPage title="Search History"><SearchHistoryArticle /></FAQPage>
  },
  {
    path: "send-feedback-help",
    element: <FAQPage title="Send Feedback"><SendFeedbackArticle /></FAQPage>
  },
  {
    path: "results",
    element: <Page title="Results"><Results /></Page>
  },
  {
    path: "history",
    element: <Page title="History"><History /></Page>
  },
  {
    path: "preferences",
    element: <Page title="User Preferences"><UserPrefs /></Page>
  },
  {
    path: "workspace",
    element: <Page title="User Workspace"><Workspace /></Page>
  },
  {
    path: "send-feedback",
    element: <Page title="Send Feedback"><SendFeedbackPage /></Page>
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

