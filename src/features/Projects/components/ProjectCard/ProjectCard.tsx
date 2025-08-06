import { Dispatch, SetStateAction, useMemo } from 'react';
import { Project, UserQueryObject } from '@/features/Projects/types/projects';
import { getProjectStatus } from '@/features/Projects/utils/utilities';
import DataCard from '@/features/Projects/components/DataCard/DataCard';

interface ProjectCardProps {
  onEdit?: (project: Project) => void;
  project: Project;
  queries: UserQueryObject[];
  searchTerm?: string;
  selectedProjects: Project[];
  setSelectedProjects: Dispatch<SetStateAction<Project[]>>;
}

const ProjectCard = ({
  onEdit,
  project,
  queries,
  searchTerm,
  selectedProjects,
  setSelectedProjects
}: ProjectCardProps) => {

  const status = useMemo(() => getProjectStatus(project, queries), [project, queries]);

  return (
    <DataCard
      item={project}
      type="project"
      searchTerm={searchTerm}
      selectedItems={selectedProjects}
      setSelectedItems={setSelectedProjects}
      status={status}
      onEdit={onEdit}
      getItemId={(item: Project) => item.id}
      getItemTitle={(item: Project) => item.data.title}
      getItemTimeCreated={(item: Project) => item.time_created.toString()}
      getItemTimeUpdated={(item: Project) => item.time_updated.toString()}
      getItemBookmarkCount={(item: Project) => item.bookmark_count}
      getItemNoteCount={(item: Project) => item.note_count}
      getItemCount={(item: Project) => item.data.pks.length}
    />
  );
};

export default ProjectCard;