import { Project, QueryStatusObject, SortField, SortDirection } from '@/features/Projects/types/projects.d';
import Checkbox from '@/features/Core/components/Checkbox/Checkbox';
import styles from '@/features/Projects/components/TableHeader/TableHeader.module.scss';
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';
import SortableHeader from '@/features/Projects/components/SortableHeader/SortableHeader';


interface DeletedTableHeaderProps {
  selectedProjects: Project[];
  selectedQueries: QueryStatusObject[];
  setSelectedProjects: (projects: Project[]) => void;
  setSelectedQueries: (queries: QueryStatusObject[]) => void;
  activeProjects: Project[];
  activeQueries: QueryStatusObject[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

const DeletedTableHeader = ({
  selectedProjects,
  selectedQueries,
  setSelectedProjects,
  setSelectedQueries,
  activeProjects,
  activeQueries,
  sortField,
  sortDirection,
  onSort
}: DeletedTableHeaderProps) => {
  const handleSelectAll = () => {
    if (selectedProjects.length === activeProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects([...activeProjects]);
    }
    if (selectedQueries.length === activeQueries.length) {
      setSelectedQueries([]);
    } else {
      setSelectedQueries([...activeQueries]);
    }
  };

  const allProjectsSelected = activeProjects.length > 0 && selectedProjects.length === activeProjects.length;
  const someProjectsSelected = selectedProjects.length > 0 && selectedProjects.length < activeProjects.length;
  const allQueriesSelected = activeQueries.length > 0 && selectedQueries.length === activeQueries.length;
  const someQueriesSelected = selectedQueries.length > 0 && selectedQueries.length < activeQueries.length;
  const allSelected = allProjectsSelected && allQueriesSelected;
  const someSelected = someProjectsSelected || someQueriesSelected;

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

export default DeletedTableHeader; 