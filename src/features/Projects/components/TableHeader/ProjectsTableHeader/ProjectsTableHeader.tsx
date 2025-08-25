import { Project, ProjectListState } from '@/features/Projects/types/projects.d';
import Checkbox from '@/features/Core/components/Checkbox/Checkbox';
import styles from '@/features/Projects/components/TableHeader/TableHeader.module.scss';
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';
import SortableHeader from '@/features/Projects/components/SortableHeader/SortableHeader';
import { isUnassignedProject } from '@/features/Projects/utils/editUpdateFunctions';

interface ProjectsTableHeaderProps {
  activeProjects: Project[];
  projectListState: ProjectListState;
}

const ProjectsTableHeader = ({ 
  activeProjects,
  projectListState
}: ProjectsTableHeaderProps) => {
  const { 
    selectedProjects, 
    setSelectedProjects, 
    sortField, 
    sortDirection, 
    handleSort 
  } = projectListState;

  const activeProjectsWithoutUnassigned = activeProjects.filter(project => !isUnassignedProject(project));

  const allSelected = activeProjectsWithoutUnassigned.length > 0 && (selectedProjects.length === activeProjectsWithoutUnassigned.length);
  const someSelected = selectedProjects.length > 0 && selectedProjects.length < activeProjectsWithoutUnassigned.length;

  const handleSelectAll = () => {
    // dont include unassigned project in the count
    if (selectedProjects.length === activeProjectsWithoutUnassigned.length) {
      setSelectedProjects([]);
    } else {
      // dont include unassigned project in the selection
      setSelectedProjects([...activeProjectsWithoutUnassigned]);
    }
  };
  
  return (
    <div className={styles.tableHeader}>
      <div className={styles.tableRow}>
        <div className={styles.checkboxColumn}>
          <Checkbox
            disabled={activeProjectsWithoutUnassigned.length === 0}
            checked={allSelected}
            handleClick={handleSelectAll}
            className={someSelected ? styles.indeterminate : ''}
          />
          <div className={styles.separator}></div>
        </div>
        <div className={styles.nameColumn}>
          <SortableHeader 
            field="name" 
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          >
            Name
          </SortableHeader>
        </div>
        <div className={styles.actionsColumn}></div>
        <div className={styles.lastSeenColumn}>
          <SortableHeader 
            field="lastSeen" 
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          >
            Last Seen
          </SortableHeader>
        </div>
        <div className={styles.dateAddedColumn}>
          <SortableHeader 
            field="dateAdded" 
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          >
            Date Added
          </SortableHeader>
        </div>
        <div className={styles.bookmarksColumn}>
          <SortableHeader 
            field="bookmarks" 
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          >
            <BookmarkIcon />
          </SortableHeader>
        </div>
        <div className={styles.notesColumn}>
          <SortableHeader 
            field="notes" 
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          >
            <NoteIcon />
          </SortableHeader>
        </div>
        <div className={styles.statusColumn}>
          <SortableHeader 
            field="status" 
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          >
            Status
          </SortableHeader>
        </div>
      </div>
    </div>
  );
};

export default ProjectsTableHeader; 