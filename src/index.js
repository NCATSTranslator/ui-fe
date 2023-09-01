import React from 'react';
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
import { HowItWorks } from './PageRoutes/Articles/HowItWorks';
import { Evidence } from './PageRoutes/Articles/Evidence';
import { Affiliates } from './PageRoutes/Articles/Affiliates';
import { Kps } from './PageRoutes/Articles/Kps';
import { Aras } from './PageRoutes/Articles/Aras';
import { Ars } from './PageRoutes/Articles/Ars';
import { Kgs } from './PageRoutes/Articles/Kgs';
import { SmartAPI } from './PageRoutes/Articles/SmartAPI';
import { Question } from './PageRoutes/Articles/Question';
import { ResultsArticle } from './PageRoutes/Articles/ResultsArticle';
import { SearchHistoryArticle } from './PageRoutes/Articles/SearchHistoryArticle';
import { SendFeedbackArticle } from './PageRoutes/Articles/SendFeedbackArticle';
import {Provider} from 'react-redux';
import {store} from './Redux/store';

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
    path: "what-is-translational-science",
    element: <FAQPage title="What is Translational Science"><WhatIs /></FAQPage>
  },
  {
    path: "funding-information",
    element: <FAQPage title="Funding Information"><Affiliates /></FAQPage>
  },
  {
    path: "how-it-works",
    element:<FAQPage title="How It Works"><HowItWorks /></FAQPage>
  },
  {
    path: "knowledge-providers",
    element: <FAQPage title="Knowledge Providers"><Kps /></FAQPage>
  },
  {
    path: "autonomous-relay-agents",
    element: <FAQPage title="Autonomous Relay Agents"><Aras /></FAQPage>
  },
  {
    path: "autonomous-relay-system",
    element: <FAQPage title="Autonomous Relay System"><Ars /></FAQPage>
  },
  {
    path: "knowledge-graphs",
    element: <FAQPage title="Knowledge Graphs"><Kgs /></FAQPage>
  },
  {
    path: "smartapi",
    element: <FAQPage title="SmartAPI"><SmartAPI /></FAQPage>
  },
  {
    path: "forming-a-question",
    element: <FAQPage title="Forming a Question"><Question /></FAQPage>
  },
  {
    path: "article-results",
    element: <FAQPage title="Results"><ResultsArticle /></FAQPage>
  },
  {
    path: "evidence",
    element: <FAQPage title="Evidence"><Evidence /></FAQPage>
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

