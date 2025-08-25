import { Dispatch, SetStateAction, useMemo } from 'react';
import { Project, UserQueryObject } from '@/features/Projects/types/projects';
import { getProjectStatus } from '@/features/Projects/utils/utilities';
import DataCard from '@/features/Projects/components/DataCard/DataCard';
import { useDeleteProjects, useRestoreProjects } from '@/features/Projects/hooks/customHooks';
import { errorToast, projectDeletedToast, projectRestoredToast } from '@/features/Projects/utils/toastMessages';

interface ProjectCardProps {
  onDelete?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  project: Project;
  queries: UserQueryObject[];
  searchTerm?: string;
  selectedProjects: Project[];
  setSelectedProjects: Dispatch<SetStateAction<Project[]>>;
  queriesLoading?: boolean;
}

const ProjectCard = ({
  onDelete,
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

  const handleDelete = (project: Project) => {
    if(onDelete)
      onDelete(project);
    else
      console.warn('No onDelete function provided to ProjectCard.');
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
      onDelete={handleDelete}
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