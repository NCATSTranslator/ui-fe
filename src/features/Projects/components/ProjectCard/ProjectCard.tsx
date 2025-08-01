import { Dispatch, SetStateAction, useMemo } from 'react';
import { Project, QueryStatusObject } from '@/features/Projects/types/projects';
import { getProjectStatus } from '@/features/Projects/utils/utilities';
import DataCard from '@/features/Projects/components/DataCard/DataCard';

interface ProjectCardProps {
  queries: QueryStatusObject[];
  project: Project;
  searchTerm?: string;
  setSelectedProjects: Dispatch<SetStateAction<Project[]>>;
  selectedProjects: Project[];
  onEdit?: (project: Project) => void;
}

const ProjectCard = ({ 
  queries,
  project,
  searchTerm,
  setSelectedProjects,
  selectedProjects,
  onEdit
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
      getItemTitle={(item: Project) => item.title}
      getItemTimeCreated={(item: Project) => item.time_created.toString()}
      getItemTimeUpdated={(item: Project) => item.time_updated.toString()}
      getItemBookmarkCount={(item: Project) => item.bookmark_count}
      getItemNoteCount={(item: Project) => item.note_count}
      getItemCount={(item: Project) => item.qids.length}
    />
  );
};

export default ProjectCard;