import { UserQueryObject, SortField, SortDirection } from '@/features/Projects/types/projects.d';
import Checkbox from '@/features/Core/components/Checkbox/Checkbox';
import styles from '@/features/Projects/components/TableHeader/TableHeader.module.scss';
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';
import SortableHeader from '@/features/Projects/components/SortableHeader/SortableHeader';

interface QueriesTableHeaderProps {
  activeQueries: UserQueryObject[];
  isEditing?: boolean;
  location?: "list" | "detail";
  onSort: (field: SortField) => void;
  selectedQueries: UserQueryObject[];
  setSelectedQueries: (queries: UserQueryObject[]) => void;
  sortDirection: SortDirection;
  sortField: SortField;
}

const QueriesTableHeader = ({
  activeQueries,
  isEditing = false,
  location,
  onSort,
  selectedQueries,
  setSelectedQueries,
  sortField,
  sortDirection
}: QueriesTableHeaderProps) => {
  const handleSelectAll = () => {
    if (selectedQueries.length === activeQueries.length) {
      setSelectedQueries([]);
    } else {
      setSelectedQueries([...activeQueries]);
    }
  };

  const allSelected = activeQueries.length > 0 && selectedQueries.length === activeQueries.length;
  const someSelected = selectedQueries.length > 0 && selectedQueries.length < activeQueries.length;

  const showCheckbox = location !== 'detail' || (location === 'detail' && isEditing);

  return (
    <div className={styles.tableHeader}>
      <div className={`${styles.tableRow} ${!showCheckbox && styles.detail}`}>
        {
          showCheckbox && (
            <div className={styles.checkboxColumn}>
              <Checkbox
                disabled={activeQueries.length === 0}
                checked={allSelected}
                handleClick={handleSelectAll}
                className={someSelected ? styles.indeterminate : ''}
              />
              <div className={styles.separator}></div>
            </div>
          )
        }
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