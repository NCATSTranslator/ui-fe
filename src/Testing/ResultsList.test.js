import { render, screen } from '@testing-library/react';
import ResultsList from '../Components/ResultsList/ResultsList';
import { QueryClient, QueryClientProvider } from 'react-query';
import {store} from '../Redux/store';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {Provider} from 'react-redux';

describe('Results List Test', () => {
  test('Header disclaimer is present', () => {
    const queryClient = new QueryClient();

    render (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<ResultsList/>} ></Route>
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </Provider>
    );

    expect(screen.getByText(/No results available/)).toBeInTheDocument();
  });
});