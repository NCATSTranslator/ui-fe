import { Dispatch, SetStateAction, useMemo } from 'react';
import styles from './ProjectCard.module.scss';
import { Project, QueryStatusObject } from '@/features/Projects/types/projects';
import Button from '@/features/Core/components/Button/Button';
import ShareIcon from '@/assets/icons/buttons/Share.svg?react';
import EditIcon from '@/assets/icons/buttons/Edit.svg?react';
import { getFormattedDate } from '@/features/Common/utils/utilities';
import Checkbox from '@/features/Core/components/Checkbox/Checkbox';
import { getProjectStatus } from '@/features/Projects/utils/utilities';
import StatusIndicator from '@/features/Projects/components/StatusIndicator/StatusIndicator';
import CardWrapper from '@/features/Projects/components/CardWrapper/CardWrapper';
import CardName from '../CardName/CardName';

interface ProjectCardProps {
  queries: QueryStatusObject[];
  project: Project;
  setSelectedProjects: Dispatch<SetStateAction<Project[]>>;
  selectedProjects: Project[];
}

const ProjectCard = ({ 
  queries,
  project,
  setSelectedProjects,
  selectedProjects
}: ProjectCardProps) => {

  const handleSelectProject = () => {
    setSelectedProjects((prevProjects) => {
      if (prevProjects.includes(project)) {
        return prevProjects.filter((p) => p.id !== project.id);
      }
      return [...prevProjects, project];
    });
  };

  const status = useMemo(() => getProjectStatus(project, queries), [project, queries]);

  return (
    <CardWrapper className={styles.projectCard}>
      <div className={styles.checkboxColumn}>
        <Checkbox checked={selectedProjects.includes(project)} handleClick={handleSelectProject} />
      </div>
      <div className={styles.nameColumn}>
        <CardName 
          type="project"
          name={project.title}
          itemCount={project.qids.length}
        />
      </div>
      <div className={styles.actionsColumn}>
        <Button variant="secondary" iconOnly>
          <EditIcon/>
        </Button>
        <Button variant="secondary" iconOnly>
          <ShareIcon/>
        </Button>
      </div>
      <div className={styles.lastSeenColumn}>
        {getFormattedDate(new Date(project.time_updated), false)}
      </div>
      <div className={styles.dateAddedColumn}>
        {getFormattedDate(new Date(project.time_created), false)}
      </div>
      <div className={styles.bookmarksColumn}>
        {project.bookmark_count}
      </div>
      <div className={styles.notesColumn}>
        {project.note_count}
      </div>
      <div className={styles.statusColumn}>
        <StatusIndicator status={status} />
      </div>
    </CardWrapper>
  )
}

export default ProjectCard;