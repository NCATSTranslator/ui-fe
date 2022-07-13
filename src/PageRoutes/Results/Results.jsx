import React from "react";
import ResultsList from "../../Components/ResultsList/ResultsList";
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
const Results = () => {
  const queryClient = new QueryClient();

  return (
    <div>
      <QueryClientProvider client={queryClient}>
        <ResultsList />
        <ReactQueryDevtools initialIsOpen={false} style className="dev-tools"/>
      </QueryClientProvider>
    </div>
  );
}

export default Results;