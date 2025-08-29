import { Dispatch, SetStateAction, useMemo } from 'react';
import { Project, ProjectRaw, UserQueryObject } from '@/features/Projects/types/projects';
import { getProjectQueryCount, getProjectStatus } from '@/features/Projects/utils/utilities';
import DataCard from '@/features/Projects/components/DataCard/DataCard';
import { useEditProjectHandlers } from '@/features/Projects/utils/editUpdateFunctions';

interface ProjectCardProps {
  onDelete?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  project: Project;
  projects: ProjectRaw[];
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
  projects,
  queries,
  searchTerm,
  selectedProjects,
  setSelectedProjects,
  queriesLoading = false
}: ProjectCardProps) => {

  const status = useMemo(() => getProjectStatus(project, queries), [project, queries]);

  const { handleRestoreProject } = useEditProjectHandlers(undefined, projects);
  
  const onRestore = (project: Project) => {
    handleRestoreProject(project);
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
      getItemCount={(item: Project) => getProjectQueryCount(item, queries)}
      queriesLoading={queriesLoading}
    />
  );
};

export default ProjectCard;