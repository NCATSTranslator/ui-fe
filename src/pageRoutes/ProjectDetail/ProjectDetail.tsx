import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectDetailInner from '@/features/Projects/components/ProjectDetailInner/ProjectDetailInner';
import { commonQueryClientOptions } from '@/features/Common/utils/utilities';

const queryClient = new QueryClient(commonQueryClientOptions);

const ProjectDetail = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <div className="container">
        <ProjectDetailInner />
      </div>
    </QueryClientProvider>
  )
};

export default ProjectDetail;
