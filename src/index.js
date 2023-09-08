import {createRoot} from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import Root from './Root';
import App from './App';
import Page from './Components/Page/Page';
import FAQPage from './Components/Page/FAQPage';
import Home from './PageRoutes/Home/Home';
import Four from './PageRoutes/404/404';
import Results from './PageRoutes/Results/Results';
import History from './PageRoutes/History/History';
import Terms from './PageRoutes/Terms/Terms';
import DesignSystem from './PageRoutes/DesignSystem/DesignSystem';
import Login from './PageRoutes/Login/Login';
import UserHome from './PageRoutes/UserHome/UserHome';
import Saves from './PageRoutes/Saves/Saves';
import { Help } from './PageRoutes/Articles/Help';
import { LoggingIn } from './PageRoutes/Articles/LoggingIn';
import { WhatIs } from './PageRoutes/Articles/WhatIs';
import { Affiliates } from './PageRoutes/Articles/Affiliates';
import { SearchHistoryArticle } from './PageRoutes/Articles/SearchHistoryArticle';
import { SendFeedbackArticle } from './PageRoutes/Articles/SendFeedbackArticle';
import {Provider} from 'react-redux';
import {store} from './Redux/store';
import { Overview } from './PageRoutes/Articles/Overview';
import { ExploringRelationships } from './PageRoutes/Articles/ExploringRelationships';
import { ReviewIdentify } from './PageRoutes/Articles/ReviewIdentify';
import { FocusedAnalysis } from './PageRoutes/Articles/FocusedAnalysis';
import { UserPreferences } from './PageRoutes/Articles/UserPreferences';

const container = document.getElementById('root');
const root = createRoot(container);

const routes = [
  {
    path: "",
    element: <Page title="Home"><Home /></Page>
  },
  {
    path: "design",
    element: <Page title="Design System"><DesignSystem /></Page>
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
    path: 'focused-analysis',
    element: <FAQPage title="Focused Analysis of the Top Results"><FocusedAnalysis/></FAQPage>
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
    path: "send-feedback",
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
    path: "home",
    element: <Page title="User Home"><UserHome /></Page>
  },
  {
    path: "workspace",
    element: <Page title="User Workspace"><Saves /></Page>
  }
]

const FourOhFour = ()=>{
  return(<App><Page title="404 - Page Not Found"><Four /></Page></App>);
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root/>,
    children: [ 
      {
        path: "demo",
        element: <App/>,
        children: routes
      },
      {
        path: "main",
        element: <App/>,
        children: routes
      },
      {
        path: "login",
        element: <App><Page title="Login"><Login /></Page></App>,
        children: routes
      },
      { 
        path: "*", 
        element: <FourOhFour/>
      },
    ]

  },
]);

root.render(
  <Provider store={store}>
    <RouterProvider
      router={router}
      fallbackElement={<Page title="404 - Page Not Found"><Four /></Page>}
    />
  </Provider>
);

