import ResultList from "@/features/ResultList/components/ResultList/ResultList";
import { commonQueryClientOptions } from "@/features/Common/utils/utilities";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient(commonQueryClientOptions);

const Results = () => {

  return (
    <div>
      <QueryClientProvider client={queryClient}>
        <ResultList />
      </QueryClientProvider>
    </div>
  );
}

export default Results;