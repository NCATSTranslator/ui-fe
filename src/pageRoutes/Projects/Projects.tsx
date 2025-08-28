import { ProjectListInner } from "@/features/Projects/components/ProjectListInner/ProjectListInner";
import { commonQueryClientOptions } from "@/features/Common/utils/utilities";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient(commonQueryClientOptions);

const Projects = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <ProjectListInner />
    </QueryClientProvider>
  );
}

export default Projects;