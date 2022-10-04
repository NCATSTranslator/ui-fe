import React from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import Page from './Components/Page/Page';
import FAQPage from './Components/Page/FAQPage';
import Home from './PageRoutes/Home/Home';
import Four from './PageRoutes/404/404';
import Results from './PageRoutes/Results/Results';
import History from './PageRoutes/History/History';
import Terms from './PageRoutes/Terms/Terms';
import { Help } from './PageRoutes/Articles/Help';
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
root.render(
  <Provider store={store}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App/>} >
          <Route index 
            element={
              <Page title="Home">
                <Home />
              </Page>
            }
          />
          <Route  
            path="terms-of-use"
            element={
              <Page title="Terms of Use">
                <Terms />
              </Page>
            }
          />
          <Route  
            path="help"
            element={
              <FAQPage title="Frequently Asked Questions">
                <Help />
              </FAQPage>
            }
          />
          <Route  
            path="what-is-translational-science"
            element={
              <FAQPage title="What is Translational Science">
                <WhatIs />
              </FAQPage>
            }
          />
          <Route  
            path="funding-information"
            element={
              <FAQPage title="Funding Information">
                <Affiliates />
              </FAQPage>
            }
          />
          <Route  
            path="how-it-works"
            element={
              <FAQPage title="How It Works">
                <HowItWorks />
              </FAQPage>
            }
          />
          <Route  
            path="knowledge-providers"
            element={
              <FAQPage title="Knowledge Providers">
                <Kps />
              </FAQPage>
            }
          />
          <Route  
            path="autonomous-relay-agents"
            element={
              <FAQPage title="Autonomous Relay Agents">
                <Aras />
              </FAQPage>
            }
          />
          <Route  
            path="autonomous-relay-system"
            element={
              <FAQPage title="Autonomous Relay System">
                <Ars />
              </FAQPage>
            }
          />
          <Route  
            path="knowledge-graphs"
            element={
              <FAQPage title="Knowledge Graphs">
                <Kgs />
              </FAQPage>
            }
          />
          <Route  
            path="smartapi"
            element={
              <FAQPage title="SmartAPI">
                <SmartAPI />
              </FAQPage>
            }
          />
          <Route  
            path="forming-a-question"
            element={
              <FAQPage title="Forming a Question">
                <Question />
              </FAQPage>
            }
          />
          <Route  
            path="article-results"
            element={
              <FAQPage title="Results">
                <ResultsArticle />
              </FAQPage>
            }
          />
          <Route  
            path="evidence"
            element={
              <FAQPage title="Evidence">
                <Evidence />
              </FAQPage>
            }
          />
          <Route  
            path="search-history"
            element={
              <FAQPage title="Search History">
                <SearchHistoryArticle />
              </FAQPage>
            }
          />
          <Route  
            path="send-feedback"
            element={
              <FAQPage title="Send Feedback">
                <SendFeedbackArticle />
              </FAQPage>
            }
          />
          <Route  
            path="results"
            element={
              <Page title="Results">
                <Results />
              </Page>
            }
          />
          <Route  
            path="history"
            element={
              <Page title="History">
                <History />
              </Page>
            }
          />
          <Route  
            path="*"
            element={
              <Page title="404 - Page Not Found">
                <Four />
              </Page>
            }
          />
          <Route path="*" element={<Four/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </Provider>
);

