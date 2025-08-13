import { QueryClientProvider } from '@tanstack/react-query';
import { ProjectListInner } from '@/features/Projects/components/ProjectListInner/ProjectListInner';
import { projectsQueryClient } from '@/features/Projects/utils/utilities';


const ProjectList = () => {
  return (
    <QueryClientProvider client={projectsQueryClient}>
      <ProjectListInner />
    </QueryClientProvider>
  );
};

export default ProjectList;