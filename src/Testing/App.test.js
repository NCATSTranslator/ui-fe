import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from '../App';
import {store} from '../Redux/store';
import {Provider} from 'react-redux';

describe('App Test',  () => {
  test('Header disclaimer is present', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App/>} ></Route>
          </Routes>
        </BrowserRouter>
      </Provider>
    );
    expect(screen.getByText(/This system is for research purposes/)).toBeInTheDocument();
  });

  test('Feedback modal starts hidden', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App/>} ></Route>
          </Routes>
        </BrowserRouter>
      </Provider>
    );
    let feedbackModal = await screen.findByTestId('send-feedback-modal');
    expect(feedbackModal).not.toHaveClass('true');
  });
});
