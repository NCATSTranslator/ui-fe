import { Project } from '@/features/Projects/types/projects.d';
import Checkbox from '@/features/Core/components/Checkbox/Checkbox';
import styles from '@/features/Projects/components/TableHeader/TableHeader.module.scss';
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';

interface ProjectsTableHeaderProps {
  selectedProjects: Project[];
  setSelectedProjects: (projects: Project[]) => void;
  activeProjects: Project[];
}

const ProjectsTableHeader = ({ 
  selectedProjects, 
  setSelectedProjects, 
  activeProjects 
}: ProjectsTableHeaderProps) => {
  const handleSelectAll = () => {
    if (selectedProjects.length === activeProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects([...activeProjects]);
    }
  };

  const allSelected = activeProjects.length > 0 && selectedProjects.length === activeProjects.length;
  const someSelected = selectedProjects.length > 0 && selectedProjects.length < activeProjects.length;

  return (
    <div className={styles.tableHeader}>
      <div className={styles.tableRow}>
        <div className={styles.checkboxColumn}>
          <Checkbox 
            checked={allSelected}
            handleClick={handleSelectAll}
            className={someSelected ? styles.indeterminate : ''}
          />
          <div className={styles.separator}></div>
        </div>
        <div className={styles.nameColumn}>Name</div>
        <div className={styles.actionsColumn}></div>
        <div className={styles.lastSeenColumn}>Last Seen</div>
        <div className={styles.dateAddedColumn}>Date Added</div>
        <div className={styles.bookmarksColumn}><BookmarkIcon /></div>
        <div className={styles.notesColumn}><NoteIcon /></div>
        <div className={styles.statusColumn}>Status</div>
      </div>
    </div>
  );
};

export default ProjectsTableHeader; 