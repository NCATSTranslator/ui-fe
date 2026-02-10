import { SortSearchState } from '@/features/Projects/types/projects.d';
import styles from '@/features/Projects/components/TableHeader/TableHeader.module.scss';
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';
import SortableHeader from '@/features/Projects/components/SortableHeader/SortableHeader';

interface ProjectsTableHeaderProps {
  sortSearchState: SortSearchState;
}

const ProjectsTableHeader = ({ 
  sortSearchState
}: ProjectsTableHeaderProps) => {
  const { 
    sortField, 
    sortDirection, 
    handleSort 
  } = sortSearchState;

  return (
    <div className={styles.tableHeader}>
      <div className={`${styles.tableRow} ${styles.projectCardRow}`}>
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
        <div className={styles.queriesColumn}>
          <SortableHeader 
            field="queries" 
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          >
            Queries
          </SortableHeader>
        </div>
        <div className={styles.lastSeenColumn}>
          <SortableHeader 
            field="lastSeen" 
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          >
            Last Changed
          </SortableHeader>
        </div>
        <div className={styles.optionsColumn}></div>
      </div>
    </div>
  );
};

export default ProjectsTableHeader; 