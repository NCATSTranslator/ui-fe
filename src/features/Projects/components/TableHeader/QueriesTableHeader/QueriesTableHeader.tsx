import { SortField, SortDirection } from '@/features/Projects/types/projects.d';
import styles from '@/features/Projects/components/TableHeader/TableHeader.module.scss';
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';
import SortableHeader from '@/features/Projects/components/SortableHeader/SortableHeader';

interface QueriesTableHeaderProps {
  onSort: (field: SortField) => void;
  sortDirection: SortDirection;
  sortField: SortField;
}

const QueriesTableHeader = ({
  onSort,
  sortField,
  sortDirection
}: QueriesTableHeaderProps) => {

  return (
    <div className={styles.tableHeader}>
      <div className={`${styles.tableRow}`}>
        <div className={styles.nameColumn}>
          <SortableHeader 
            field="name" 
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
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
            onSort={onSort}
          >
            Last Seen
          </SortableHeader>
        </div>
        <div className={styles.dateAddedColumn}>
          <SortableHeader 
            field="dateAdded" 
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          >
            Date Added
          </SortableHeader>
        </div>
        <div className={styles.bookmarksColumn}>
          <SortableHeader 
            field="bookmarks" 
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          >
            <BookmarkIcon />
          </SortableHeader>
        </div>
        <div className={styles.notesColumn}>
          <SortableHeader 
            field="notes" 
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          >
            <NoteIcon />
          </SortableHeader>
        </div>
        <div className={styles.statusColumn}>
          <SortableHeader 
            field="status" 
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          >
            Status
          </SortableHeader>
        </div>
      </div>
    </div>
  );
};

export default QueriesTableHeader; 