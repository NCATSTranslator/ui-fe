import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectDetailInner from '@/features/Projects/components/ProjectDetailInner/ProjectDetailInner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});



const ProjectDetail = () => (
  <QueryClientProvider client={queryClient}>
    <div className="container">
      <ProjectDetailInner />
    </div>
  </QueryClientProvider>
);

export default ProjectDetail;
