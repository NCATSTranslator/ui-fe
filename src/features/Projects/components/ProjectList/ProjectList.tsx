import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectListInner } from '@/features/Projects/components/ProjectListInner/ProjectListInner';
import { AppToastContainer } from '@/features/Common/components/AppToastContainer/AppToastContainer';

const projectsQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 min
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

const ProjectList = () => {
  return (
    <QueryClientProvider client={projectsQueryClient}>
      <ProjectListInner />
    </QueryClientProvider>
  );
};

export default ProjectList;