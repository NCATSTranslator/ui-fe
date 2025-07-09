import ResultList from "@/features/ResultList/components/ResultList/ResultList";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const Results = () => {
  const queryClient = new QueryClient();

  return (
    <div>
      <QueryClientProvider client={queryClient}>
        <ResultList />
      </QueryClientProvider>
    </div>
  );
}

export default Results;