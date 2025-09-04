import { commonQueryClientOptions } from "@/features/Common/utils/utilities";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QueryList from "@/features/QueryList/components/QueryList/QueryList";

const queryClient = new QueryClient(commonQueryClientOptions);

const Queries = () => {

  return (
    <div>
      <QueryClientProvider client={queryClient}>
        <QueryList />
      </QueryClientProvider>
    </div>
  );
}

export default Queries;