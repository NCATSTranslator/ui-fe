import React from "react";
import ResultsList from "../../Components/ResultsList/ResultsList";
import { QueryClient, QueryClientProvider } from 'react-query';
const Results = () => {
  const queryClient = new QueryClient();

  return (
    <div>
      <QueryClientProvider client={queryClient}>
        <ResultsList />
      </QueryClientProvider>
    </div>
  );
}

export default Results;