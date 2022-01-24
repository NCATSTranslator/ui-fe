import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
// import Home from './Routes/Home';
import About from './Routes/About';
import Four from './Routes/404';
import Templates from './Routes/Templates';
import Build from './Routes/Build';
import Results from './Routes/Results';
import reportWebVitals from './reportWebVitals';
// import {Provider} from 'react-redux';
// import {store} from './Redux/store';

ReactDOM.render(
  // <Provider store={store}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App/>} >
          {/* <Route index element={<Home/>} /> */}
          <Route path="about" element={<About/>} />
          <Route path="templates" element={<Templates/>} />
          <Route path="build" element={<Build/>} />
          <Route path="results" element={<Results/>} />
          <Route path="*" element={<Four/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  // </Provider>
  ,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
