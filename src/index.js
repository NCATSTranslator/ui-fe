import React from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import Page from './Components/Page/Page';
import Home from './PageRoutes/Home';
import About from './PageRoutes/About';
import Privacy from './PageRoutes/Privacy';
import Four from './PageRoutes/404';
import Templates from './PageRoutes/Templates';
import Build from './PageRoutes/Build';
import Results from './PageRoutes/Results';
import History from './PageRoutes/History';
import GraphTest from './PageRoutes/GraphTest';
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
            path="graph"
            element={
              <Page title="Graph Test">
                <GraphTest />
              </Page>
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
