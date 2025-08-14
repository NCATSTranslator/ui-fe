import { Dispatch, SetStateAction, useMemo } from 'react';
import { Project, UserQueryObject } from '@/features/Projects/types/projects';
import { getProjectStatus } from '@/features/Projects/utils/utilities';
import DataCard from '@/features/Projects/components/DataCard/DataCard';
import { useRestoreProjects } from '@/features/Projects/hooks/customHooks';
import { errorToast, projectRestoredToast } from '@/features/Projects/utils/toastMessages';

interface ProjectCardProps {
  onEdit?: (project: Project) => void;
  project: Project;
  queries: UserQueryObject[];
  searchTerm?: string;
  selectedProjects: Project[];
  setSelectedProjects: Dispatch<SetStateAction<Project[]>>;
  queriesLoading?: boolean;
}

const ProjectCard = ({
  onEdit,
  project,
  queries,
  searchTerm,
  selectedProjects,
  setSelectedProjects,
  queriesLoading = false
}: ProjectCardProps) => {

  const status = useMemo(() => getProjectStatus(project, queries), [project, queries]);
  const restoreProjectsMutation = useRestoreProjects();
  const onRestore = (project: Project) => {
    restoreProjectsMutation.mutate([project.id.toString()], { 
      onSuccess: () => {
        projectRestoredToast();
      },
      onError: (error) => {
        console.error('Failed to restore project:', error);
        errorToast('Failed to restore project');
      }
    });
  };

  return (
    <DataCard
      item={project}
      type="project"
      searchTerm={searchTerm}
      selectedItems={selectedProjects}
      setSelectedItems={setSelectedProjects}
      status={status}
      onEdit={onEdit}
      onRestore={onRestore}
      getItemId={(item: Project) => item.id}
      getItemTitle={(item: Project) => item.data.title}
      getItemTimeCreated={(item: Project) => item.time_created.toString()}
      getItemTimeUpdated={(item: Project) => item.time_updated.toString()}
      getItemBookmarkCount={(item: Project) => item.bookmark_count}
      getItemNoteCount={(item: Project) => item.note_count}
      getItemCount={(item: Project) => item.data.pks.length}
      queriesLoading={queriesLoading}
    />
  );
};

export default ProjectCard;