import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectListInner } from '@/features/Projects/components/ProjectListInner/ProjectListInner';

const projectsQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 min
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
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