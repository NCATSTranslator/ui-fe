import React from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import Page from './Components/Page/Page';
import FAQPage from './Components/Page/FAQPage';
import Home from './PageRoutes/Home/Home';
import About from './PageRoutes/About/About';
import Privacy from './PageRoutes/Privacy/Privacy';
import Four from './PageRoutes/404/404';
import Templates from './PageRoutes/Templates/Templates';
import Build from './PageRoutes/Build/Build';
import Results from './PageRoutes/Results/Results';
import History from './PageRoutes/History/History';
import Terms from './PageRoutes/Terms/Terms';
import Contact from './PageRoutes/Contact/Contact';
import { Help } from './PageRoutes/Articles/Help';
import { WhatIs } from './PageRoutes/Articles/WhatIs';
import { HowItWorks } from './PageRoutes/Articles/HowItWorks';
import { Evidence } from './PageRoutes/Articles/Evidence';
import reportWebVitals from './reportWebVitals';
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
            path="about-translator"
            element={
              <FAQPage title="About Biomedical Data Translator">
                <About />
              </FAQPage>
            }
          />
          <Route  
            path="about"
            element={
              <Page title="About Biomedical Data Translator">
                <About />
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
            path="contact-us"
            element={
              <Page title="Contact Us">
                <Contact />
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
            path="how-it-works"
            element={
              <FAQPage title="How It Works">
                <HowItWorks />
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
            path="privacy-policy"
            element={
              <Page title="Privacy Policy">
                <Privacy />
              </Page>
            }
          />
          <Route  
            path="templates"
            element={
              <Page title="Templated Queries">
                <Templates />
              </Page>
            }
          />
          <Route  
            path="build"
            element={
              <Page title="Build Your Own">
                <Build />
              </Page>
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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
